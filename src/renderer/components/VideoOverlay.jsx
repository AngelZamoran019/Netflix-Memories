import {useEffect,useMemo,useState} from "react";

function getTarget(video){

    const maxWidth=
        Math.min(
            window.innerWidth*.95,
            350
        );

    const ratio=

        video?.videoWidth&&
        video?.videoHeight

        ?

        video.videoWidth/
        video.videoHeight

        :

        16/9;

    let width=maxWidth;

    let height=width/ratio;

    const maxHeight=
        window.innerHeight*.85;

    if(height>maxHeight){

        height=maxHeight;

        width=height*ratio;

    }

    return{

        left:
            (window.innerWidth-width)/2,

        top:
            (window.innerHeight-height)/2,

        width,

        height

    };

}

export default function VideoOverlay({

    data,

    onClose

}){

    const[
        expanded,
        setExpanded
    ]=useState(false);

    const[
        videoElement,
        setVideoElement
    ]=useState(null);

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

            });

        return()=>{

            cancelAnimationFrame(frame);

            data.origin.style.opacity="";

        };

    },[data,rect]);

    useEffect(()=>{

        if(
            expanded&&
            videoElement
        ){

            const play=()=>{

                videoElement.currentTime=0;

                videoElement
                    .play()
                    .catch(()=>{});

            };

            if(
                videoElement.readyState>=1
            ){

                play();

            }

            else{

                videoElement.addEventListener(

                    "loadedmetadata",

                    play,

                    {once:true}

                );

            }

        }

    },[
        expanded,
        videoElement
    ]);

    if(!data||!rect){

        return null;

    }

    const target=
        getTarget(videoElement);

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

                <video

                    ref={setVideoElement}

                    className="floating-video"

                    src={data.video}

                    playsInline

                    controls

                    onClick={event=>
                        event.stopPropagation()
                    }

                />

            </div>

        </div>

    );

}