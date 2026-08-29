import { createClient } from "@supabase/supabase-js";

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function response(statusCode, body) {
  return new Response(
    JSON.stringify(body),
    {
      status: statusCode,
      headers,
    }
  );
}

export async function onRequest(context) {
  const {
    request,
    env,
  } = context;

  if (
    request.method === "OPTIONS"
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
    request.method !== "GET"
  ) {
    return response(
      405,
      {
        error:
          "Method not allowed",
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

  const url =
    new URL(request.url);

  const projectId =
    String(
      url.searchParams.get("id") ||
        ""
    ).trim();

  const experienceMode =
    url.searchParams.get(
      "view"
    ) === "experience";

  if (!projectId) {
    return response(
      400,
      {
        error:
          "Project id is required.",
      }
    );
  }

  const supabase =
    createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

  const {
    data,
    error,
  } =
    await supabase
      .from("projects")
      .select(
        "id, project_data, html, paid, paid_at, price_cents, currency"
      )
      .eq(
        "id",
        projectId
      )
      .maybeSingle();

  if (error) {
    console.error(
      "Supabase public project lookup error:",
      error
    );

    return response(
      500,
      {
        error:
          "Unable to load project.",
      }
    );
  }

  if (!data) {
    return response(
      404,
      {
        error:
          "Project not found.",
      }
    );
  }

  if (
    experienceMode &&
    data.paid !== true
  ) {
    return response(
      403,
      {
        error:
          "La experiencia todavía no está desbloqueada.",
      }
    );
  }

  if (
    typeof data.html !==
      "string" ||
    !data.html.trim()
  ) {
    console.error(
      "Public project has no HTML:",
      projectId
    );

    return response(
      500,
      {
        error:
          "Public project has no HTML.",
      }
    );
  }

  const projectData =
    data.project_data &&
    typeof data.project_data ===
      "object"
      ? data.project_data
      : {};

  return response(
    200,
    {
      success: true,

      projectId:
        data.id,

      paid:
        data.paid === true,

      paidAt:
        data.paid_at,

      priceCents:
        Number.isInteger(
          Number(
            data.price_cents
          )
        )
          ? Number(
              data.price_cents
            )
          : 11000,

      currency:
        typeof data.currency ===
          "string" &&
        data.currency.trim()
          ? data.currency
              .trim()
              .toUpperCase()
          : "MXN",

      title:
        typeof projectData.title ===
          "string"
          ? projectData.title
          : "Netflix Memories",

      html:
        data.html,
    }
  );
}