import {useNetflix} from "../../../../renderer/context/NetflixContext";

export default function DesignSection(){

    const{

        project,

        update

    }=useNetflix();

    return(

        <div className="editor-fields">

            <div className="editor-field">

                <label>

                    Video

                </label>

                <input

                    className="editor-text-input"

                    type="text"

                    value={project.heroVideo || ""}

                    onChange={(e)=>{

                        update(

                            "heroVideo",

                            e.target.value

                        );

                    }}

                    placeholder="URL directa del video"

                />

            </div>

        </div>

    );

}