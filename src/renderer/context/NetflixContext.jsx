import {createContext,useContext,useState} from "react";

import NetflixProject from "../models/NetflixProject";

const NetflixContext=createContext(null);

export function NetflixProvider({children}){

    const [project,setProject]=useState(

        {

            ...NetflixProject,

            profiles:[
                ...(NetflixProject.profiles || [])
            ],

            moments:[
                ...(NetflixProject.moments || [])
            ],

            videos:[
                ...(NetflixProject.videos || [])
            ],

            messages:[
                ...(NetflixProject.messages || [])
            ]

        }

    );

    const [selectedProfile,setSelectedProfile]=useState(null);

    function update(field,value){

        setProject(previous=>({

            ...previous,

            [field]:value

        }));

    }

    function replace(nextProject){

        setProject({

            ...nextProject,

            profiles:[
                ...(nextProject.profiles || [])
            ],

            moments:[
                ...(nextProject.moments || [])
            ],

            videos:[
                ...(nextProject.videos || [])
            ],

            messages:[
                ...(nextProject.messages || [])
            ]

        });

        setSelectedProfile(null);

    }

    function reset(){

        setProject({

            ...NetflixProject,

            profiles:[
                ...(NetflixProject.profiles || [])
            ],

            moments:[
                ...(NetflixProject.moments || [])
            ],

            videos:[
                ...(NetflixProject.videos || [])
            ],

            messages:[
                ...(NetflixProject.messages || [])
            ]

        });

        setSelectedProfile(null);

    }

    return(

        <NetflixContext.Provider

            value={{

                project,

                update,

                replace,

                reset,

                selectedProfile,

                setSelectedProfile

            }}

        >

            {children}

        </NetflixContext.Provider>

    );

}

export function useNetflix(){

    return useContext(NetflixContext);

}