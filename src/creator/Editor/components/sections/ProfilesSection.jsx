import {useNetflix} from "../../../../renderer/context/NetflixContext";

export default function ProfilesSection(){

    const{

        project,

        update

    }=useNetflix();

    function updateProfile(index,field,value){

        const copy=[...project.profiles];

        copy[index]={

            ...copy[index],

            [field]:value

        };

        update(

            "profiles",

            copy

        );

    }

    function addProfile(){

        update(

            "profiles",

            [

                ...project.profiles,

                {

                    id:Date.now(),

                    name:"Nuevo perfil",

                    image:"",

                    avatar:"",

                    background:""

                }

            ]

        );

    }

    function removeProfile(index){

        update(

            "profiles",

            project.profiles.filter(

                (_,i)=>i!==index

            )

        );

    }

    return(

        <div className="editor-fields">

            <button

                className="editor-add-button"

                type="button"

                onClick={addProfile}

            >

                Agregar perfil

            </button>

            {

                (project.profiles || []).map(

                    (profile,index)=>(

                        <div

                            key={profile.id}

                            className="editor-item"

                        >

                            <h3>

                                Perfil {index+1}

                            </h3>

                            <div className="editor-field">

                                <label>

                                    Nombre

                                </label>

                                <input

                                    className="editor-text-input"

                                    type="text"

                                    value={profile.name || ""}

                                    onChange={(e)=>

                                        updateProfile(

                                            index,

                                            "name",

                                            e.target.value

                                        )

                                    }

                                />

                            </div>

                            <div className="editor-field">

                                <label>

                                    Imagen Perfil

                                </label>

                                <input

                                    className="editor-text-input"

                                    type="text"

                                    value={profile.image || ""}

                                    onChange={(e)=>

                                        updateProfile(

                                            index,

                                            "image",

                                            e.target.value

                                        )

                                    }

                                />

                            </div>

                            <div className="editor-field">

                                <label>

                                    Avatar Home

                                </label>

                                <input

                                    className="editor-text-input"

                                    type="text"

                                    value={profile.avatar || ""}

                                    onChange={(e)=>

                                        updateProfile(

                                            index,

                                            "avatar",

                                            e.target.value

                                        )

                                    }

                                />

                            </div>

                            <div className="editor-field">

                                <label>

                                    Fondo Home

                                </label>

                                <input

                                    className="editor-text-input"

                                    type="text"

                                    value={profile.background || ""}

                                    onChange={(e)=>

                                        updateProfile(

                                            index,

                                            "background",

                                            e.target.value

                                        )

                                    }

                                />

                            </div>

                            <button

                                className="editor-delete-button"

                                type="button"

                                onClick={()=>{

                                    removeProfile(index);

                                }}

                            >

                                Eliminar perfil

                            </button>

                        </div>

                    )

                )

            }

        </div>

    );

}