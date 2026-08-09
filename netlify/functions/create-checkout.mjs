import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default async (request) => {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed",
      }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          Allow: "POST",
        },
      }
    );
  }

  try {
    const body = await request.json();

    const projectId =
      typeof body?.projectId === "string"
        ? body.projectId.trim()
        : "";

    if (!projectId) {
      return new Response(
        JSON.stringify({
          error: "projectId is required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    if (!process.env.SUPABASE_URL) {
      throw new Error("SUPABASE_URL is not configured");
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        "id, project_data, paid, stripe_session_id, price_cents, currency"
      )
      .eq("id", projectId)
      .maybeSingle();

    if (projectError) {
      console.error("Supabase project lookup error:", projectError);

      return new Response(
        JSON.stringify({
          error: "Unable to load project",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!project) {
      return new Response(
        JSON.stringify({
          error: "Project not found",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (project.paid === true) {
      return new Response(
        JSON.stringify({
          error: "Project is already paid",
        }),
        {
          status: 409,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const priceCents = Number(project.price_cents);

    if (!Number.isInteger(priceCents) || priceCents <= 0) {
      return new Response(
        JSON.stringify({
          error: "Project price is invalid",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const currency = String(project.currency || "MXN").toLowerCase();

    const allowedCurrencies = new Set([
      "mxn",
      "usd",
      "eur",
      "cad",
      "gbp",
    ]);

    if (!allowedCurrencies.has(currency)) {
      return new Response(
        JSON.stringify({
          error: "Unsupported currency",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const siteUrl =
      process.env.URL ||
      process.env.DEPLOY_PRIME_URL ||
      new URL(request.url).origin;

    const successUrl =
      `${siteUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl =
      `${siteUrl}/?payment=cancelled&project_id=${encodeURIComponent(
        projectId
      )}`;

    const projectData =
      project.project_data &&
      typeof project.project_data === "object"
        ? project.project_data
        : {};

    const productName =
      typeof projectData.title === "string" &&
      projectData.title.trim()
        ? projectData.title.trim()
        : "Netflix Memories";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency,
            unit_amount: priceCents,
            product_data: {
              name: productName,
              description:
                "Publicación de una experiencia personalizada Netflix Memories.",
            },
          },
          quantity: 1,
        },
      ],

      metadata: {
        project_id: projectId,
      },

      success_url: successUrl,
      cancel_url: cancelUrl,

      billing_address_collection: "auto",

      payment_method_types: [
        "card",
      ],
    });

    const { error: updateError } = await supabase
      .from("projects")
      .update({
        stripe_session_id: session.id,
      })
      .eq("id", projectId)
      .eq("paid", false);

    if (updateError) {
      console.error(
        "Supabase stripe_session_id update error:",
        updateError
      );

      try {
        await stripe.checkout.sessions.expire(session.id);
      } catch (expireError) {
        console.error(
          "Unable to expire Stripe Checkout session:",
          expireError
        );
      }

      return new Response(
        JSON.stringify({
          error: "Unable to prepare payment",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Create checkout error:", error);

    return new Response(
      JSON.stringify({
        error: "Unable to create checkout session",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};