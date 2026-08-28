const COOKIE_NAME = "dangels_admin_session";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const JSON_HEADERS = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
};

function getEnv(env, name) {
    const value = env?.[name];

    if (!value) {
        throw new Error(
            `Missing required environment variable: ${name}`
        );
    }

    return value;
}

function bytesToBase64Url(bytes) {
    let binary = "";

    const chunkSize = 0x8000;

    for (
        let index = 0;
        index < bytes.length;
        index += chunkSize
    ) {
        binary += String.fromCharCode(
            ...bytes.subarray(
                index,
                index + chunkSize
            )
        );
    }

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
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

async function createSignature(
    payload,
    secret
) {
    const key =
        await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(
                secret
            ),
            {
                name: "HMAC",
                hash: "SHA-256",
            },
            false,
            ["sign"]
        );

    const signature =
        await crypto.subtle.sign(
            "HMAC",
            key,
            new TextEncoder().encode(
                payload
            )
        );

    return bytesToBase64Url(
        new Uint8Array(signature)
    );
}

async function verifySignature(
    payload,
    signature,
    secret
) {
    try {
        const key =
            await crypto.subtle.importKey(
                "raw",
                new TextEncoder().encode(
                    secret
                ),
                {
                    name: "HMAC",
                    hash: "SHA-256",
                },
                false,
                ["verify"]
            );

        return await crypto.subtle.verify(
            "HMAC",
            key,
            base64UrlToBytes(
                signature
            ),
            new TextEncoder().encode(
                payload
            )
        );
    } catch {
        return false;
    }
}

async function createSession(env) {
    const expiresAt =
        Math.floor(
            Date.now() / 1000
        ) +
        SESSION_MAX_AGE;

    const payload =
        bytesToBase64Url(
            new TextEncoder().encode(
                JSON.stringify({
                    exp: expiresAt,
                })
            )
        );

    const signature =
        await createSignature(
            payload,
            getEnv(
                env,
                "ADMIN_SESSION_SECRET"
            )
        );

    return `${payload}.${signature}`;
}

async function verifySession(
    token,
    env
) {
    if (!token) {
        return false;
    }

    const parts =
        token.split(".");

    if (parts.length !== 2) {
        return false;
    }

    const [
        payload,
        signature,
    ] = parts;

    if (!payload || !signature) {
        return false;
    }

    const secret =
        getEnv(
            env,
            "ADMIN_SESSION_SECRET"
        );

    const valid =
        await verifySignature(
            payload,
            signature,
            secret
        );

    if (!valid) {
        return false;
    }

    try {
        const data =
            JSON.parse(
                new TextDecoder().decode(
                    base64UrlToBytes(
                        payload
                    )
                )
            );

        if (
            !data?.exp ||
            data.exp <=
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

function getCookieValue(
    cookieHeader,
    name
) {
    if (!cookieHeader) {
        return null;
    }

    const cookies =
        cookieHeader
            .split(";")
            .map(
                (part) =>
                    part.trim()
            );

    for (
        const cookie of cookies
    ) {
        const separator =
            cookie.indexOf("=");

        if (separator === -1) {
            continue;
        }

        const key =
            cookie.slice(
                0,
                separator
            );

        if (key !== name) {
            continue;
        }

        try {
            return decodeURIComponent(
                cookie.slice(
                    separator + 1
                )
            );
        } catch {
            return null;
        }
    }

    return null;
}

function sessionCookie(token) {
    return [
        `${COOKIE_NAME}=${encodeURIComponent(
            token
        )}`,
        "Path=/",
        `Max-Age=${SESSION_MAX_AGE}`,
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
    ].join("; ");
}

function clearSessionCookie() {
    return [
        `${COOKIE_NAME}=`,
        "Path=/",
        "Max-Age=0",
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
    ].join("; ");
}

function jsonResponse(
    status,
    body,
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

async function readJsonBody(
    request
) {
    try {
        return await request.json();
    } catch {
        return {};
    }
}

export async function onRequest(
    context
) {
    const {
        request,
        env,
    } = context;

    const method =
        request.method.toUpperCase();

    const url =
        new URL(request.url);

    const action =
        url.searchParams.get(
            "action"
        ) || "check";

    try {
        if (
            action === "check"
        ) {
            const token =
                getCookieValue(
                    request.headers.get(
                        "cookie"
                    ),
                    COOKIE_NAME
                );

            const authenticated =
                await verifySession(
                    token,
                    env
                );

            return jsonResponse(
                200,
                {
                    authenticated,
                }
            );
        }

        if (
            action === "logout"
        ) {
            return jsonResponse(
                200,
                {
                    authenticated:
                        false,
                },
                {
                    "Set-Cookie":
                        clearSessionCookie(),
                }
            );
        }

        if (
            action === "login"
        ) {
            if (
                method !== "POST"
            ) {
                return jsonResponse(
                    405,
                    {
                        error:
                            "Method not allowed",
                    }
                );
            }

            const body =
                await readJsonBody(
                    request
                );

            const username =
                typeof body?.username ===
                "string"
                    ? body.username.trim()
                    : "";

            const password =
                typeof body?.password ===
                "string"
                    ? body.password
                    : "";

            const expectedUsername =
                getEnv(
                    env,
                    "ADMIN_USERNAME"
                );

            const expectedPassword =
                getEnv(
                    env,
                    "ADMIN_PASSWORD"
                );

            const usernameValid =
                username ===
                expectedUsername;

            const passwordValid =
                password ===
                expectedPassword;

            if (
                !usernameValid ||
                !passwordValid
            ) {
                return jsonResponse(
                    401,
                    {
                        error:
                            "Usuario o contraseña incorrectos.",
                    }
                );
            }

            const token =
                await createSession(
                    env
                );

            return jsonResponse(
                200,
                {
                    authenticated:
                        true,
                },
                {
                    "Set-Cookie":
                        sessionCookie(
                            token
                        ),
                }
            );
        }

        return jsonResponse(
            400,
            {
                error:
                    "Invalid authentication action.",
            }
        );
    } catch (error) {
        console.error(
            "Admin authentication error:",
            error
        );

        return jsonResponse(
            500,
            {
                error:
                    "Authentication service unavailable.",
            }
        );
    }
}