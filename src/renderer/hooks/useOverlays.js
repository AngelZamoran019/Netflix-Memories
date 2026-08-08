import {useCallback,useState} from "react";

export default function useOverlays(){

    const [photoOverlay,setPhotoOverlay]=useState(null);

    const [videoOverlay,setVideoOverlay]=useState(null);

    const [messageOverlay,setMessageOverlay]=useState(null);

    function openPhoto(origin,item){

        if(!origin||!item?.image){

            return;

        }

        setPhotoOverlay({

            origin,

            image:item.image,

            description:item.description||""

        });

    }

    function openVideo(origin,item){

        if(!origin||!item?.video){

            return;

        }

        setVideoOverlay({

            origin,

            video:item.video,

            description:item.description||""

        });

    }

    function openMessage(origin,message){

        if(!origin){

            return;

        }

        const payload=

            typeof message==="string"

            ?

            {

                body:message,

                signature:"",

                fontSize:20

            }

            :

            {

                body:
                    message?.body||
                    message?.description||
                    "",

                signature:
                    message?.signature||
                    "",

                fontSize:
                    message?.fontSize??
                    20

            };

        setMessageOverlay({

            origin,

            ...payload

        });

    }

    const closePhoto=useCallback(()=>{

        setPhotoOverlay(previous=>

            previous

                ?

                {

                    ...previous,

                    closing:true

                }

                :

                previous

        );

        window.setTimeout(()=>{

            setPhotoOverlay(null);

        },320);

    },[]);

    const closeVideo=useCallback(()=>{

        setVideoOverlay(previous=>

            previous

                ?

                {

                    ...previous,

                    closing:true

                }

                :

                previous

        );

        window.setTimeout(()=>{

            setVideoOverlay(null);

        },320);

    },[]);

    const closeMessage=useCallback(()=>{

        setMessageOverlay(previous=>

            previous

                ?

                {

                    ...previous,

                    closing:true

                }

                :

                previous

        );

        window.setTimeout(()=>{

            setMessageOverlay(null);

        },980);

    },[]);

    return{

        photoOverlay,

        videoOverlay,

        messageOverlay,

        openPhoto,

        openVideo,

        openMessage,

        closePhoto,

        closeVideo,

        closeMessage

    };

}