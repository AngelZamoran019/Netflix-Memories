import {useRef,useState} from "react";

import "./NetflixRenderer.css";

import SCREENS from "./constants/screens";

import StartScreen from "./screens/StartScreen";
import IntroScreen from "./screens/IntroScreen";
import ProfilesScreen from "./screens/ProfilesScreen";
import {useNetflix} from "./context/NetflixContext";

import HomeScreen from "./screens/HomeScreen";

export default function NetflixRenderer(){

    return(

        <RendererContent/>

    );

}

function RendererContent(){

    const {

    setSelectedProfile

}=useNetflix();

    const [screen,setScreen]=useState(SCREENS.START);

    const [profilesExit,setProfilesExit]=useState(false);

    const [dragging,setDragging]=useState(false);

    const moved=useRef(false);

    const scrollRef=useRef(null);

    const startX=useRef(0);

    const scrollLeft=useRef(0);

    function handleStart(){

        setScreen(SCREENS.INTRO);

    }

    function finishIntro(){

        setScreen(SCREENS.PROFILES);

    }

    function startDrag(e){

        if(!scrollRef.current) return;

        setDragging(true);

        moved.current=false;

        startX.current=e.pageX;

        scrollLeft.current=scrollRef.current.scrollLeft;

    }

    function moveDrag(e){

        if(!dragging) return;

        moved.current=true;

        e.preventDefault();

        const walk=e.pageX-startX.current;

        scrollRef.current.scrollLeft=

            scrollLeft.current-walk;

    }

    function endDrag(){

        setDragging(false);

    }

function selectProfile(profile){

    setSelectedProfile(profile);

    setProfilesExit(true);

    setTimeout(()=>{

        setScreen(SCREENS.HOME);

    },900);

}

return(

        <div className="cr-app">

            <div className="cr-mobile">

                {

screen===SCREENS.START && (

    <StartScreen

        onStart={handleStart}

    />

)

                }

                {

                    screen===SCREENS.INTRO && (

                        <IntroScreen

                            onFinish={finishIntro}

                        />

                    )

                }

                {

                    screen===SCREENS.PROFILES && (

                        <ProfilesScreen

                            dragging={dragging}

                            moved={moved}

                            startDrag={startDrag}

                            moveDrag={moveDrag}

                            endDrag={endDrag}

                            profilesExit={profilesExit}

                            selectProfile={selectProfile}

                            scrollRef={scrollRef}

                        />

                    )

                }

                {

screen===SCREENS.HOME && (

    <HomeScreen

        onBackToProfiles={()=>{

            setProfilesExit(false);

            setScreen(SCREENS.PROFILES);

        }}

    />

)

                }

            </div>

        </div>

    );

}