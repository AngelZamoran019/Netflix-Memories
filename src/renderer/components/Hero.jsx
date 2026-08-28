import {useRef,useState} from "react";

import {useNetflix} from "../context/NetflixContext";

import VideoOverlay from "./VideoOverlay";

export default function Hero({

    homeStage=0,

    onPlayVideo

}){

    const{

        project,

        selectedProfile

    }=useNetflix();

    const playButtonRef=useRef(null);

    const[videoOverlay,setVideoOverlay]=useState(null);

    const heroBackground=

        selectedProfile?.background ||

        project?.homeBackground ||

        project?.background ||

        "";

    function openHeroVideo(){

        if(
            !project?.heroVideo||
            !playButtonRef.current
        ){

            return;

        }

        setVideoOverlay({

            origin:playButtonRef.current,

            video:project.heroVideo,

            description:""

        });

    }

    function closeHeroVideo(){

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

    }

    function togglePlay(){

        if(videoOverlay){

            closeHeroVideo();

            return;

        }

        openHeroVideo();

    }

    return(

        <>

            <div

                className={`

                    cinema-background

                    cinema-stage-${homeStage}

                `}

                style={{

                    backgroundImage:

                        heroBackground

                        ?

                        `url(${heroBackground})`

                        :

                        "none"

                }}

            />

            {

                project?.heroBackgroundVideo &&

                <video

                    className={`

                        cinema-background

                        cinema-hero-background-video

                        cinema-stage-${homeStage}

                    `}

                    src={project.heroBackgroundVideo}

                    autoPlay

                    muted

                    loop

                    playsInline

                    aria-hidden="true"

                />

            }

            <div className="cinema-hero-overlay"/>

            <div className="cinema-hero-content">

                <h1

                    className={`

                        cinema-title

                        ${
                            homeStage>=4
                                ?
                                "cinema-show-title"
                                :
                                ""
                        }

                    `}

                >

                    {project.title}

                </h1>

                <p

                    className={`

                        cinema-description

                        ${
                            homeStage>=5
                                ?
                                "cinema-show-description"
                                :
                                ""
                        }

                    `}

                >

                    {project.description}

                </p>

                <button

                    ref={playButtonRef}

                    className={`

                        cinema-play

                        ${
                            homeStage>=6
                                ?
                                "cinema-show-play"
                                :
                                ""
                        }

                    `}

                    type="button"

                    onClick={togglePlay}

                    disabled={!project?.heroVideo}

                >

                    {

                        videoOverlay

                        ?

                        "⏸ Pausar"

                        :

                        "▶ Play"

                    }

                </button>

            </div>

            {

                videoOverlay &&

                <VideoOverlay

                    data={videoOverlay}

                    onClose={closeHeroVideo}

                />

            }

        </>

    );

}