import {useEffect,useLayoutEffect,useRef,useState} from "react";

import HomeHeader from "../components/HomeHeader";

import Hero from "../components/Hero";

import MomentsRow from "../components/MomentsRow";

import VideosRow from "../components/VideosRow";

import MessagesRow from "../components/MessagesRow";

import PhotoOverlay from "../components/PhotoOverlay";

import VideoOverlay from "../components/VideoOverlay";

import MessageOverlay from "../components/MessageOverlay";

import useOverlays from "../hooks/useOverlays";

export default function HomeScreen({

    onBackToProfiles

}){

    const[homeStage,setHomeStage]=useState(0);



    const momentsRef=useRef(null);

    const{

        photoOverlay,

        videoOverlay,

        messageOverlay,

        openPhoto,

        openVideo,

        openMessage,

        closePhoto,

        closeVideo,

        closeMessage

    }=useOverlays();

    const homeRef=useRef(null);

    useLayoutEffect(()=>{

        if(!homeRef.current){

            return;

        }

        homeRef.current.scrollTop=0;

    },[]);

    useEffect(()=>{

        const timers=[

            setTimeout(

                ()=>setHomeStage(1),

                80

            ),

            setTimeout(

                ()=>setHomeStage(2),

                400

            ),

            setTimeout(

                ()=>setHomeStage(3),

                750

            ),

            setTimeout(

                ()=>setHomeStage(4),

                950

            ),

            setTimeout(

                ()=>setHomeStage(5),

                1150

            ),

            setTimeout(

                ()=>setHomeStage(6),

                1350

            ),

            setTimeout(

                ()=>setHomeStage(7),

                1550

            ),

            setTimeout(

                ()=>setHomeStage(8),

                1750

            ),

            setTimeout(

                ()=>setHomeStage(9),

                1950

            )

        ];

        return()=>{

            timers.forEach(

                timer=>

                    clearTimeout(timer)

            );

        };

    },[]);

    function scrollToMoments(){

        if(!homeRef.current){

            return;

        }

        if(!momentsRef.current){

            return;

        }

        homeRef.current.scrollTo({

            top:momentsRef.current.offsetTop,

            left:0,

            behavior:"smooth"

        });

    }

    return(

        <main className="cinema-app">

            <div

                ref={homeRef}

                className="cinema-mobile"

            >

                    <section className="cinema-hero">

                        <HomeHeader

                            onBackToProfiles={

                                onBackToProfiles

                            }

                            homeStage={

                                homeStage

                            }

                        />

                        <Hero

                            homeStage={

                                homeStage

                            }

                            onPlayVideo={

                                scrollToMoments

                            }

                        />

                    </section>

                    <div

                        ref={momentsRef}

                        className={`

                            cinema-row-intro

                            ${

                                homeStage>=7

                                    ?

                                    "cinema-show-row"

                                    :

                                    ""

                            }

                        `}

                    >

                        <MomentsRow

                            onOpen={

                                openPhoto

                            }

                        />

                    </div>

                    <div

                        className={`

                            cinema-row-intro

                            ${

                                homeStage>=8

                                    ?

                                    "cinema-show-row"

                                    :

                                    ""

                            }

                        `}

                    >

                        <VideosRow

                            onOpen={

                                openVideo

                            }

                        />

                    </div>

                    <div

                        className={`

                            cinema-row-intro

                            ${

                                homeStage>=9

                                    ?

                                    "cinema-show-row"

                                    :

                                    ""

                            }

                        `}

                    >

                        <MessagesRow

                            onOpen={

                                openMessage

                            }

                        />

                    </div>

                

                {

                    photoOverlay && (

                        <PhotoOverlay

                            data={photoOverlay}

                            onClose={closePhoto}

                        />

                    )

                }

                {

                    videoOverlay && (

                        <VideoOverlay

                            data={videoOverlay}

                            onClose={closeVideo}

                        />

                    )

                }

                {

                    messageOverlay && (

                        <MessageOverlay

                            data={messageOverlay}

                            onClose={closeMessage}

                        />

                    )

                }

            </div>

        </main>

    );

}