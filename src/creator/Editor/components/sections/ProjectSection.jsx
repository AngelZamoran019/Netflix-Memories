import {useNetflix} from "../../../../renderer/context/NetflixContext";

export default function ProjectSection({

    onSave

}){

    const{

        project,

        update

    }=useNetflix();

    return(

        <div className="editor-fields">

            <div className="editor-field">

                <label>

                    Título

                </label>

                <input

                    className="editor-text-input"

                    type="text"

                    value={project.title || ""}

                    onChange={(e)=>{

                        update(

                            "title",

                            e.target.value

                        );

                    }}

                />

            </div>

            <div className="editor-field">

                <label>

                    Descripción

                </label>

                <textarea

                    className="editor-text-input editor-textarea"

                    value={project.description || ""}

                    onChange={(e)=>{

                        update(

                            "description",

                            e.target.value

                        );

                    }}

                />

            </div>

            <button

                className="editor-save"

                type="button"

                onClick={onSave}

            >

                Guardar

            </button>

        </div>

    );

}