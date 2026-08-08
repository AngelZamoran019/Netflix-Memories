import {useRef,useState} from "react";

export default function Rows({

    title,

    items=[],

    renderItem

}){

    const rowRef=useRef(null);

    const[startX,setStartX]=useState(0);

    const[startScroll,setStartScroll]=useState(0);

    const[dragging,setDragging]=useState(false);

    function mouseDown(e){

        if(!rowRef.current){

            return;

        }

        e.preventDefault();

        rowRef.current.style.scrollBehavior="auto";

        setDragging(true);

        setStartX(e.pageX);

        setStartScroll(
            rowRef.current.scrollLeft
        );

    }

    function mouseMove(e){

        if(!dragging){

            return;

        }

        e.preventDefault();

        const distance=
            e.pageX-startX;

        rowRef.current.scrollLeft=
            startScroll-distance;

    }

    function mouseUp(){

        if(rowRef.current){

            rowRef.current.style.scrollBehavior=
                "smooth";

        }

        setDragging(false);

    }

    if(items.length===0){

        return null;

    }

    return(

        <section className="cinema-row">

            <h2 className="cinema-row-title">

                {title}

            </h2>

            <div className="cinema-row-wrapper">

                <div

                    ref={rowRef}

                    className={`

                        cinema-row-content

                        ${
                            dragging
                                ?
                                "dragging"
                                :
                                ""
                        }

                    `}

                    onMouseDown={mouseDown}

                    onMouseMove={mouseMove}

                    onMouseUp={mouseUp}

                    onMouseLeave={mouseUp}

                >

                    {

                        items.map(

                            (item,index)=>

                                renderItem(
                                    item,
                                    index
                                )

                        )

                    }

                </div>

                <div className="cinema-row-fade"/>

            </div>

        </section>

    );

}