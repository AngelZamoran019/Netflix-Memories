import { useEffect, useState } from "react";

import { useNetflix } from "../renderer/context/NetflixContext";

import {
    saveProject,
    deleteProject
} from "../data/projects/projectManager";

import "./Creator.css";

import Dashboard from "./Dashboard";
import Editor from "./Editor/Editor";
import AdminLogin from "./AdminLogin";

export default function Creator(){

    const {
        project,
        replace,
        reset
    } = useNetflix();

    const [screen,setScreen]=useState("dashboard");

    const [authState,setAuthState]=useState("checking");

    async function checkSession(){

        try{

            const response=await fetch(
                "/admin-auth?action=check",
                {
                    method:"GET",
                    credentials:"include"
                }
            );

            if(!response.ok){

                setAuthState("login");

                return;

            }

            const data=await response.json();

            if(data?.authenticated){

                setAuthState("authenticated");

            }else{

                setAuthState("login");

            }

        }catch(error){

            console.error(
                "Error comprobando la sesión administrativa:",
                error
            );

            setAuthState("login");

        }

    }

    useEffect(()=>{

        checkSession();

    },[]);

    function handleLogin(){

        setAuthState("authenticated");
        setScreen("dashboard");

    }

    async function handleLogout(){

        try{

            await fetch(
                "/admin-auth?action=logout",
                {
                    method:"POST",
                    credentials:"include"
                }
            );

        }catch(error){

            console.error(
                "Error cerrando sesión:",
                error
            );

        }finally{

            reset();

            setScreen("dashboard");

            setAuthState("login");

        }

    }

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

    if(authState==="checking"){

        return(

            <div className="creator-auth-loading">

                <div className="creator-auth-loading-card">

                    <div className="creator-auth-loading-spinner"></div>

                    <p>Comprobando acceso...</p>

                </div>

            </div>

        );

    }

    if(authState==="login"){

        return(

            <AdminLogin
                onLogin={handleLogin}
            />

        );

    }

    return(

        <>

            {

                screen==="dashboard" && (

                    <Dashboard

                        onCreate={createProject}

                        onEdit={editProject}

                        onDelete={removeProject}

                        onLogout={handleLogout}

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