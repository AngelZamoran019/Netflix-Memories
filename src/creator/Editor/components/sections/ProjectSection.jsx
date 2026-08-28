import {useNetflix} from "../../../../renderer/context/NetflixContext";

export default function ProjectSection({

    onSave

}){

    const{

        project,

        update

    }=useNetflix();

    const priceCents=
        Number.isInteger(
            Number(project.priceCents)
        )
            ?
            Number(project.priceCents)
            :
            11000;

    const price=
        priceCents / 100;

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

            <div className="editor-field">

                <label>

                    Precio de publicación

                </label>

                <div className="editor-price-row">

                    <span className="editor-price-prefix">

                        $

                    </span>

                    <input

                        className="editor-text-input editor-price-input"

                        type="number"

                        min="1"

                        step="1"

                        value={price}

                        onChange={(e)=>{

                            const value=

                                Number(

                                    e.target.value

                                );

                            if(

                                Number.isFinite(value)

                            ){

                                update(

                                    "priceCents",

                                    Math.round(

                                        value*100

                                    )

                                );

                            }

                        }}

                    />

                    <span className="editor-price-currency">

                        MXN

                    </span>

                </div>

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