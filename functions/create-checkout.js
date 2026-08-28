import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const COOKIE_NAME = "dangels_admin_session";

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

    const key = cookie
      .slice(0, separator)
      .trim();

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
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const padded =
    normalized +
    "=".repeat(
      (4 - (normalized.length % 4)) % 4
    );

  const binary = atob(padded);

  const bytes =
    new Uint8Array(binary.length);

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

    const signatureValid =
      await crypto.subtle.verify(
        "HMAC",
        key,
        signatureBytes,
        new TextEncoder().encode(
          sessionPayload
        )
      );

    if (!signatureValid) {
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

export async function onRequest(
  context
) {
  const {
    request,
    env,
  } = context;

  // ============================================================
  // 1. MÉTODO HTTP
  // ============================================================

  if (
    request.method !== "POST"
  ) {
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

  // ============================================================
  // 2. VALIDAR SESIÓN ADMINISTRATIVA
  // ============================================================

  if (
    !(await isValidAdminSession(
      request,
      env
    ))
  ) {
    return jsonResponse(
      {
        error:
          "Unauthorized",
      },
      401
    );
  }

  try {
    // ============================================================
    // 3. VARIABLES DE ENTORNO
    // ============================================================

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

    // ============================================================
    // 4. INICIALIZAR STRIPE
    // ============================================================

    const stripe =
      new Stripe(
        stripeSecretKey
      );

    // ============================================================
    // 5. INICIALIZAR SUPABASE
    // ============================================================

    const supabase =
      createClient(
        supabaseUrl,
        supabaseServiceRoleKey,
        {
          auth: {
            autoRefreshToken:
              false,
            persistSession:
              false,
          },
        }
      );

    // ============================================================
    // 6. LEER BODY
    // ============================================================

    let body;

    try {
      body =
        await request.json();
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

    // ============================================================
    // 7. PROJECT ID
    // ============================================================

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

    // ============================================================
    // 8. BUSCAR PROYECTO EN SUPABASE
    // ============================================================

    const {
      data: project,
      error: projectError,
    } =
      await supabase
        .from("projects")
        .select(
          "id, project_data, paid, stripe_session_id, price_cents, currency"
        )
        .eq(
          "id",
          projectId
        )
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

    // ============================================================
    // 9. PROYECTO NO ENCONTRADO
    // ============================================================

    if (!project) {
      return jsonResponse(
        {
          error:
            "Project not found",
        },
        404
      );
    }

    // ============================================================
    // 10. VERIFICAR SI YA FUE PAGADO
    // ============================================================

    if (
      project.paid === true
    ) {
      return jsonResponse(
        {
          error:
            "Project is already paid",
        },
        409
      );
    }

    // ============================================================
    // 11. PRECIO
    // ============================================================

    const priceCents =
      Number(
        project.price_cents
      );

    if (
      !Number.isInteger(
        priceCents
      ) ||
      priceCents <= 0
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

    // ============================================================
    // 12. MONEDA
    // ============================================================

    const currency =
      String(
        project.currency ||
          "MXN"
      )
        .trim()
        .toLowerCase();

    const allowedCurrencies =
      new Set([
        "mxn",
        "usd",
        "eur",
        "cad",
        "gbp",
      ]);

    if (
      !allowedCurrencies.has(
        currency
      )
    ) {
      return jsonResponse(
        {
          error:
            "Unsupported currency",
        },
        400
      );
    }

    // ============================================================
    // 13. URL DEL SITIO
    // ============================================================

    const siteUrl =
      new URL(
        request.url
      ).origin;

    // ============================================================
    // 14. URL DE ÉXITO
    // ============================================================

    const successUrl =
      `${siteUrl}/p/${encodeURIComponent(
        projectId
      )}?payment=success&session_id={CHECKOUT_SESSION_ID}`;

    // ============================================================
    // 15. URL DE CANCELACIÓN
    // ============================================================

    const cancelUrl =
      `${siteUrl}/p/${encodeURIComponent(
        projectId
      )}?preview=1&payment=cancelled`;

    // ============================================================
    // 16. DATOS DEL PROYECTO
    // ============================================================

    const projectData =
      project.project_data &&
      typeof project.project_data ===
        "object"
        ? project.project_data
        : {};

    // ============================================================
    // 17. NOMBRE DEL PRODUCTO
    // ============================================================

    const productName =
      typeof projectData.title ===
        "string" &&
      projectData.title.trim()
        ? projectData.title.trim()
        : "Netflix Memories";

    // ============================================================
    // 18. CREAR CHECKOUT DE STRIPE
    // ============================================================

    const session =
      await stripe
        .checkout
        .sessions
        .create({
          mode: "payment",

          line_items: [
            {
              price_data: {
                currency,

                unit_amount:
                  priceCents,

                product_data: {
                  name:
                    productName,

                  description:
                    "Publicación de una experiencia personalizada Netflix Memories.",
                },
              },

              quantity: 1,
            },
          ],

          metadata: {
            project_id:
              projectId,
          },

          success_url:
            successUrl,

          cancel_url:
            cancelUrl,

          billing_address_collection:
            "auto",

          payment_method_types: [
            "card",
          ],
        });

    // ============================================================
    // 19. GUARDAR STRIPE SESSION ID
    // ============================================================

    const {
      error: updateError,
    } =
      await supabase
        .from("projects")
        .update({
          stripe_session_id:
            session.id,
        })
        .eq(
          "id",
          projectId
        )
        .eq(
          "paid",
          false
        );

    if (updateError) {
      console.error(
        "Supabase stripe_session_id update error:",
        updateError
      );

      // Intentar cancelar la sesión si Supabase
      // no pudo guardar el identificador.

      try {
        await stripe
          .checkout
          .sessions
          .expire(
            session.id
          );
      } catch (
        expireError
      ) {
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

    // ============================================================
    // 20. RESPUESTA EXITOSA
    // ============================================================

    return jsonResponse(
      {
        success: true,

        checkoutUrl:
          session.url,

        sessionId:
          session.id,
      },
      200
    );
  } catch (error) {
    // ============================================================
    // 21. ERROR GENERAL
    // ============================================================

    console.error(
      "Create checkout error:",
      error
    );

    return jsonResponse(
      {
        error:
          "Unable to create checkout session",
      },
      500
    );
  }
}