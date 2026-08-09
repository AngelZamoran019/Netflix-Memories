import {useEffect,useMemo,useState} from "react";

import "./PublicExperience.css";

export default function PublicExperience({

    projectId

}){

    const[status,setStatus]=
        useState("loading");

    const[html,setHtml]=
        useState("");

    const[title,setTitle]=
        useState("Netflix Memories");

    const[error,setError]=
        useState("");

    const[paymentSuccess,setPaymentSuccess]=
        useState(false);

    const publicUrl=
        useMemo(

            ()=>{

                return(
                    window.location.origin+
                    "/p/"+
                    encodeURIComponent(
                        projectId
                    )
                );

            },

            [projectId]

        );

    async function loadProject(){

        try{

            const response=
                await fetch(
                    "/.netlify/functions/get-public-project?id="+
                    encodeURIComponent(
                        projectId
                    ),
                    {
                        cache:"no-store"
                    }
                );

            const data=
                await response.json();

            if(response.status===402){

                setStatus("pending");

                return false;

            }

            if(!response.ok){

                throw new Error(
                    data?.error ||
                    "No fue posible cargar la experiencia."
                );

            }

            if(
                !data?.html
            ){

                throw new Error(
                    "La experiencia publicada no contiene HTML."
                );

            }

            setHtml(
                data.html
            );

            setTitle(
                data.title ||
                "Netflix Memories"
            );

            setStatus(
                "ready"
            );

            return true;

        }catch(error){

            console.error(
                "Public experience error:",
                error
            );

            setError(
                error?.message ||
                "No fue posible cargar la experiencia."
            );

            setStatus(
                "error"
            );

            return false;

        }

    }

    useEffect(()=>{

        let cancelled=false;

        async function initialize(){

            const params=
                new URLSearchParams(
                    window.location.search
                );

            setPaymentSuccess(
                params.get("payment")===
                "success"
            );

            const loaded=
                await loadProject();

            if(
                loaded ||
                cancelled
            ){
                return;
            }

            let attempts=0;

            const interval=
                window.setInterval(
                    async()=>{

                        attempts++;

                        const ready=
                            await loadProject();

                        if(
                            ready ||
                            attempts>=15 ||
                            cancelled
                        ){

                            window.clearInterval(
                                interval
                            );

                        }

                    },
                    2000
                );

            return()=>{

                window.clearInterval(
                    interval
                );

            };

        }

        initialize();

        return()=>{

            cancelled=true;

        };

    },[projectId]);

    function copyLink(){

        navigator.clipboard
            ?.writeText(
                publicUrl
            )
            .then(()=>{

                window.alert(
                    "Enlace copiado."
                );

            })
            .catch(()=>{

                window.prompt(
                    "Copia este enlace:",
                    publicUrl
                );

            });

    }

    if(status==="loading"){

        return(

            <main className="public-experience-state">

                <div className="public-experience-loader">

                    <span></span>

                    <p>
                        Cargando experiencia...
                    </p>

                </div>

            </main>

        );

    }

    if(status==="pending"){

        return(

            <main className="public-experience-state">

                <section className="public-experience-card">

                    <h1>
                        Preparando tu experiencia
                    </h1>

                    <p>
                        Estamos esperando la confirmación del pago.
                    </p>

                    <p>
                        Esta página se actualizará automáticamente.
                    </p>

                </section>

            </main>

        );

    }

    if(status==="error"){

        return(

            <main className="public-experience-state">

                <section className="public-experience-card">

                    <h1>
                        No se pudo cargar la experiencia
                    </h1>

                    <p>
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={()=>{
                            window.location.reload();
                        }}
                    >
                        Intentar nuevamente
                    </button>

                </section>

            </main>

        );

    }

    return(

        <main className="public-experience">

            {

                paymentSuccess && (

                    <div className="public-payment-banner">

                        <div>

                            <strong>
                                ¡Pago confirmado!
                            </strong>

                            <span>
                                Tu experiencia ya está publicada.
                            </span>

                        </div>

                        <button
                            type="button"
                            onClick={copyLink}
                        >
                            Copiar enlace
                        </button>

                    </div>

                )

            }

            <iframe

                title={title}

                className="public-experience-frame"

                srcDoc={html}

                sandbox="allow-scripts allow-forms allow-modals"

            />

        </main>

    );

}