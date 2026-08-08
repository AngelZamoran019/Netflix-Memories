function VideoEditor({

    videos,

    setVideos

}){

    function addVideo(){

        setVideos([

            ...(videos || []),

            {

                thumbnail:"",

                video:"",

                description:""

            }

        ]);

    }

    function update(

        index,

        field,

        value

    ){

        const copy=[

            ...(videos || [])

        ];

        copy[index]={

            ...copy[index],

            [field]:value

        };

        setVideos(copy);

    }

    function remove(index){

        setVideos(

            (videos || []).filter(

                (_,i)=>i!==index

            )

        );

    }

    return(

        <>

            <button

                type="button"

                className="editor-add-button"

                onClick={addVideo}

            >

                Agregar video

            </button>

            {

                (videos || []).map(

                    (video,index)=>(

                        <div

                            key={index}

                            className="editor-item"

                        >

                            <h3>

                                Video {index+1}

                            </h3>

                            {

                                video.thumbnail &&

                                <img

                                    className="editor-item-preview"

                                    src={video.thumbnail}

                                    alt="Vista previa del video"

                                />

                            }

                            <div className="editor-field">

                                <label>

                                    URL de miniatura

                                </label>

                                <input

                                    type="text"

                                    value={

                                        video.thumbnail ||

                                        ""

                                    }

                                    placeholder="URL de la miniatura"

                                    onChange={(e)=>{

                                        update(

                                            index,

                                            "thumbnail",

                                            e.target.value

                                        );

                                    }}

                                />

                            </div>

                            <div className="editor-field">

                                <label>

                                    URL del video

                                </label>

                                <input

                                    type="text"

                                    value={

                                        video.video ||

                                        ""

                                    }

                                    placeholder="URL del video"

                                    onChange={(e)=>{

                                        update(

                                            index,

                                            "video",

                                            e.target.value

                                        );

                                    }}

                                />

                            </div>


                            <button

                                type="button"

                                className="editor-delete-button"

                                onClick={()=>{

                                    remove(index);

                                }}

                            >

                                Eliminar

                            </button>

                        </div>

                    )

                )

            }

        </>

    );

}

export default VideoEditor;