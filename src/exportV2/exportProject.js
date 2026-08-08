import createHTML from "./createHTML";

export default function exportProject(project){

    const html=
        createHTML(project);

    const blob=
        new Blob(

            [html],

            {

                type:
                    "text/html;charset=utf-8"

            }

        );

    const url=
        URL.createObjectURL(
            blob
        );

    const link=
        document.createElement(
            "a"
        );

    link.href=url;

    link.download=

        (

            project?.title ||

            "Netflix Memories"

        )

            .replace(
                /[\\/:*?"<>|]/g,
                "-"
            )

            +".html";

    document.body.appendChild(
        link
    );

    link.click();

    link.remove();

    window.setTimeout(

        ()=>{

            URL.revokeObjectURL(
                url
            );

        },

        1000

    );

}