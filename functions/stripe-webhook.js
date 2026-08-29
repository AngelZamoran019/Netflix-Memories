import { createClient } from "@supabase/supabase-js";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const STRIPE_SIGNATURE_TOLERANCE = 300;

function jsonResponse(body, status = 200) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: JSON_HEADERS,
    }
  );
}

function hexToBytes(hex) {
  if (
    typeof hex !== "string" ||
    hex.length % 2 !== 0
  ) {
    return null;
  }

  const bytes = new Uint8Array(hex.length / 2);

  for (let index = 0; index < bytes.length; index += 1) {
    const value = Number.parseInt(
      hex.slice(index * 2, index * 2 + 2),
      16
    );

    if (Number.isNaN(value)) {
      return null;
    }

    bytes[index] = value;
  }

  return bytes;
}

function bytesEqual(left, right) {
  if (
    !left ||
    !right ||
    left.length !== right.length
  ) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }

  return difference === 0;
}

function parseStripeSignature(signatureHeader) {
  const parts = String(signatureHeader || "")
    .split(",")
    .map((part) => part.trim());

  let timestamp = null;
  const signatures = [];

  for (const part of parts) {
    const separator = part.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const key = part.slice(0, separator);
    const value = part.slice(separator + 1);

    if (key === "t") {
      timestamp = Number(value);
      continue;
    }

    if (key === "v1" && value) {
      signatures.push(value);
    }
  }

  return {
    timestamp,
    signatures,
  };
}

async function verifyStripeSignature({
  rawBody,
  signatureHeader,
  webhookSecret,
}) {
  const {
    timestamp,
    signatures,
  } = parseStripeSignature(signatureHeader);

  if (
    !Number.isInteger(timestamp) ||
    signatures.length === 0
  ) {
    return false;
  }

  const age = Math.abs(
    Math.floor(Date.now() / 1000) - timestamp
  );

  if (age > STRIPE_SIGNATURE_TOLERANCE) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(webhookSecret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signedPayload = `${timestamp}.${rawBody}`;

  const expectedSignature = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(signedPayload)
    )
  );

  return signatures.some((signature) =>
    bytesEqual(
      expectedSignature,
      hexToBytes(signature)
    )
  );
}

export async function onRequest(context) {
  const {
    request,
    env,
  } = context;

  if (request.method !== "POST") {
    return jsonResponse(
      {
        error: "Method not allowed",
      },
      405
    );
  }

  const webhookSecret =
    env?.STRIPE_WEBHOOK_SECRET;

  const supabaseUrl =
    env?.SUPABASE_URL;

  const supabaseServiceRoleKey =
    env?.SUPABASE_SERVICE_ROLE_KEY;

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

  try {
    const valid = await verifyStripeSignature({
      rawBody,
      signatureHeader: signature,
      webhookSecret,
    });

    if (!valid) {
      throw new Error("Invalid Stripe signature");
    }
  } catch (error) {
    console.error(
      "Stripe webhook signature verification failed:",
      error?.message || error
    );

    return jsonResponse(
      {
        error: "Invalid webhook signature",
      },
      400
    );
  }

  let event;

  try {
    event = JSON.parse(rawBody);
  } catch (error) {
    console.error(
      "Invalid Stripe webhook JSON:",
      error
    );

    return jsonResponse(
      {
        error: "Invalid webhook payload",
      },
      400
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

  if (
    event?.type !==
    "checkout.session.completed"
  ) {
    return jsonResponse({
      received: true,
      ignored: true,
      eventType: event?.type || null,
    });
  }

  const session = event?.data?.object;

  if (
    !session ||
    session.mode !== "payment"
  ) {
    console.error(
      "Checkout session is not a one-time payment:",
      session?.id
    );

    return jsonResponse(
      {
        error: "Invalid checkout mode",
      },
      400
    );
  }

  if (
    session.payment_status !== "paid"
  ) {
    console.error(
      "Checkout completed but payment is not marked paid:",
      session.id,
      session.payment_status
    );

    return jsonResponse({
      received: true,
      paid: false,
    });
  }

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
        receivedSessionId:
          session.id,
      }
    );

    return jsonResponse(
      {
        error: "Stripe session mismatch",
      },
      400
    );
  }

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

  const expectedCurrency = String(
    project.currency || ""
  ).toLowerCase();

  const receivedCurrency = String(
    session.currency || ""
  ).toLowerCase();

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
          error:
            "Unable to verify payment state",
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
        error:
          "Unable to update payment state",
      },
      409
    );
  }

  return jsonResponse({
    received: true,
    paid: true,
    projectId,
    paidAt,
  });
}
