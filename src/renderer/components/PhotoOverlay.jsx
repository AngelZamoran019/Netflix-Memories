import {useEffect,useMemo,useState} from "react";

function getTarget(){

    const width=
        Math.min(
            window.innerWidth*.95,
            350
        );

    const height=
        width*4/5;

    return{

        left:
            (window.innerWidth-width)/2,

        top:
            window.innerHeight*.03,

        width,

        height

    };

}

export default function PhotoOverlay({

    data,

    onClose

}){

    const[
        expanded,
        setExpanded
    ]=useState(false);

    const[
        showPanel,
        setShowPanel
    ]=useState(false);

    const rect=
        useMemo(

            ()=>data?.origin
                ?.getBoundingClientRect(),

            [data]

        );

    useEffect(()=>{

        if(!data?.origin||!rect){

            return;

        }

        data.origin.style.opacity="0";

        const frame=
            requestAnimationFrame(()=>{

                setExpanded(
                    !data.closing
                );

                if(data.closing){

                    setShowPanel(false);

                }

            });

        const timer=
            window.setTimeout(()=>{

                if(
                    data.description&&
                    !data.closing
                ){

                    setShowPanel(true);

                }

            },320);

        return()=>{

            cancelAnimationFrame(frame);

            window.clearTimeout(timer);

            data.origin.style.opacity="";

        };

    },[data,rect]);

    if(!data||!rect){

        return null;

    }

    const target=getTarget();

    const style=

        expanded

        ?

        target

        :

        {

            left:rect.left,

            top:rect.top,

            width:rect.width,

            height:rect.height

        };

    return(

        <div

            className="
                floating-viewer
                floating-viewer-show
            "

            onClick={onClose}

        >

            <div className="floating-backdrop"/>

            <div

                className="floating-card"

                style={style}

                onClick={onClose}

            >

                <img

                    className="floating-image"

                    src={data.image}

                    alt=""

                    draggable={false}

                />

                {

                    data.description&&

                    <>

                        <div

                            className={`
                                floating-gradient
                                ${showPanel?"show":""}
                            `}

                        />

                        <div

                            className={`
                                floating-panel
                                ${showPanel?"show":""}
                            `}

                        >

                            <p

                                className={`
                                    floating-description
                                    ${showPanel?"show":""}
                                `}

                            >

                                {data.description}

                            </p>

                        </div>

                    </>

                }

            </div>

        </div>

    );

}