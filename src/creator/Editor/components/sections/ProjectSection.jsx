import {useState} from "react";

import {useNetflix} from "../../../../renderer/context/NetflixContext";

import createHTML from "../../../../exportV2/createHTML";

export default function ProjectSection({

    onSave

}){

    const{

        project,

        update

    }=useNetflix();

    const[linkLoading,setLinkLoading]=useState(false);

    const[publicLink,setPublicLink]=useState("");

    const priceCents=
        Number.isInteger(
            Number(project.priceCents)
        )
            ?
            Number(project.priceCents)
            :
            11000;

    const price=
        priceCents / 100;

    async function createUnlockedLink(){

        if(linkLoading){

            return;

        }

        try{

            setLinkLoading(true);
            setPublicLink("");

            const html=createHTML(project);

            if(
                typeof html!=="string" ||
                !html.trim()
            ){

                throw new Error(
                    "No fue posible generar el proyecto."
                );

            }

            const response=await fetch(
                "/create-project",
                {
                    method:"POST",
                    credentials:"include",
                    headers:{
                        "Content-Type":"application/json"
                    },
                    body:JSON.stringify({
                        projectData:project,
                        html,
                        priceCents,
                        currency:project.currency||"MXN",
                        unlocked:true
                    })
                }
            );

            const responseText=await response.text();

            let data={};

            try{

                data=responseText
                    ?
                    JSON.parse(responseText)
                    :
                    {};

            }catch{

                throw new Error(
                    responseText||
                    "El servidor devolvió una respuesta no válida."
                );

            }

            if(!response.ok){

                throw new Error(
                    data?.error||
                    "No fue posible crear el link."
                );

            }

            const projectId=data?.project?.id;

            if(!projectId){

                throw new Error(
                    "No se recibió el ID público del proyecto."
                );

            }

            const link=
                window.location.origin+
                "/p/"+
                encodeURIComponent(projectId)+
                "?view=experience";

            setPublicLink(link);

        }catch(error){

            console.error(
                "Error creando link desbloqueado:",
                error
            );

            window.alert(
                error?.message||
                "No fue posible crear el link."
            );

        }finally{

            setLinkLoading(false);

        }

    }

    return(

        <div className="editor-fields">

            <div className="editor-field">

                <label>

                    Título

                </label>

                <input

                    className="editor-text-input"

                    type="text"

                    value={project.title || ""}

                    onChange={(e)=>{

                        update(

                            "title",

                            e.target.value

                        );

                    }}

                />

            </div>

            <div className="editor-field">

                <label>

                    Descripción

                </label>

                <textarea

                    className="editor-text-input editor-textarea"

                    value={project.description || ""}

                    onChange={(e)=>{

                        update(

                            "description",

                            e.target.value

                        );

                    }}

                />

            </div>

            <div className="editor-field">

                <label>

                    Precio de publicación

                </label>

                <div className="editor-price-row">

                    <span className="editor-price-prefix">

                        $

                    </span>

                    <input

                        className="editor-text-input editor-price-input"

                        type="number"

                        min="1"

                        step="1"

                        value={price}

                        onChange={(e)=>{

                            const value=

                                Number(

                                    e.target.value

                                );

                            if(

                                Number.isFinite(value)

                            ){

                                update(

                                    "priceCents",

                                    Math.round(

                                        value*100

                                    )

                                );

                            }

                        }}

                    />

                    <span className="editor-price-currency">

                        MXN

                    </span>

                </div>

            </div>

            <button

                className="editor-save"

                type="button"

                onClick={onSave}

            >

                Guardar

            </button>

            <button

                className="editor-save"

                type="button"

                onClick={createUnlockedLink}

                disabled={linkLoading}

            >

                {
                    linkLoading
                        ?
                    "Creando Link..."
                        :
                    "Link"
                }

            </button>

            {

                publicLink && (

                    <div className="editor-field">

                        <label>

                            Link desbloqueado

                        </label>

                        <input

                            className="editor-text-input"

                            type="text"

                            value={publicLink}

                            readOnly

                            onFocus={(e)=>{

                                e.target.select();

                            }}

                        />

                        <button

                            className="editor-save"

                            type="button"

                            onClick={async()=>{

                                try{

                                    await navigator.clipboard.writeText(
                                        publicLink
                                    );

                                }catch(error){

                                    console.error(
                                        "Error copiando link:",
                                        error
                                    );

                                }

                            }}

                        >

                            Copiar Link

                        </button>

                    </div>

                )

            }

        </div>

    );

}