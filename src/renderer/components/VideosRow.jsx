import {useRef} from "react";

import {useNetflix} from "../context/NetflixContext";

import Rows from "./Rows";

export default function VideosRow({

    onOpen

}){

    const{

        project

    }=useNetflix();

    return(

        <Rows

            title="Videos"

            items={project.videos}

            renderItem={(video,index)=>(

                <VideoCard

                    key={index}

                    video={video}

                    onOpen={onOpen}

                />

            )}

        />

    );

}

function VideoCard({

    video,

    onOpen

}){

    const cardRef=useRef(null);

    function handleClick(){

        if(!cardRef.current){

            return;

        }

        onOpen?.(

            cardRef.current,

            video

        );

    }

    const image=

        video.thumbnail ||

        video.image ||

        "";

    return(

        <article

            ref={cardRef}

            className="cinema-card cinema-card-videos"

            onClick={handleClick}

        >

            {

                image &&

                <img

                    className="cinema-card-image"

                    src={image}

                    alt={video.title || ""}

                    draggable={false}

                />

            }

        </article>

    );

}