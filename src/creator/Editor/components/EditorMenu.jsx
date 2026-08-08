const items=[

    "Proyecto",

    "Diseño",

    "Perfiles",

    "Momentos",

    "Videos",

    "Mensajes"

];

export default function EditorMenu({

    selected,

    onSelect

}){

    return(

        <nav className="editor-menu">

            {

                items.map(item=>(

                    <button

                        key={item}

                        className={

                            selected===item

                                ?

                                "active"

                                :

                                ""

                        }

                        onClick={()=>{

                            onSelect(item);

                        }}

                    >

                        {item}

                    </button>

                ))

            }

            <button

                className="editor-export"

                disabled

                title="La exportación se habilitará al finalizar el proyecto"

            >

                Exportar Proyecto

            </button>

        </nav>

    );

}