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

const[priceCents,setPriceCents]=
    useState(11000);

const[currency,setCurrency]=
    useState("MXN");

const[error,setError]=
    useState("");

    const[paid,setPaid]=
        useState(false);

    const[paymentSuccess,setPaymentSuccess]=
        useState(false);

    const[paymentLoading,setPaymentLoading]=
        useState(false);

        const[shareOpen,setShareOpen]=
    useState(false);

const experienceMode=
    new URLSearchParams(
        window.location.search
    ).get("view")==="experience";

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

const experienceUrl=
    useMemo(

        ()=>{

            return(
                publicUrl+
                "?view=experience"
            );

        },

        [publicUrl]

    );

    async function loadProject(){

        try{

const response=
    await fetch(
        "/get-public-project?id="+
        encodeURIComponent(
            projectId
        )+
        (
            experienceMode
            ?
            "&view=experience"
            :
            ""
        ),
                    {
                        cache:"no-store"
                    }
                );

            const data=
                await response.json();

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

const loadedPriceCents=
    Number(
        data.priceCents
    );

setPriceCents(
    Number.isInteger(
        loadedPriceCents
    ) &&
    loadedPriceCents>0

        ?

        loadedPriceCents

        :

        11000
);

const loadedCurrency=
    typeof data.currency==="string" &&
    data.currency.trim()

        ?

        data.currency
            .trim()
            .toUpperCase()

        :

        "MXN";

setCurrency(
    loadedCurrency
);

setPaid(
    data.paid===true
);

            setStatus(
                "ready"
            );

            return data.paid===true;

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
        let interval=null;

        async function initialize(){

            const params=
                new URLSearchParams(
                    window.location.search
                );

            const success=
                params.get("payment")===
                "success";

            setPaymentSuccess(
                success
            );

            await loadProject();

            if(
                cancelled ||
                !success
            ){

                return;

            }

            let attempts=0;

            interval=
                window.setInterval(
                    async()=>{

                        attempts++;

                        const projectPaid=
                            await loadProject();

                        if(
                            projectPaid ||
                            attempts>=30 ||
                            cancelled
                        ){

                            window.clearInterval(
                                interval
                            );

                            interval=null;

                        }

                    },
                    2000
                );

        }

        initialize();

        return()=>{

            cancelled=true;

            if(interval){

                window.clearInterval(
                    interval
                );

            }

        };

    },[projectId]);

function copyLink(
    url=publicUrl
){

    navigator.clipboard
        ?.writeText(
            url
        )
            .then(()=>{

                window.alert(
                    "Enlace copiado."
                );

            })
            .catch(()=>{

window.prompt(
    "Copia este enlace:",
    url
);

            });

    }

function openExperience(){

    window.open(
        experienceUrl,
        "_blank",
        "noopener,noreferrer"
    );

}


async function shareExperience(){

    if(
        navigator.share
    ){

        try{

            await navigator.share({
                title:
                    title ||
                    "Netflix Memories",
                text:
                    "Mira esta experiencia de Netflix Memories",
                url:
    experienceUrl
            });

        }catch(error){

            if(
                error?.name!=="AbortError"
            ){

                setShareOpen(
                    true
                );

            }

        }

        return;

    }

    setShareOpen(
        true
    );

}


function downloadExperience(){

    if(!html){

        window.alert(
            "La experiencia todavía no está disponible para descargar."
        );

        return;

    }

    const blob=
        new Blob(
            [
                html
            ],
            {
                type:
                    "text/html;charset=utf-8"
            }
        );

    const url=
        URL.createObjectURL(
            blob
        );

    const anchor=
        document.createElement(
            "a"
        );

    anchor.href=
        url;

    anchor.download=
        "Netflix-Memories.html";

    document.body.appendChild(
        anchor
    );

    anchor.click();

    anchor.remove();

    window.setTimeout(
        ()=>{
            URL.revokeObjectURL(
                url
            );
        },
        1000
    );

}

    async function handlePayment(){

        if(
            paymentLoading ||
            paid
        ){

            return;

        }

        try{

            setPaymentLoading(
                true
            );

            const response=
                await fetch(
                    "/create-checkout",
                    {
                        method:"POST",

                        headers:{
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                projectId
                            })
                    }
                );

            const data=
                await response.json();

            if(!response.ok){

                throw new Error(
                    data?.error ||
                    "No fue posible iniciar el pago."
                );

            }

            if(
                !data?.checkoutUrl
            ){

                throw new Error(
                    "Stripe no devolvió una URL de pago válida."
                );

            }

            window.location.href=
                data.checkoutUrl;

        }catch(error){

            console.error(
                "Public checkout error:",
                error
            );

            window.alert(
                error?.message ||
                "No fue posible iniciar el pago."
            );

            setPaymentLoading(
                false
            );

        }

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

    const displayPrice=
    Number.isInteger(
        priceCents
    ) &&
    priceCents>0

        ?

        new Intl.NumberFormat(
            "es-MX",
            {
                minimumFractionDigits:0,
                maximumFractionDigits:2
            }
        ).format(
            priceCents/100
        )

        :

        "110";

    const watermarkItems=
        Array.from(
            {
                length:100
            }
        );

        if(
    experienceMode
){

    return(

        <main className="public-experience public-experience-only">

            <iframe
                title={title}
                className="public-experience-frame"
                srcDoc={html}
                sandbox="allow-scripts allow-forms allow-modals"
            />

        </main>

    );

}

    return(

        <main className="public-experience">

            <header className="public-preview-header">

                <div className="public-preview-title">

                    <span className="public-preview-back">
                        ←
                    </span>

                    <strong>
                        Vista previa del proyecto
                    </strong>

                </div>

<div className="public-preview-actions">

    {
        paid && (
            <>
                <button
                    type="button"
                    className="public-action-button"
                    onClick={openExperience}
                >
                    Abrir experiencia
                </button>

                <button
                    type="button"
                    className="public-action-button"
                    onClick={shareExperience}
                >
                    Compartir
                </button>

                <button
                    type="button"
                    className="public-action-button"
                    onClick={downloadExperience}
                >
                    Descargar
                </button>
            </>
        )
    }

    {
        !paid && (
            <>
                <button
                    type="button"
                    className="public-copy-button"
                    onClick={copyLink}
                >
                    Copiar enlace
                </button>

                <button
                    type="button"
                    className="public-unlock-button"
                    onClick={handlePayment}
                    disabled={paymentLoading}
                >

{
    paymentLoading
    ?
    "Preparando..."
    :
    `Desbloquear por $${displayPrice} ${currency}`
}

                </button>
            </>
        )
    }

    {
        paid && (
            <div className="public-paid-badge">
                ✓ Desbloqueado
            </div>
        )
    }

</div>

            </header>

            <iframe

                title={title}

                className="public-experience-frame"

                srcDoc={html}

                sandbox="allow-scripts allow-forms allow-modals"

            />

            {
                !paid && (

                    <div
                        className="public-watermark"
                        aria-hidden="true"
                    >

                        {
                            watermarkItems.map(
                                (_,index)=>(
                                    <span
                                        key={index}
                                    >
                                        Dangels Studio
                                    </span>
                                )
                            )
                        }

                    </div>

                )
            }

            {
                paymentSuccess &&
                !paid && (

                    <div className="public-payment-status">

                        Confirmando tu pago...

                    </div>

                )
            }

            {
    shareOpen && (

        <div
            className="public-share-overlay"
            onClick={()=>{
                setShareOpen(
                    false
                );
            }}
        >

            <section
                className="public-share-modal"
                onClick={(event)=>{
                    event.stopPropagation();
                }}
            >

                <button
                    type="button"
                    className="public-share-close"
                    onClick={()=>{
                        setShareOpen(
                            false
                        );
                    }}
                    aria-label="Cerrar"
                >
                    ×
                </button>

                <div className="public-share-heart">

                    <div className="public-share-heart-inner">

                        <img
                            src={
                                "https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&data="+
                                encodeURIComponent(
                                    publicUrl
                                )
                            }
                            alt="Código QR de la experiencia"
                            className="public-share-qr"
                        />

                    </div>

                </div>

                <h2>
                    Comparte tu experiencia
                </h2>

                <p>
                    Escanea el código QR o comparte el enlace.
                </p>

<div className="public-share-url">

    {experienceUrl}

</div>

                <div className="public-share-modal-actions">

<button
    type="button"
    onClick={()=>{
        copyLink(
            experienceUrl
        );
    }}
>
    Copiar enlace
</button>

                    {
                        navigator.share && (
                            <button
                                type="button"
                                onClick={shareExperience}
                            >
                                Compartir
                            </button>
                        )
                    }

                </div>

            </section>

        </div>

    )
}

        </main>

    );

}