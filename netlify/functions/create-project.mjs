import { getUser } from "@netlify/identity";
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

export default async (request) => {
  try {
    // ============================================================
    // 1. SOLO PETICIONES POST
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
    // 2. VERIFICAR USUARIO NETLIFY
    // ============================================================

    const user = await getUser();

    if (!user) {
      return jsonResponse(
        {
          error: "Unauthorized",
        },
        401
      );
    }

    // ============================================================
    // 3. VERIFICAR ROL ADMIN
    //
    // Esta función crea proyectos desde el panel administrativo.
    // El pago público NO utilizará esta función.
    // ============================================================

    if (!Array.isArray(user.roles) || !user.roles.includes("admin")) {
      return jsonResponse(
        {
          error: "Forbidden",
        },
        403
      );
    }

    // ============================================================
    // 4. LEER VARIABLES SECRETAS
    // ============================================================

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
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

    // ============================================================
    // 5. CLIENTE SUPABASE SERVER-SIDE
    //
    // La Service Role Key SOLO existe en Netlify.
    // Nunca se envía al navegador.
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
    // 6. LEER DATOS RECIBIDOS
    // ============================================================

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
    } = body;

    // ============================================================
    // 7. VALIDAR PROJECT DATA
    // ============================================================

    if (!isPlainObject(projectData)) {
      return jsonResponse(
        {
          error: "projectData is required",
        },
        400
      );
    }

    // ============================================================
    // 8. VALIDAR HTML
    // ============================================================

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

    // Evita recibir contenido exageradamente grande.
    // El HTML de una experiencia normal debe estar muy por debajo
    // de este límite.
    if (html.length > 15_000_000) {
      return jsonResponse(
        {
          error: "HTML payload is too large",
        },
        413
      );
    }

    // ============================================================
    // 9. VALIDAR PRECIO
    //
    // create-project es una función administrativa.
    // El precio configurado aquí quedará almacenado en Supabase.
    //
    // Stripe Checkout NO confiará posteriormente en el precio
    // enviado por el navegador. Leerá el precio almacenado
    // directamente desde Supabase.
    // ============================================================

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

    // Límite de seguridad para evitar valores accidentales
    // extremadamente altos.
    if (priceCents > 10_000_000) {
      return jsonResponse(
        {
          error: "Price exceeds allowed limit",
        },
        400
      );
    }

    // ============================================================
    // 10. VALIDAR MONEDA
    // ============================================================

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

    // ============================================================
    // 11. CREAR PROYECTO
    //
    // El proyecto comienza SIEMPRE como no pagado.
    //
    // paid = false
    // stripe_session_id = null
    // paid_at = null
    //
    // Ningún navegador puede marcarlo como pagado mediante
    // esta función.
    // ============================================================

    const { data, error } = await supabase
      .from("projects")
      .insert({
        project_data: projectData,
        html,
        price_cents: priceCents,
        currency: normalizedCurrency,
        paid: false,
        stripe_session_id: null,
        paid_at: null,
      })
      .select(
        "id, price_cents, currency, paid, created_at"
      )
      .single();

    // ============================================================
    // 12. ERROR SUPABASE
    // ============================================================

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

    // ============================================================
    // 13. RESPUESTA
    // ============================================================

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
};