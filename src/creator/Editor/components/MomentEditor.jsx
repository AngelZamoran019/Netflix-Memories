function MomentEditor({moments,setMoments}){

    function addMoment(){

        setMoments([

            ...moments,

            {

                image:"",

                description:""

            }

        ]);

    }

    function update(index,field,value){

        const copy=[...moments];

        copy[index]={

            ...copy[index],

            [field]:value

        };

        setMoments(copy);

    }

    function remove(index){

        setMoments(

            moments.filter(

                (_,i)=>i!==index

            )

        );

    }

    return(

        <>

            <button onClick={addMoment}>

                Agregar momento

            </button>

            {

                (moments || []).map((moment,index)=>(

                    <div

                        key={index}

                        className="editor-item"

                    >

                        <h3>

                            Momento {index+1}

                        </h3>

                        {

                            moment.image &&

                            <img

                                src={moment.image}

                                alt="Vista previa"

                                style={{

                                    width:"70px",

                                    height:"90px",

                                    objectFit:"cover",

                                    borderRadius:"6px",

                                    display:"block"

                                }}

                            />

                        }

                        <label>

                            URL de imagen

                        </label>

                        <input

                            value={moment.image || ""}

                            onChange={(e)=>{

                                update(

                                    index,

                                    "image",

                                    e.target.value

                                );

                            }}

                        />

                        <textarea

                            rows={5}

                            value={moment.description || ""}

                            placeholder="Descripción del momento"

                            onChange={(e)=>{

                                update(

                                    index,

                                    "description",

                                    e.target.value

                                );

                            }}

                        />

                        <button

                            onClick={()=>remove(index)}

                        >

                            Eliminar

                        </button>

                    </div>

                ))

            }

        </>

    );

}

export default MomentEditor;