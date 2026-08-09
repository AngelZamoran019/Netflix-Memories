import Creator from "./creator/Creator";

import PublicExperience from "./creator/PublicExperience";

import {NetflixProvider} from "./renderer/context/NetflixContext";

function getPublicProjectId(){

    const match=
        window.location.pathname.match(
            /^\/p\/([^/]+)\/?$/
        );

    if(!match){

        return null;

    }

    try{

        return decodeURIComponent(
            match[1]
        );

    }catch{

        return null;

    }

}

export default function App(){

    const publicProjectId=
        getPublicProjectId();

    return(

        <NetflixProvider>

            {

                publicProjectId

                ?

                <PublicExperience
                    projectId={
                        publicProjectId
                    }
                />

                :

                <Creator/>

            }

        </NetflixProvider>

    );

}