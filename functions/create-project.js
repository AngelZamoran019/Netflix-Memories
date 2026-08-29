import { createClient } from "@supabase/supabase-js";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function normalizeCurrency(value) {
  return String(value || "MXN")
    .trim()
    .toUpperCase();
}

function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return "";

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const separator = cookie.indexOf("=");

    if (separator === -1) continue;

    const key = cookie.slice(0, separator).trim();

    if (key !== name) continue;

    return cookie.slice(separator + 1).trim();
  }

  return "";
}

function base64UrlToBytes(value) {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const padded =
    normalized +
    "=".repeat((4 - (normalized.length % 4)) % 4);

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function verifyAdminSession(request, env) {
  const COOKIE_NAME = "dangels_admin_session";

  const sessionToken = getCookieValue(
    request.headers.get("cookie"),
    COOKIE_NAME
  );

  if (!sessionToken) return false;

  const sessionParts = sessionToken.split(".");

  if (sessionParts.length !== 2) return false;

  const [sessionPayload, sessionSignature] = sessionParts;

  const sessionSecret = env?.ADMIN_SESSION_SECRET;

  if (!sessionSecret) {
    console.error("Missing ADMIN_SESSION_SECRET.");
    return false;
  }

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(sessionSecret),
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["verify"]
    );

    const signatureBytes =
      base64UrlToBytes(sessionSignature);

    const signatureValid =
      await crypto.subtle.verify(
        "HMAC",
        key,
        signatureBytes,
        new TextEncoder().encode(sessionPayload)
      );

    if (!signatureValid) return false;

    const sessionData = JSON.parse(
      new TextDecoder().decode(
        base64UrlToBytes(sessionPayload)
      )
    );

    if (
      !sessionData?.exp ||
      sessionData.exp <=
        Math.floor(Date.now() / 1000)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function onRequest(context) {
  const { request, env } = context;

  try {
    if (request.method !== "POST") {
      return jsonResponse(
        {
          error: "Method not allowed",
        },
        405
      );
    }

    if (!(await verifyAdminSession(request, env))) {
      return jsonResponse(
        {
          error: "Unauthorized",
        },
        401
      );
    }

    const supabaseUrl =
      env?.SUPABASE_URL;

    const supabaseServiceRoleKey =
      env?.SUPABASE_SERVICE_ROLE_KEY;

    if (
      !supabaseUrl ||
      !supabaseServiceRoleKey
    ) {
      console.error(
        "Missing Supabase environment variables."
      );

      return jsonResponse(
        {
          error: "Server configuration error",
        },
        500
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    let body;

    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        {
          error: "Invalid JSON body",
        },
        400
      );
    }

    if (!isPlainObject(body)) {
      return jsonResponse(
        {
          error: "Invalid request body",
        },
        400
      );
    }

    const {
      projectData,
      html,
      priceCents,
      currency = "MXN",
      unlocked = false,
    } = body;

    if (!isPlainObject(projectData)) {
      return jsonResponse(
        {
          error: "projectData is required",
        },
        400
      );
    }

    if (
      typeof html !== "string" ||
      !html.trim()
    ) {
      return jsonResponse(
        {
          error: "html is required",
        },
        400
      );
    }

    if (html.length > 15_000_000) {
      return jsonResponse(
        {
          error: "HTML payload is too large",
        },
        413
      );
    }

    if (
      !Number.isInteger(priceCents) ||
      priceCents <= 0
    ) {
      return jsonResponse(
        {
          error: "Invalid price",
        },
        400
      );
    }

    if (priceCents > 10_000_000) {
      return jsonResponse(
        {
          error: "Price exceeds allowed limit",
        },
        400
      );
    }

    const normalizedCurrency =
      normalizeCurrency(currency);

    if (normalizedCurrency !== "MXN") {
      return jsonResponse(
        {
          error: "Unsupported currency",
        },
        400
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from("projects")
      .insert({
        project_data: projectData,
        html,
        price_cents: priceCents,
        currency: normalizedCurrency,
        paid: unlocked === true,
        stripe_session_id: null,
        paid_at: unlocked === true
          ? new Date().toISOString()
          : null,
      })
      .select(
        "id, price_cents, currency, paid, created_at"
      )
      .single();

    if (error) {
      console.error(
        "Supabase project creation error:",
        error
      );

      return jsonResponse(
        {
          error: "Could not create project",
        },
        500
      );
    }

    return jsonResponse(
      {
        success: true,
        project: data,
      },
      201
    );
  } catch (error) {
    console.error(
      "create-project function error:",
      error
    );

    return jsonResponse(
      {
        error: "Internal server error",
      },
      500
    );
  }
}