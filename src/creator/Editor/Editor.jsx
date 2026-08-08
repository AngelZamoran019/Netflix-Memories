import {useState} from "react";

import NetflixRenderer from "../../renderer/NetflixRenderer";

import EditorMenu from "./components/EditorMenu";

import EditorContent from "./components/EditorContent";

export default function Editor({

    onSave

}){

    const[section,setSection]=useState("Proyecto");

    return(

        <main className="creator-editor">

            <section className="creator-panel">

                <EditorMenu

                    selected={section}

                    onSelect={setSection}

                />

                <EditorContent

                    section={section}

                    onSave={onSave}

                />

            </section>

            <section className="creator-preview">

                <div className="preview-phone">

                    <NetflixRenderer/>

                </div>

            </section>

        </main>

    );

}