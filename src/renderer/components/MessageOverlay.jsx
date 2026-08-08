import {useEffect,useMemo,useState} from "react";

export default function MessageOverlay({

    data,

    onClose

}){

    const[
        phase,
        setPhase
    ]=useState("moving");

    const rect=
        useMemo(

            ()=>data?.origin
                ?.getBoundingClientRect(),

            [data]

        );

    const hostRect=
        useMemo(()=>{

            if(!data?.origin){

                return null;

            }

            const host=

                data.origin.closest(
                    ".preview-phone"
                )
                ||
                data.origin.closest(
                    ".cinema-mobile"
                )
                ||
                document.body;

            return host.getBoundingClientRect();

        },[data]);

    useEffect(()=>{

        if(
            !data?.origin||
            !rect||
            !hostRect
        ){

            return;

        }

        data.origin.style.opacity="0";

        if(data.closing){

            setPhase("closing");

            return()=>{

                data.origin.style.opacity="";

            };

        }

        const opening=
            window.setTimeout(

                ()=>setPhase("opening"),

                680

            );

        const opened=
            window.setTimeout(

                ()=>setPhase("open"),

                860

            );

        const readable=
            window.setTimeout(

                ()=>setPhase("readable"),

                1320

            );

        return()=>{

            window.clearTimeout(opening);

            window.clearTimeout(opened);

            window.clearTimeout(readable);

            data.origin.style.opacity="";

        };

    },[data,rect,hostRect]);

    if(
        !data||
        !rect||
        !hostRect
    ){

        return null;

    }

    const hostWidth=
        hostRect.width;

    const hostHeight=
        hostRect.height;

    const finalWidth=
        Math.min(

            hostWidth*.82,

            340

        );

    const finalHeight=
        finalWidth/.655;

    const originLeft=
        rect.left-
        hostRect.left;

    const originTop=
        rect.top-
        hostRect.top;

    let cardStyle={

        left:originLeft,

        top:originTop,

        width:rect.width,

        height:rect.height

    };

    if(
        phase!=="moving"&&
        phase!=="closing"
    ){

        cardStyle={

            left:
                (hostWidth-
                rect.width)/2,

            top:
                (hostHeight-
                rect.height)/2,

            width:rect.width,

            height:rect.height

        };

    }

    if(
        phase==="open"||
        phase==="readable"
    ){

        cardStyle={

            left:
                (hostWidth-
                finalWidth)/2,

            top:
                (hostHeight-
                finalHeight)/2,

            width:finalWidth,

            height:finalHeight

        };

    }

    return(

        <div

            className="
                floating-message-viewer
                floating-message-viewer-show
            "

            aria-hidden="false"

            style={{

                left:hostRect.left,

                top:hostRect.top,

                width:hostRect.width,

                height:hostRect.height

            }}

        >

            <button

                type="button"

                className="floating-message-backdrop"

                aria-label="Cerrar carta"

                onClick={

                    phase==="readable"

                        ?

                        onClose

                        :

                        undefined

                }

            />

            <section

                className="floating-message-card"

                style={cardStyle}

                onClick={

                    phase==="readable"

                        ?

                        onClose

                        :

                        undefined

                }

            >

                <div

                    className={`

                        message-envelope

                        message-envelope-${phase}

                    `}

                >

                    <div className="envelope-back"/>

                    <div className="paper-wrapper">

                        <article className="message-paper">

                            <div className="paper-border"/>

                            <div

                                className="
                                    paper-ornament
                                    paper-ornament-top
                                "

                                aria-hidden="true"

                            >

                                <span/>

                                ♥ 

                                <span/>

                            </div>

                            <div

                                className="message-content"

                                style={{

                                    fontSize:
                                        `${data.fontSize}px`

                                }}

                            >

                                {data.body}

                            </div>

                            <div className="message-signature">

                                {data.signature}

                            </div>

                            <div

                                className="
                                    paper-ornament
                                    paper-ornament-bottom
                                "

                                aria-hidden="true"

                            >

                                <span/>

                                ♥ 

                                <span/>

                            </div>

                        </article>

                    </div>

                    <div className="envelope-left"/>

                    <div className="envelope-right"/>

                    <div className="envelope-front"/>

                    <div className="envelope-top"/>

                    <div

                        className="message-seal"

                        aria-hidden="true"

                    >

                        <span>♥</span>

                    </div>

                </div>

            </section>

        </div>

    );

}