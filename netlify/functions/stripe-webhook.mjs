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

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export default async (request) => {
  // ============================================================
  // 1. SOLO POST
  // ============================================================

  if (request.method !== "POST") {
    return jsonResponse(
      {
        error: "Method not allowed",
      },
      405
    );
  }

  // ============================================================
  // 2. VERIFICAR VARIABLES DE ENTORNO
  // ============================================================

  const stripeSecretKey =
    process.env.STRIPE_SECRET_KEY;

  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET;

  const supabaseUrl =
    process.env.SUPABASE_URL;

  const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey) {
    console.error(
      "STRIPE_SECRET_KEY is not configured"
    );

    return jsonResponse(
      {
        error: "Server configuration error",
      },
      500
    );
  }

  if (!webhookSecret) {
    console.error(
      "STRIPE_WEBHOOK_SECRET is not configured"
    );

    return jsonResponse(
      {
        error: "Server configuration error",
      },
      500
    );
  }

  if (!supabaseUrl) {
    console.error(
      "SUPABASE_URL is not configured"
    );

    return jsonResponse(
      {
        error: "Server configuration error",
      },
      500
    );
  }

  if (!supabaseServiceRoleKey) {
    console.error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured"
    );

    return jsonResponse(
      {
        error: "Server configuration error",
      },
      500
    );
  }

  // ============================================================
  // 3. OBTENER EL BODY RAW
  //
  // IMPORTANTE:
  // Stripe necesita exactamente el cuerpo original para poder
  // verificar la firma.
  // ============================================================

  const signature =
    request.headers.get("stripe-signature");

  if (!signature) {
    console.error(
      "Missing Stripe-Signature header"
    );

    return jsonResponse(
      {
        error: "Missing Stripe signature",
      },
      400
    );
  }

  let rawBody;

  try {
    rawBody = await request.text();
  } catch (error) {
    console.error(
      "Unable to read webhook body:",
      error
    );

    return jsonResponse(
      {
        error: "Unable to read request body",
      },
      400
    );
  }

  // ============================================================
  // 4. VERIFICAR FIRMA DE STRIPE
  //
  // Esta es una de las partes más importantes de seguridad.
  //
  // Si alguien intenta llamar manualmente a:
  //
  // /.netlify/functions/stripe-webhook
  //
  // no podrá marcar un proyecto como pagado sin una firma
  // válida generada por Stripe.
  // ============================================================

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error(
      "Stripe webhook signature verification failed:",
      error.message
    );

    return jsonResponse(
      {
        error: "Invalid webhook signature",
      },
      400
    );
  }

  // ============================================================
  // 5. CLIENTE SUPABASE SERVER-SIDE
  // ============================================================

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

  // ============================================================
  // 6. PROCESAR ÚNICAMENTE CHECKOUT COMPLETADO
  // ============================================================

  if (
    event.type !==
    "checkout.session.completed"
  ) {
    return jsonResponse({
      received: true,
      ignored: true,
      eventType: event.type,
    });
  }

  const session = event.data.object;

  // ============================================================
  // 7. COMPROBAR QUE REALMENTE SEA UN PAGO
  // ============================================================

  if (session.mode !== "payment") {
    console.error(
      "Checkout session is not a one-time payment:",
      session.id
    );

    return jsonResponse(
      {
        error: "Invalid checkout mode",
      },
      400
    );
  }

  // ============================================================
  // 8. COMPROBAR ESTADO DEL PAGO
  // ============================================================

  if (session.payment_status !== "paid") {
    console.error(
      "Checkout completed but payment is not marked paid:",
      session.id,
      session.payment_status
    );

    return jsonResponse(
      {
        received: true,
        paid: false,
      },
      200
    );
  }

  // ============================================================
  // 9. OBTENER PROJECT ID DESDE METADATA
  //
  // create-checkout.mjs coloca:
  //
  // metadata: {
  //   project_id: projectId
  // }
  //
  // Nunca confiamos en un projectId enviado por el navegador
  // durante el webhook.
  // ============================================================

  const projectId =
    session.metadata?.project_id;

  if (
    typeof projectId !== "string" ||
    !projectId.trim()
  ) {
    console.error(
      "Stripe session does not contain project_id:",
      session.id
    );

    return jsonResponse(
      {
        error: "Missing project metadata",
      },
      400
    );
  }

  // ============================================================
  // 10. BUSCAR EL PROYECTO
  // ============================================================

  const {
    data: project,
    error: projectError,
  } = await supabase
    .from("projects")
    .select(
      "id, paid, stripe_session_id, price_cents, currency"
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
        error: "Unable to load project",
      },
      500
    );
  }

  if (!project) {
    console.error(
      "Project not found:",
      projectId
    );

    return jsonResponse(
      {
        error: "Project not found",
      },
      404
    );
  }

  // ============================================================
  // 11. COMPROBAR QUE LA SESIÓN PERTENEZCA AL PROYECTO
  //
  // Evita asociar accidentalmente una sesión de Stripe
  // diferente con este proyecto.
  // ============================================================

  if (
    project.stripe_session_id &&
    project.stripe_session_id !== session.id
  ) {
    console.error(
      "Stripe session does not match project session:",
      {
        projectId,
        storedSessionId:
          project.stripe_session_id,
        receivedSessionId: session.id,
      }
    );

    return jsonResponse(
      {
        error: "Stripe session mismatch",
      },
      400
    );
  }

  // ============================================================
  // 12. VALIDAR EL IMPORTE PAGADO
  //
  // No basta con que Stripe diga "paid".
  // Comprobamos que el importe corresponda al precio
  // almacenado para el proyecto.
  // ============================================================

  const expectedAmount =
    Number(project.price_cents);

  const receivedAmount =
    Number(session.amount_total);

  if (
    !Number.isInteger(expectedAmount) ||
    expectedAmount <= 0
  ) {
    console.error(
      "Invalid stored project price:",
      projectId,
      project.price_cents
    );

    return jsonResponse(
      {
        error: "Invalid project price",
      },
      500
    );
  }

  if (
    !Number.isInteger(receivedAmount) ||
    receivedAmount !== expectedAmount
  ) {
    console.error(
      "Stripe amount does not match project price:",
      {
        projectId,
        expectedAmount,
        receivedAmount,
      }
    );

    return jsonResponse(
      {
        error: "Payment amount mismatch",
      },
      400
    );
  }

  // ============================================================
  // 13. VALIDAR MONEDA
  // ============================================================

  const expectedCurrency =
    String(project.currency || "MXN")
      .toLowerCase();

  const receivedCurrency =
    String(session.currency || "")
      .toLowerCase();

  if (
    !expectedCurrency ||
    expectedCurrency !== receivedCurrency
  ) {
    console.error(
      "Stripe currency does not match project currency:",
      {
        projectId,
        expectedCurrency,
        receivedCurrency,
      }
    );

    return jsonResponse(
      {
        error: "Payment currency mismatch",
      },
      400
    );
  }

  // ============================================================
  // 14. MARCAR PROYECTO COMO PAGADO
  //
  // IMPORTANTE:
  //
  // Solo el webhook de Stripe puede llegar a esta parte.
  //
  // paid_at se establece en el servidor.
  // ============================================================

  const paidAt =
    new Date().toISOString();

  const {
    data: updatedProject,
    error: updateError,
  } = await supabase
    .from("projects")
    .update({
      paid: true,
      paid_at: paidAt,
      stripe_session_id: session.id,
    })
    .eq("id", projectId)
    .eq("paid", false)
    .select(
      "id, paid, paid_at, stripe_session_id"
    )
    .maybeSingle();

  if (updateError) {
    console.error(
      "Supabase payment update error:",
      updateError
    );

    return jsonResponse(
      {
        error: "Unable to mark project as paid",
      },
      500
    );
  }

  // ============================================================
  // 15. IDEMPOTENCIA
  //
  // Stripe puede enviar el mismo evento más de una vez.
  //
  // Si el proyecto ya estaba pagado, no debemos generar
  // ningún efecto adicional.
  // ============================================================

  if (!updatedProject) {
    const {
      data: existingProject,
      error: existingError,
    } = await supabase
      .from("projects")
      .select(
        "id, paid, paid_at, stripe_session_id"
      )
      .eq("id", projectId)
      .maybeSingle();

    if (existingError) {
      console.error(
        "Unable to verify existing paid project:",
        existingError
      );

      return jsonResponse(
        {
          error: "Unable to verify payment state",
        },
        500
      );
    }

    if (
      existingProject?.paid === true &&
      existingProject?.stripe_session_id ===
        session.id
    ) {
      return jsonResponse({
        received: true,
        paid: true,
        alreadyProcessed: true,
        projectId,
      });
    }

    console.error(
      "Project payment state could not be updated safely:",
      projectId
    );

    return jsonResponse(
      {
        error: "Unable to update payment state",
      },
      409
    );
  }

  // ============================================================
  // 16. RESPUESTA FINAL
  // ============================================================

  return jsonResponse({
    received: true,
    paid: true,
    projectId,
    paidAt,
  });
};