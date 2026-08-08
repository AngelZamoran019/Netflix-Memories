import {useEffect,useState} from "react";

import {getProjects} from "../data/projects/projectManager";

import exportProject from "../exportV2/exportProject";

export default function Dashboard({

    onCreate,

    onEdit,

    onDelete

}){

    const[projects,setProjects]=useState([]);

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

                                        >

                                            Editar

                                        </button>

                                        <button

                                            className="creator-export-project"

                                            onClick={()=>{

                                                handleExport(project);

                                            }}

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