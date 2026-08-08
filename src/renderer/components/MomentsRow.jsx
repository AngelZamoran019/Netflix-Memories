import {useRef} from "react";

import {useNetflix} from "../context/NetflixContext";

import Rows from "./Rows";

export default function MomentsRow({

    onOpen

}){

    const{

        project

    }=useNetflix();

    return(

        <Rows

            title="Momentos"

            items={project.moments}

            renderItem={(moment,index)=>(

                <MomentCard

                    key={index}

                    moment={moment}

                    onOpen={onOpen}

                />

            )}

        />

    );

}

function MomentCard({

    moment,

    onOpen

}){

    const cardRef=useRef(null);

    function handleClick(){

        if(!cardRef.current){

            return;

        }

        onOpen?.(

            cardRef.current,

            moment

        );

    }

    return(

        <article

            ref={cardRef}

            className="cinema-card cinema-card-moments"

            onClick={handleClick}

        >

            {

                moment.image &&

                <img

                    className="cinema-card-image"

                    src={moment.image}

                    alt={moment.title || ""}

                    draggable={false}

                />

            }

        </article>

    );

}