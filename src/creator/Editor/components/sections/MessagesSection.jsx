import {useNetflix} from "../../../../renderer/context/NetflixContext";

import MessageEditor from "../MessageEditor";

export default function MessagesSection(){

    const{

        project,

        update

    }=useNetflix();

    return(

        <div className="editor-content">

            <h2>

                Mensajes

            </h2>

            <MessageEditor

                messages={project.messages}

                setMessages={(value)=>{

                    update(

                        "messages",

                        value

                    );

                }}

            />

        </div>

    );

}