import {useRef} from "react";

import {useNetflix} from "../context/NetflixContext";

import Rows from "./Rows";

export default function MessagesRow({

    onOpen

}){

    const{

        project

    }=useNetflix();

    return(

        <Rows

            title="Mensajes"

            items={project.messages}

            renderItem={(message,index)=>(

                <MessageCard

                    key={index}

                    message={message}

                    onOpen={onOpen}

                />

            )}

        />

    );

}

function MessageCard({

    message,

    onOpen

}){

    const cardRef=useRef(null);

    function handleClick(){

        if(!cardRef.current){

            return;

        }

        onOpen?.(

            cardRef.current,

            message

        );

    }

    return(

        <article

            ref={cardRef}

            className="cinema-card cinema-card-messages"

            onClick={handleClick}

        >

            <div

                className="cinema-card-message-preview"

                aria-label={

                    typeof message==="string"

                        ?

                        message

                        :

                        "Mensaje"

                }

            />

        </article>

    );

}