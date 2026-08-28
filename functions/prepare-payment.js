import { createClient } from "@supabase/supabase-js";

const DEFAULT_CURRENCY = "mxn";

const MAX_HTML_LENGTH = 5 * 1024 * 1024;

const MAX_PRICE_CENTS = 10_000_000;

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) {
    return "";
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const separator = cookie.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const key =
      cookie.slice(0, separator).trim();

    if (key !== name) {
      continue;
    }

    return cookie
      .slice(separator + 1)
      .trim();
  }

  return "";
}

function base64UrlToBytes(value) {
  const normalized =
    value
      .replace(/-/g, "+")
      .replace(/_/g, "/");

  const padded =
    normalized +
    "=".repeat(
      (4 - (normalized.length % 4)) % 4
    );

  const binary =
    atob(padded);

  const bytes =
    new Uint8Array(
      binary.length
    );

  for (
    let index = 0;
    index < binary.length;
    index += 1
  ) {
    bytes[index] =
      binary.charCodeAt(index);
  }

  return bytes;
}

async function isValidAdminSession(
  request,
  env
) {
  const COOKIE_NAME =
    "dangels_admin_session";

  const cookieHeader =
    request.headers.get("cookie") || "";

  const sessionToken =
    getCookieValue(
      cookieHeader,
      COOKIE_NAME
    );

  if (!sessionToken) {
    return false;
  }

  const sessionParts =
    sessionToken.split(".");

  if (
    sessionParts.length !== 2
  ) {
    return false;
  }

  const [
    sessionPayload,
    sessionSignature,
  ] = sessionParts;

  const sessionSecret =
    env?.ADMIN_SESSION_SECRET;

  if (!sessionSecret) {
    console.error(
      "Missing ADMIN_SESSION_SECRET."
    );

    return false;
  }

  try {
    const key =
      await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(
          sessionSecret
        ),
        {
          name: "HMAC",
          hash: "SHA-256",
        },
        false,
        ["verify"]
      );

    const signatureBytes =
      base64UrlToBytes(
        sessionSignature
      );

    const valid =
      await crypto.subtle.verify(
        "HMAC",
        key,
        signatureBytes,
        new TextEncoder().encode(
          sessionPayload
        )
      );

    if (!valid) {
      return false;
    }

    const sessionData =
      JSON.parse(
        new TextDecoder().decode(
          base64UrlToBytes(
            sessionPayload
          )
        )
      );

    if (
      !sessionData?.exp ||
      sessionData.exp <=
        Math.floor(
          Date.now() / 1000
        )
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function response(
  statusCode,
  body
) {
  return new Response(
    JSON.stringify(body),
    {
      status: statusCode,
      headers,
    }
  );
}

function cleanProjectData(
  project
) {
  if (
    !project ||
    typeof project !==
      "object" ||
    Array.isArray(project)
  ) {
    return null;
  }

  const {
    paid,
    paid_at,
    stripe_session_id,
    ...safeProject
  } = project;

  return safeProject;
}

function validatePrice(
  project
) {
  const rawPrice =
    project?.priceCents;

  const priceCents =
    Number(rawPrice);

  if (
    !Number.isInteger(
      priceCents
    ) ||
    priceCents <= 0
  ) {
    return {
      valid: false,
      error:
        "Invalid project price.",
    };
  }

  if (
    priceCents >
    MAX_PRICE_CENTS
  ) {
    return {
      valid: false,
      error:
        "Project price exceeds the allowed limit.",
    };
  }

  return {
    valid: true,
    priceCents,
  };
}

function validateCurrency(
  project
) {
  const submittedCurrency =
    String(
      project?.currency || ""
    )
      .trim()
      .toLowerCase();

  if (
    submittedCurrency !==
    DEFAULT_CURRENCY
  ) {
    return {
      valid: false,
      error:
        "Unsupported project currency.",
    };
  }

  return {
    valid: true,
    currency:
      DEFAULT_CURRENCY,
  };
}

export default async function onRequest(
  context
) {
  const {
    request,
    env,
  } = context;

  if (
    request.method ===
    "OPTIONS"
  ) {
    return new Response(
      null,
      {
        status: 204,
        headers,
      }
    );
  }

  if (
    request.method !==
    "POST"
  ) {
    return response(
      405,
      {
        error:
          "Method not allowed",
      }
    );
  }

  if (
    !(await isValidAdminSession(
      request,
      env
    ))
  ) {
    return response(
      401,
      {
        error:
          "Unauthorized",
      }
    );
  }

  const SUPABASE_URL =
    env?.SUPABASE_URL;

  const SUPABASE_SERVICE_ROLE_KEY =
    env?.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.error(
      "Missing Supabase environment variables."
    );

    return response(
      500,
      {
        error:
          "Server configuration error.",
      }
    );
  }

  let body;

  try {
    body =
      await request.json();
  } catch {
    return response(
      400,
      {
        error:
          "Invalid JSON body.",
      }
    );
  }

  const project =
    cleanProjectData(
      body?.project
    );

  const html =
    typeof body?.html ===
      "string"
      ? body.html
      : "";

  if (!project) {
    return response(
      400,
      {
        error:
          "A valid project is required.",
      }
    );
  }

  if (!html.trim()) {
    return response(
      400,
      {
        error:
          "The generated HTML is required.",
      }
    );
  }

  if (
    html.length >
    MAX_HTML_LENGTH
  ) {
    return response(
      413,
      {
        error:
          "The generated HTML is too large.",
      }
    );
  }

  const priceValidation =
    validatePrice(
      project
    );

  if (
    !priceValidation.valid
  ) {
    return response(
      400,
      {
        error:
          priceValidation.error,
      }
    );
  }

  const currencyValidation =
    validateCurrency(
      project
    );

  if (
    !currencyValidation.valid
  ) {
    return response(
      400,
      {
        error:
          currencyValidation.error,
      }
    );
  }

  const priceCents =
    priceValidation.priceCents;

  const currency =
    currencyValidation.currency;

  const supabase =
    createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken:
            false,
          persistSession:
            false,
        },
      }
    );

  const projectData = {
    ...project,

    priceCents,

    currency:
      currency.toUpperCase(),

    paid: false,

    paid_at: null,

    stripe_session_id:
      null,
  };

  const {
    data,
    error,
  } =
    await supabase
      .from("projects")
      .insert({
        project_data:
          projectData,

        html,

        price_cents:
          priceCents,

        currency:
          currency.toUpperCase(),

        paid: false,

        stripe_session_id:
          null,

        paid_at:
          null,
      })
      .select(
        "id, price_cents, currency, paid, created_at"
      )
      .single();

  if (error) {
    console.error(
      "Supabase insert error:",
      error
    );

    return response(
      500,
      {
        error:
          "Could not create the pending project.",
      }
    );
  }

  return response(
    200,
    {
      success: true,

      projectId:
        data.id,

      priceCents:
        data.price_cents,

      currency:
        data.currency,
    }
  );
}