import {useEffect,useState} from "react";

import {getProjects} from "../data/projects/projectManager";

import exportProject from "../exportV2/exportProject";

import createHTML from "../exportV2/createHTML";

export default function Dashboard({

    onCreate,

    onEdit,

    onDelete,

    onLogout

}){

const[projects,setProjects]=useState([]);

const[publishingId,setPublishingId]=useState(null);

const[linkLoadingId,setLinkLoadingId]=useState(null);

const[publicLinks,setPublicLinks]=useState({});





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

    if(
        publishingId
    ){
        return;
    }

    try{

        setPublishingId(
            project.id
        );

        const html=
            createHTML(project);

        if(
            typeof html!=="string" ||
            !html.trim()
        ){

            throw new Error(
                "No fue posible generar el proyecto."
            );

        }

const prepareResponse=
    await fetch(
        "/prepare-payment",
        {
            method:"POST",
            credentials:"include",
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

        const responseText=
            await prepareResponse.text();

        let prepareData={};

        try{

            prepareData=
                responseText
                    ?
                JSON.parse(responseText)
                    :
                {};

        }catch{

            throw new Error(
                responseText ||
                "El servidor devolvió una respuesta no válida."
            );

        }

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
                "No se recibió el ID público del proyecto."
            );

        }

        window.location.href=
            "/p/"+
            encodeURIComponent(
                prepareData.projectId
            )+
            "?preview=1";

    }catch(error){

        console.error(
            "Error al preparar la vista previa:",
            error
        );

        window.alert(
            error?.message ||
            "No fue posible preparar la vista previa."
        );

        setPublishingId(null);

    }

}

async function handleCreateUnlockedLink(project){

    if(
        linkLoadingId
    ){
        return;
    }

    try{

        setLinkLoadingId(
            project.id
        );

        const html=
            createHTML(project);

        if(
            typeof html!=="string" ||
            !html.trim()
        ){

            throw new Error(
                "No fue posible generar el proyecto."
            );

        }

        const response=
            await fetch(
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
                        priceCents:
                            Number.isInteger(
                                Number(project.priceCents)
                            )
                                ?
                            Number(project.priceCents)
                                :
                            11000,
                        currency:
                            project.currency ||
                            "MXN",
                        unlocked:true
                    })
                }
            );

        const responseText=
            await response.text();

        let data={};

        try{

            data=responseText
                ?
            JSON.parse(responseText)
                :
            {};

        }catch{

            throw new Error(
                responseText ||
                "El servidor devolvió una respuesta no válida."
            );

        }

        if(!response.ok){

            throw new Error(
                data?.error ||
                "No fue posible crear el link."
            );

        }

        const projectId=
            data?.project?.id;

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

        setPublicLinks(
            currentLinks=>({
                ...currentLinks,
                [project.id]:link
            })
        );

        try{

            await navigator.clipboard.writeText(
                link
            );

        }catch(error){

            console.warn(
                "No fue posible copiar automáticamente el link:",
                error
            );

        }

    }catch(error){

        console.error(
            "Error creando link desbloqueado:",
            error
        );

        window.alert(
            error?.message ||
            "No fue posible crear el link."
        );

    }finally{

        setLinkLoadingId(null);

    }

}

    return(

        <main className="creator-dashboard">

<div className="creator-dashboard-header">

    <div className="creator-dashboard-title">

        <h1>

            Creador De Recuerdos Netflix

        </h1>

        <p>

            Panel privado de administración

        </p>

    </div>

    <div className="creator-dashboard-header-actions">

        <button

            className="creator-new-project"

            onClick={onCreate}

        >

            Nuevo proyecto

        </button>

        <button

            className="creator-logout"

            type="button"

            onClick={onLogout}

        >

            Cerrar sesión

        </button>

    </div>

</div>

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

                                        {

                                            publicLinks[project.id] && (

                                                <a

                                                    className="creator-public-link"

                                                    href={publicLinks[project.id]}

                                                    target="_blank"

                                                    rel="noreferrer"

                                                >

                                                    {publicLinks[project.id]}

                                                </a>

                                            )

                                        }

                                    </div>

                                    <div className="creator-project-actions">

                                        <button

                                            className="creator-edit-project"

                                            onClick={()=>{

                                                onEdit(project);

                                            }}

                                            disabled={

                                                publishingId!==null ||
                                                linkLoadingId!==null

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

                                                publishingId!==null ||
                                                linkLoadingId!==null

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

                                                publishingId!==null ||
                                                linkLoadingId!==null

                                            }

                                        >

                                            Exportar

                                        </button>

                                        <button

                                            className="creator-link-project"

                                            onClick={()=>{

                                                handleCreateUnlockedLink(
                                                    project
                                                );

                                            }}

                                            disabled={

                                                publishingId!==null ||
                                                linkLoadingId!==null

                                            }

                                        >

                                            {

                                                linkLoadingId===
                                                project.id

                                                ?

                                                "Creando..."

                                                :

                                                "Link"

                                            }

                                        </button>

                                        <button

                                            className="creator-delete-project"

                                            onClick={()=>{

                                                handleDelete(

                                                    project.id

                                                );

                                            }}

                                            disabled={

                                                publishingId!==null ||
                                                linkLoadingId!==null

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