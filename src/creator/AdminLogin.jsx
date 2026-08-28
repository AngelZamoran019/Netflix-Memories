import { useState } from "react";

import "./AdminLogin.css";

export default function AdminLogin({ onLogin }){

    const [username,setUsername]=useState("");
    const [password,setPassword]=useState("");

    const [loading,setLoading]=useState(false);
    const [error,setError]=useState("");

    async function handleSubmit(event){

        event.preventDefault();

        if(loading){

            return;

        }

        setError("");

        const cleanUsername=username.trim();

        if(!cleanUsername || !password){

            setError(
                "Ingresa tu usuario y contraseña."
            );

            return;

        }

        setLoading(true);

        try{

            const response=await fetch(
                "/admin-auth?action=login",
                {
                    method:"POST",
                    credentials:"include",
                    headers:{
                        "Content-Type":"application/json"
                    },
                    body:JSON.stringify({
                        username:cleanUsername,
                        password
                    })
                }
            );

            let data=null;

            try{

                data=await response.json();

            }catch{

                data=null;

            }

            if(!response.ok){

                setError(
                    data?.error ||
                    "Usuario o contraseña incorrectos."
                );

                return;

            }

            if(data?.authenticated){

                setUsername("");
                setPassword("");
                setError("");

                onLogin();

                return;

            }

            setError(
                "No fue posible iniciar sesión."
            );

        }catch(error){

            console.error(
                "Error iniciando sesión:",
                error
            );

            setError(
                "No se pudo conectar con el servidor."
            );

        }finally{

            setLoading(false);

        }

    }

    return(

        <main className="admin-login">

            <section className="admin-login-card">

                <div className="admin-login-logo">

                    <span>Netflix</span>

                </div>

                <div className="admin-login-heading">

                    <h1>CreadorRecuerdos</h1>

                    <p>
                        Acceso privado
                    </p>

                </div>

                <form
                    className="admin-login-form"
                    onSubmit={handleSubmit}
                >

                    <label
                        className="admin-login-label"
                        htmlFor="admin-username"
                    >
                        Usuario
                    </label>

                    <input
                        id="admin-username"
                        className="admin-login-input"
                        type="text"
                        value={username}
                        onChange={(event)=>{
                            setUsername(event.target.value);
                        }}
                        autoComplete="username"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck="false"
                        disabled={loading}
                        placeholder="Ingresa tu usuario"
                    />

                    <label
                        className="admin-login-label"
                        htmlFor="admin-password"
                    >
                        Contraseña
                    </label>

                    <input
                        id="admin-password"
                        className="admin-login-input"
                        type="password"
                        value={password}
                        onChange={(event)=>{
                            setPassword(event.target.value);
                        }}
                        autoComplete="current-password"
                        disabled={loading}
                        placeholder="Ingresa tu contraseña"
                    />

                    {

                        error && (

                            <div
                                className="admin-login-error"
                                role="alert"
                            >

                                {error}

                            </div>

                        )

                    }

                    <button
                        className="admin-login-button"
                        type="submit"
                        disabled={loading}
                    >

                        {

                            loading
                                ? "VERIFICANDO..."
                                : "INICIAR SESIÓN"

                        }

                    </button>

                </form>

            </section>

        </main>

    );

}