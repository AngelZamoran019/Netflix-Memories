import {useState} from "react";

import {useNetflix} from "../renderer/context/NetflixContext";

import {

    saveProject,

    deleteProject

} from "../data/projects/projectManager";

import "./Creator.css";

import Dashboard from "./Dashboard";

import Editor from "./Editor/Editor";

export default function Creator(){

    const{

        project,

        replace,

        reset

    }=useNetflix();

    const[screen,setScreen]=useState("dashboard");

    function createProject(){

        reset();

        setScreen("editor");

    }

    function editProject(savedProject){

        replace(savedProject);

        setScreen("editor");

    }

    function saveCurrentProject(){

        saveProject(project);

        reset();

        setScreen("dashboard");

    }

    function removeProject(id){

        deleteProject(id);

    }

    return(

        <>

            {

                screen==="dashboard" && (

                    <Dashboard

                        onCreate={createProject}

                        onEdit={editProject}

                        onDelete={removeProject}

                    />

                )

            }

            {

                screen==="editor" && (

                    <Editor

                        onSave={saveCurrentProject}

                    />

                )

            }

        </>

    );

}