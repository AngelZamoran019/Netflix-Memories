import { createClient } from "@supabase/supabase-js";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function jsonResponse(
  body,
  status = 200,
  extraHeaders = {}
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...JSON_HEADERS,
        ...extraHeaders,
      },
    }
  );
}

async function stripeRequest(
  secretKey,
  path,
  options = {}
) {
  const response = await fetch(
    `https://api.stripe.com/v1/${path}`,
    {
      method:
        options.method || "GET",
      headers: {
        Authorization:
          `Bearer ${secretKey}`,
        ...(options.body
          ? {
              "Content-Type":
                "application/x-www-form-urlencoded",
            }
          : {}),
      },
      body: options.body,
    }
  );

  const text = await response.text();

  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        `Stripe API error (${response.status})`
    );
  }

  return data;
}

function buildCheckoutBody({
  projectId,
  productName,
  priceCents,
  currency,
  successUrl,
  cancelUrl,
}) {
  const body = new URLSearchParams();

  body.set("mode", "payment");
  body.set("success_url", successUrl);
  body.set("cancel_url", cancelUrl);
  body.set(
    "billing_address_collection",
    "auto"
  );
  body.set(
    "payment_method_types[0]",
    "card"
  );

  body.set(
    "line_items[0][price_data][currency]",
    currency
  );
  body.set(
    "line_items[0][price_data][unit_amount]",
    String(priceCents)
  );
  body.set(
    "line_items[0][price_data][product_data][name]",
    productName
  );
  body.set(
    "line_items[0][price_data][product_data][description]",
    "Publicación de una experiencia personalizada Netflix Memories."
  );
  body.set(
    "line_items[0][quantity]",
    "1"
  );

  body.set(
    "metadata[project_id]",
    projectId
  );

  return body;
}

export async function onRequest(context) {
  const {
    request,
    env,
  } = context;

  if (request.method !== "POST") {
    return jsonResponse(
      {
        error:
          "Method not allowed",
      },
      405,
      {
        Allow: "POST",
      }
    );
  }

  try {
    const stripeSecretKey =
      env?.STRIPE_SECRET_KEY;

    const supabaseUrl =
      env?.SUPABASE_URL;

    const supabaseServiceRoleKey =
      env?.SUPABASE_SERVICE_ROLE_KEY;

    if (!stripeSecretKey) {
      console.error(
        "STRIPE_SECRET_KEY is not configured."
      );

      return jsonResponse(
        {
          error:
            "Stripe no está configurado correctamente.",
        },
        500
      );
    }

    if (!supabaseUrl) {
      console.error(
        "SUPABASE_URL is not configured."
      );

      return jsonResponse(
        {
          error:
            "Supabase URL no está configurada correctamente.",
        },
        500
      );
    }

    if (!supabaseServiceRoleKey) {
      console.error(
        "SUPABASE_SERVICE_ROLE_KEY is not configured."
      );

      return jsonResponse(
        {
          error:
            "Supabase Service Role Key no está configurada correctamente.",
        },
        500
      );
    }

    let body;

    try {
      body = await request.json();
    } catch (error) {
      console.error(
        "Invalid checkout request JSON:",
        error
      );

      return jsonResponse(
        {
          error:
            "Invalid JSON body",
        },
        400
      );
    }

    const projectId =
      typeof body?.projectId ===
      "string"
        ? body.projectId.trim()
        : "";

    if (!projectId) {
      return jsonResponse(
        {
          error:
            "projectId is required",
        },
        400
      );
    }

    const supabase =
      createClient(
        supabaseUrl,
        supabaseServiceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

    const {
      data: project,
      error: projectError,
    } = await supabase
      .from("projects")
      .select(
        "id, project_data, paid, stripe_session_id, price_cents, currency"
      )
      .eq("id", projectId)
      .maybeSingle();

    if (projectError) {
      console.error(
        "Supabase project lookup error:",
        projectError
      );

      return jsonResponse(
        {
          error:
            "Unable to load project",
        },
        500
      );
    }

    if (!project) {
      return jsonResponse(
        {
          error:
            "Project not found",
        },
        404
      );
    }

    if (project.paid === true) {
      return jsonResponse(
        {
          error:
            "Project is already paid",
        },
        409
      );
    }

    const priceCents =
      Number(project.price_cents);

    if (
      !Number.isInteger(priceCents) ||
      priceCents <= 0 ||
      priceCents > 10_000_000
    ) {
      console.error(
        "Invalid project price:",
        {
          projectId,
          priceCents:
            project.price_cents,
        }
      );

      return jsonResponse(
        {
          error:
            "Project price is invalid",
        },
        400
      );
    }

    const currency = String(
      project.currency || "MXN"
    )
      .trim()
      .toLowerCase();

    if (currency !== "mxn") {
      return jsonResponse(
        {
          error:
            "Unsupported currency",
        },
        400
      );
    }

    const projectData =
      project.project_data &&
      typeof project.project_data ===
        "object"
        ? project.project_data
        : {};

    const productName =
      typeof projectData.title ===
        "string" &&
      projectData.title.trim()
        ? projectData.title.trim()
        : "Netflix Memories";

    const siteUrl =
      new URL(request.url).origin;

    const successUrl =
      `${siteUrl}/p/${encodeURIComponent(
        projectId
      )}?payment=success&session_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl =
      `${siteUrl}/p/${encodeURIComponent(
        projectId
      )}?preview=1&payment=cancelled`;

    if (project.stripe_session_id) {
      try {
        const existingSession =
          await stripeRequest(
            stripeSecretKey,
            `checkout/sessions/${encodeURIComponent(
              project.stripe_session_id
            )}`
          );

        if (
          existingSession?.status ===
            "open" &&
          existingSession?.url
        ) {
          return jsonResponse({
            success: true,
            checkoutUrl:
              existingSession.url,
            sessionId:
              existingSession.id,
          });
        }
      } catch (error) {
        console.warn(
          "Unable to reuse previous Stripe checkout session:",
          error
        );
      }
    }

    const checkoutBody =
      buildCheckoutBody({
        projectId,
        productName,
        priceCents,
        currency,
        successUrl,
        cancelUrl,
      });

    const session =
      await stripeRequest(
        stripeSecretKey,
        "checkout/sessions",
        {
          method: "POST",
          body: checkoutBody.toString(),
        }
      );

    if (!session?.id || !session?.url) {
      throw new Error(
        "Stripe no devolvió una sesión de Checkout válida."
      );
    }

    const {
      error: updateError,
    } = await supabase
      .from("projects")
      .update({
        stripe_session_id:
          session.id,
      })
      .eq("id", projectId)
      .eq("paid", false);

    if (updateError) {
      console.error(
        "Supabase stripe_session_id update error:",
        updateError
      );

      try {
        await stripeRequest(
          stripeSecretKey,
          `checkout/sessions/${encodeURIComponent(
            session.id
          )}/expire`,
          {
            method: "POST",
            body: "",
          }
        );
      } catch (expireError) {
        console.error(
          "Unable to expire Stripe Checkout session:",
          expireError
        );
      }

      return jsonResponse(
        {
          error:
            "Unable to prepare payment",
        },
        500
      );
    }

    return jsonResponse({
      success: true,
      checkoutUrl:
        session.url,
      sessionId:
        session.id,
    });
  } catch (error) {
    console.error(
      "Create checkout error:",
      error
    );

    return jsonResponse(
      {
        error:
          error?.message ||
          "Unable to create checkout session",
      },
      500
    );
  }
}
