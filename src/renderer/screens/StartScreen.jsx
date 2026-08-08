import React from "react";

export default function StartScreen({onStart}){

    return(

        <section className="cr-start">

            <button
                type="button"
                className="cr-start-button"
                onClick={onStart}
            >

                INICIAR

            </button>

        </section>

    );

}