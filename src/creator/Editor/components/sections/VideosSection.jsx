import {useNetflix} from "../../../../renderer/context/NetflixContext";

import VideoEditor from "../VideoEditor";

export default function VideosSection(){

    const{

        project,

        update

    }=useNetflix();

    return(

        <div className="editor-content">

            <h2>

                Videos

            </h2>

            <VideoEditor

                videos={project.videos}

                setVideos={(value)=>{

                    update(

                        "videos",

                        value

                    );

                }}

            />

        </div>

    );

}