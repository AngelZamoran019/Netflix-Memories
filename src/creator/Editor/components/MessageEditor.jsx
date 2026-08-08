function normalizeMessage(message){

    return typeof message==="string"

        ?

        {

            body:message,

            signature:"",

            fontSize:20

        }

        :

        {

            body:

                message?.body ||

                message?.description ||

                message?.text ||

                message?.message ||

                "",

            signature:

                message?.signature ||

                "",

            fontSize:

                message?.fontSize ??

                20

        };

}

function MessageEditor({

    messages,

    setMessages

}){

    function addMessage(){

        setMessages([

            ...(messages || []),

            {

                body:"Nuevo mensaje",

                signature:"",

                fontSize:20

            }

        ]);

    }

    function updateMessage(

        index,

        field,

        value

    ){

        const copy=[

            ...(messages || [])

        ];

        copy[index]={

            ...normalizeMessage(

                copy[index]

            ),

            [field]:value

        };

        setMessages(copy);

    }

    function removeMessage(index){

        setMessages(

            (messages || []).filter(

                (_,itemIndex)=>

                    itemIndex!==index

            )

        );

    }

    return(

        <>

            <button

                type="button"

                className="editor-add-button"

                onClick={addMessage}

            >

                Agregar mensaje

            </button>

            {

                (messages || []).map(

                    (message,index)=>{

                        const editableMessage=

                            normalizeMessage(

                                message

                            );

                        return(

                            <div

                                key={index}

                                className="editor-item"

                            >

                                <h3>

                                    Mensaje {index+1}

                                </h3>

                                <div className="editor-field">

                                    <label>

                                        Mensaje

                                    </label>

                                    <textarea

                                        className="editor-textarea"

                                        value={

                                            editableMessage.body

                                        }

                                        placeholder="Escribe el mensaje"

                                        onChange={(event)=>{

                                            updateMessage(

                                                index,

                                                "body",

                                                event.target.value

                                            );

                                        }}

                                    />

                                </div>



                                <div className="editor-field">

                                    <label>

                                        Tamaño del texto

                                    </label>

                                    <input

                                        type="range"

                                        min="12"

                                        max="40"

                                        step="1"

                                        value={

                                            editableMessage.fontSize

                                        }

                                        onChange={(event)=>{

                                            updateMessage(

                                                index,

                                                "fontSize",

                                                Number(

                                                    event.target.value

                                                )

                                            );

                                        }}

                                    />

                                    <span>

                                        {editableMessage.fontSize}px

                                    </span>

                                </div>

                                <button

                                    type="button"

                                    className="editor-delete-button"

                                    onClick={()=>{

                                        removeMessage(index);

                                    }}

                                >

                                    Eliminar

                                </button>

                            </div>

                        );

                    }

                )

            }

        </>

    );

}

export default MessageEditor;