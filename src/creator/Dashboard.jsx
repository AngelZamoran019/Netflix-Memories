import {useEffect,useState} from "react";

import {getProjects} from "../data/projects/projectManager";

import exportProject from "../exportV2/exportProject";

import createHTML from "../exportV2/createHTML";

export default function Dashboard({

    onCreate,

    onEdit,

    onDelete

}){

    const[projects,setProjects]=useState([]);

    const[publishingId,setPublishingId]=useState(null);

    useEffect(()=>{

        setProjects(

            getProjects()

        );

    },[]);

    function handleDelete(id){

        const confirmed=window.confirm(

            "¿Seguro que quieres eliminar este proyecto?"

        );

        if(!confirmed){

            return;

        }

        onDelete(id);

        setProjects(

            getProjects()

        );

    }

    function handleExport(project){

        exportProject(project);

    }

    async function handlePublish(project){

        if(publishingId){

            return;

        }

        const confirmed=window.confirm(

            "Este proyecto se preparará para publicación y después podrás continuar con el pago de $110 MXN. ¿Quieres continuar?"

        );

        if(!confirmed){

            return;

        }

        try{

            setPublishingId(project.id);

            const html=

                createHTML(project);

            if(

                typeof html!=="string" ||

                !html.trim()

            ){

                throw new Error(

                    "No fue posible generar el HTML del proyecto."

                );

            }

            const prepareResponse=

                await fetch(

                    "/.netlify/functions/prepare-payment",

                    {

                        method:"POST",

                        headers:{

                            "Content-Type":

                                "application/json"

                        },

                        body:

                            JSON.stringify({

                                project,

                                html

                            })

                    }

                );

            const prepareData=

                await prepareResponse.json();

            if(!prepareResponse.ok){

                throw new Error(

                    prepareData?.error ||

                    "No fue posible preparar el proyecto para publicación."

                );

            }

            if(

                !prepareData?.projectId

            ){

                throw new Error(

                    "No se recibió el ID del proyecto."

                );

            }

            const checkoutResponse=

                await fetch(

                    "/.netlify/functions/create-checkout",

                    {

                        method:"POST",

                        headers:{

                            "Content-Type":

                                "application/json"

                        },

                        body:

                            JSON.stringify({

                                projectId:

                                    prepareData.projectId

                            })

                    }

                );

            const checkoutData=

                await checkoutResponse.json();

            if(!checkoutResponse.ok){

                throw new Error(

                    checkoutData?.error ||

                    "No fue posible crear el pago."

                );

            }

            if(

                !checkoutData?.checkoutUrl ||

                typeof checkoutData.checkoutUrl!=="string"

            ){

                throw new Error(

                    "Stripe no devolvió una URL de pago válida."

                );

            }

            window.location.href=

                checkoutData.checkoutUrl;

        }catch(error){

            console.error(

                "Error al publicar proyecto:",

                error

            );

            window.alert(

                error?.message ||

                "No fue posible iniciar la publicación."

            );

            setPublishingId(null);

        }

    }

    return(

        <main className="creator-dashboard">

            <h1>

                Creador De Recuerdos Netflix

            </h1>

            <button

                className="creator-new-project"

                onClick={onCreate}

            >

                Nuevo proyecto

            </button>

            <section className="creator-projects">

                <h2>

                    Proyectos guardados

                </h2>

                {

                    projects.length===0

                    ?

                    <p className="creator-empty">

                        No hay proyectos guardados.

                    </p>

                    :

                    <div className="creator-project-list">

                        {

                            projects.map(project=>(

                                <article

                                    key={project.id}

                                    className="creator-project-card"

                                >

                                    <div>

                                        <h3>

                                            {project.title}

                                        </h3>

                                        <p>

                                            {project.description}

                                        </p>

                                    </div>

                                    <div className="creator-project-actions">

                                        <button

                                            className="creator-edit-project"

                                            onClick={()=>{

                                                onEdit(project);

                                            }}

                                            disabled={

                                                publishingId!==null

                                            }

                                        >

                                            Editar

                                        </button>

                                        <button

                                            className="creator-publish-project"

                                            onClick={()=>{

                                                handlePublish(

                                                    project

                                                );

                                            }}

                                            disabled={

                                                publishingId!==null

                                            }

                                        >

                                            {

                                                publishingId===

                                                project.id

                                                ?

                                                "Preparando..."

                                                :

                                                "Publicar"

                                            }

                                        </button>

                                        <button

                                            className="creator-export-project"

                                            onClick={()=>{

                                                handleExport(project);

                                            }}

                                            disabled={

                                                publishingId!==null

                                            }

                                        >

                                            Exportar

                                        </button>

                                        <button

                                            className="creator-delete-project"

                                            onClick={()=>{

                                                handleDelete(

                                                    project.id

                                                );

                                            }}

                                            disabled={

                                                publishingId!==null

                                            }

                                        >

                                            Eliminar

                                        </button>

                                    </div>

                                </article>

                            ))

                        }

                    </div>

                }

            </section>

        </main>

    );

}