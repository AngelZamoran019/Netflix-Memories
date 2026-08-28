import rendererCSS from "../renderer/NetflixRenderer.css?raw";

const INTRO_VIDEO="https://vzluajyoibwbibdhhhmg.supabase.co/storage/v1/object/sign/PROYECTOS/MUESTRA/Video%20Intro/YTDown.com_YouTube_Netflix-Intro-1080p-Highest-Quality_Media_6Jg_rkKtJgo_001_1080p.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jNjliN2NmYS1jYjE5LTQyZjEtYjg5Ni03MDA3YzE3M2U3YzIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJQUk9ZRUNUT1MvTVVFU1RSQS9WaWRlbyBJbnRyby9ZVERvd24uY29tX1lvdVR1YmVfTmV0ZmxpeC1JbnRyby0xMDgwcC1IaWdoZXN0LVF1YWxpdHlfTWVkaWFfNkpnX3JrS3RKZ29fMDAxXzEwODBwLm1wNCIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODc1NTkxMTgsImV4cCI6NTI4ODA1NTExOH0.bBUM1ylJBrmIZhdK_wnV5yYIIxIWC9SPYusZ0MtS1jo";

const NETFLIX_LOGO="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg";

function esc(value){

    return String(value??"")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");

}

export default function createHTML(project){

    const data=JSON.stringify(project||{})
        .replace(/</g,"\\u003c")
        .replace(/>/g,"\\u003e")
        .replace(/&/g,"\\u0026");

    const css=`
${rendererCSS}


html,
body,
#root{

    width:100%;

    min-height:100%;

    background:#000;

}

body{

    overflow:hidden;

}

.cr-app{

    width:100%;

    height:100dvh;

    min-height:100dvh;

    background:#000;

}

.cr-mobile{

    width:100%;

    max-width:430px;

    height:100dvh;

    min-height:100dvh;

    margin:0 auto;

    overflow-x:hidden;

    overflow-y:auto;

}

.export-profiles-exit{

    animation:
        exportProfilesExit
        .9s
        ease
        forwards;

}

@keyframes exportProfilesExit{

    from{

        opacity:1;

    }

    to{

        opacity:0;

    }

}
`;

    return `<!DOCTYPE html>
<html lang="es">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width,initial-scale=1.0,viewport-fit=cover"
>

<meta
    name="theme-color"
    content="#000000"
>

<title>${esc(project?.title||"Netflix Memories")}</title>

<style>

${css}

</style>

</head>

<body>

<div id="root">

    <div class="cr-app">

        <div
            class="cr-mobile"
            id="app"
        ></div>

    </div>

</div>

<script
    id="project-data"
    type="application/json"
>${data}</script>

<script>

(function(){

"use strict";

const p=
    JSON.parse(
        document
            .getElementById("project-data")
            .textContent
    );

const app=
    document.getElementById("app");

const INTRO=${JSON.stringify(INTRO_VIDEO)};

const LOGO=${JSON.stringify(NETFLIX_LOGO)};

let profile=null;

let video=null;

let playing=false;

let timers=[];


function e(value){

    return String(value??"")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");

}


function clear(){

    timers.forEach(
        clearTimeout
    );

    timers=[];

}


function start(){

    clear();

    app.innerHTML=

        '<section class="cr-start" '+
        'style="position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:100%;min-height:100dvh;background:#000;z-index:9999;">'+

            '<button '+
                'type="button" '+
                'class="cr-start-button" '+
                'id="start" '+
                'style="display:block;position:relative;z-index:10000;margin:0;padding:16px 80px;border:0;border-radius:5px;background:#E50914;color:#fff;font-size:22px;font-weight:700;line-height:1;cursor:pointer;">'+

                'INICIAR'+

            '</button>'+

        '</section>';

    const startButton=
        document.getElementById("start");

    if(startButton){

        startButton.onclick=intro;

    }

}


function intro(){

    app.innerHTML=

        '<section class="cr-intro" '+
        'style="width:100%;height:100%">'+

            '<video '+
                'class="cr-intro-video" '+
                'id="intro" '+
                'autoplay '+
                'playsinline>'+

                '<source '+
                    'src="'+e(INTRO)+'" '+
                    'type="video/mp4">'+

            '</video>'+

        '</section>';

    const introVideo=
        document.getElementById("intro");

    introVideo.onended=profiles;

    introVideo
        .play()
        .catch(()=>{});

}


function profiles(){

    clear();

    const profiles=
        Array.isArray(p.profiles)
            ?
            p.profiles
            :
            [];

    if(!profiles.length){

        app.innerHTML=

            '<section '+
                'class="cinema-profiles-screen">'+

                '<img '+
                    'class="cinema-profiles-logo profiles-logo" '+
                    'src="'+e(LOGO)+'" '+
                    'alt="Netflix">'+

                '<h1 '+
                    'class="cinema-profiles-title profiles-title">'+

                    'Agrega un perfil desde el editor'+

                '</h1>'+

            '</section>';

        return;

    }

    app.innerHTML=

        '<section '+
            'class="cinema-profiles-screen" '+
            'id="profiles">'+

            '<img '+
                'class="cinema-profiles-logo profiles-logo" '+
                'src="'+e(LOGO)+'" '+
                'alt="Netflix">'+

            '<h1 '+
                'class="cinema-profiles-title profiles-title">'+

                '¿Quién está viendo ahora?'+

            '</h1>'+

            '<div class="cinema-profiles-scroll">'+

                '<div class="cinema-profiles-row">'+

                    profiles
                        .map(
                            (item,index)=>

                                '<div '+
                                    'class="cinema-profile-card profile-item" '+
                                    'style="--profile-index:'+index+'" '+
                                    'data-i="'+index+'">'+

                                    '<img '+
                                        'class="cinema-profile-image" '+
                                        'src="'+
                                            e(item.image||"")+
                                        '" '+
                                        'alt="'+
                                            e(item.name||"")+
                                        '">'+

                                    '<p '+
                                        'class="cinema-profile-name">'+

                                        e(item.name||"")

                                    +'</p>'+

                                '</div>'

                        )
                        .join("")

                +'</div>'+

            '</div>'+

        '</section>';

    app
        .querySelectorAll("[data-i]")
        .forEach(card=>{

            card.onclick=()=>{

                profile=
                    profiles[
                        Number(card.dataset.i)
                    ]||null;

                document
                    .getElementById("profiles")
                    .classList
                    .add(
                        "export-profiles-exit"
                    );

                setTimeout(
                    home,
                    900
                );

            };

        });

}


function row(title,items,type){

    if(!items.length){

        return "";

    }

    return (

        '<section class="cinema-row">'+

            '<h2 class="cinema-row-title">'+

                e(title)+

            '</h2>'+

            '<div class="cinema-row-wrapper">'+

                '<div class="cinema-row-content">'+

                    items
                        .map(
                            (item,index)=>{

                                if(
                                    type==="m"
                                ){

                                    return (

                                        '<article '+
                                            'class="cinema-card cinema-card-moments" '+
                                            'data-t="m" '+
                                            'data-i="'+index+'">'+

                                            (
                                                item.image

                                                ?

                                                '<img '+
                                                    'class="cinema-card-image" '+
                                                    'src="'+
                                                        e(item.image)+
                                                    '" '+
                                                    'alt="">'

                                                :

                                                ""
                                            )+

                                        '</article>'

                                    );

                                }

                                if(
                                    type==="v"
                                ){

                                    const image=

                                        item.thumbnail||

                                        item.image||

                                        "";

                                    return (

                                        '<article '+
                                            'class="cinema-card cinema-card-videos" '+
                                            'data-t="v" '+
                                            'data-i="'+index+'">'+

                                            (
                                                image

                                                ?

                                                '<img '+
                                                    'class="cinema-card-image" '+
                                                    'src="'+
                                                        e(image)+
                                                    '" '+
                                                    'alt="">'

                                                :

                                                ""
                                            )+

                                        '</article>'

                                    );

                                }

                                return (

                                    '<article '+
                                        'class="cinema-card cinema-card-messages" '+
                                        'data-t="g" '+
                                        'data-i="'+index+'">'+

                                        '<div '+
                                            'class="cinema-card-message-preview">'+
                                        '</div>'+

                                    '</article>'

                                );

                            }
                        )
                        .join("")

                +'</div>'+

                '<div class="cinema-row-fade"></div>'+

            '</div>'+

        '</section>'

    );

}


function home(){

    clear();

    playing=false;

    const background=

        profile?.background||

        p.homeBackground||

        p.background||

        "";

    const avatar=

        profile?.avatar||

        profile?.image||

        p.profile||

        "";

    const moments=
        Array.isArray(p.moments)
            ?
            p.moments
            :
            [];

    const videos=
        Array.isArray(p.videos)
            ?
            p.videos
            :
            [];

    const messages=
        Array.isArray(p.messages)
            ?
            p.messages
            :
            [];

    app.innerHTML=

        '<main class="cinema-app">'+

            '<div '+
                'class="cinema-mobile" '+
                'id="home">'+

                '<section class="cinema-hero">'+

'<header '+
    'class="cinema-header" '+
    'id="header">'+

    '<img '+
        'class="cinema-logo" '+
        'src="'+e(LOGO)+'" '+
        'alt="Netflix">'+

                        (
                            avatar

                            ?

                            '<img '+
                                'class="cinema-avatar" '+
                                'id="avatar" '+
                                'src="'+e(avatar)+'" '+
                                'alt="Perfil">'

                            :

                            ""
                        )+

                    '</header>'+

                    (

                        p.heroBackgroundVideo

                        ?

                        '<video '+
                            'class="cinema-background cinema-hero-background-video cinema-stage-0" '+
                            'id="bg" '+
                            'src="'+
                                e(p.heroBackgroundVideo)+
                            '" '+
                            'autoplay '+
                            'muted '+
                            'loop '+
                            'playsinline '+
                            'aria-hidden="true">'+
                        '</video>'

                        :

                        '<div '+
                            'class="cinema-background cinema-stage-0" '+
                            'id="bg" '+
                            'style="background-image:url(\\''+
                                e(background)+
                            '\\')">'+
                        '</div>'

                    )+



                    '<div '+
                        'class="cinema-hero-overlay">'+
                    '</div>'+

                    '<div '+
                        'class="cinema-hero-content">'+

                        '<h1 '+
                            'class="cinema-title" '+
                            'id="title">'+

                            e(p.title||"")

                        +'</h1>'+

                        '<p '+
                            'class="cinema-description" '+
                            'id="desc">'+

                            e(p.description||"")

                        +'</p>'+

                        '<button '+
                            'class="cinema-play" '+
                            'id="play" '+
                            'type="button" '+
                            (
                                p.heroVideo
                                    ?
                                    ""
                                    :
                                    "disabled"
                            )+
                        '>'+

                            '▶ Play'+

                        '</button>'+

                    '</div>'+

                '</section>'+

                '<div id="moments">'+

                    row(
                        "Momentos",
                        moments,
                        "m"
                    )+

                '</div>'+

                '<div id="videos">'+

                    row(
                        "Videos",
                        videos,
                        "v"
                    )+

                '</div>'+

                '<div id="messages">'+

                    row(
                        "Mensajes",
                        messages,
                        "g"
                    )+

                '</div>'+

            '</div>'+

        '</main>';



    document
        .getElementById("play")
        .onclick=toggle;

    const avatarButton=
        document.getElementById(
            "avatar"
        );

    if(avatarButton){

        avatarButton.onclick=profiles;

    }


    app
        .querySelectorAll("[data-t]")
        .forEach(card=>{

            card.onclick=()=>{

                const index=
                    Number(card.dataset.i);

                const type=
                    card.dataset.t;

                if(type==="m"){

                    photo(
                        moments[index],
                        card
                    );

                }

                if(type==="v"){

                    videoOpen(
                        videos[index],
                        card
                    );

                }

                if(type==="g"){

                    message(
                        messages[index],
                        card
                    );

                }

            };

        });

    stage();

}


function stage(){

    const bg=
        document.getElementById("bg");

    const header=
        document.getElementById("header");

    const title=
        document.getElementById("title");

    const description=
        document.getElementById("desc");

    const play=
        document.getElementById("play");

    const rows=[

        document.querySelector(
            "#moments>.cinema-row-intro"
        ),

        document.querySelector(
            "#videos>.cinema-row-intro"
        ),

        document.querySelector(
            "#messages>.cinema-row-intro"
        )

    ];

    [

        [1,80],
        [2,400],
        [3,750],
        [4,950],
        [5,1150],
        [6,1350],
        [7,1550],
        [8,1750],
        [9,1950]

    ].forEach(

        ([stageValue,delay])=>{

            timers.push(

                setTimeout(

                    ()=>{

                        bg.className=

                            bg.tagName==="VIDEO"

                            ?

                            "cinema-background cinema-hero-background-video cinema-stage-"+
                            stageValue

                            :

                            "cinema-background cinema-stage-"+
                            stageValue;

                        if(stageValue>=3){

                            header
                                .classList
                                .add(
                                    "cinema-show-header"
                                );

                        }

                        if(stageValue>=4){

                            title
                                .classList
                                .add(
                                    "cinema-show-title"
                                );

                        }

                        if(stageValue>=5){

                            description
                                .classList
                                .add(
                                    "cinema-show-description"
                                );

                        }

                        if(stageValue>=6){

                            play
                                .classList
                                .add(
                                    "cinema-show-play"
                                );

                        }

                        if(
                            stageValue>=7&&
                            rows[0]
                        ){

                            rows[0]
                                .classList
                                .add(
                                    "cinema-show-row"
                                );

                        }

                        if(
                            stageValue>=8&&
                            rows[1]
                        ){

                            rows[1]
                                .classList
                                .add(
                                    "cinema-show-row"
                                );

                        }

                        if(
                            stageValue>=9&&
                            rows[2]
                        ){

                            rows[2]
                                .classList
                                .add(
                                    "cinema-show-row"
                                );

                        }

                    },

                    delay

                )

            );

        }

    );

}


function toggle(){

    const playButton=
        document.getElementById("play");

    if(
        !p.heroVideo||
        !playButton
    ){

        return;

    }

    const existing=
        document.querySelector(
            '.floating-viewer[data-hero-video="true"]'
        );

    if(existing){

        closeOverlay(
            existing
        );

        playButton.style.opacity="";

        return;

    }

    videoOpen(

        {
            video:p.heroVideo
        },

        playButton,

        true

    );

}


function scrollMoments(){

    const homeElement=
        document.getElementById("home");

    const momentsElement=
        document.getElementById("moments");

    if(
        homeElement&&
        momentsElement
    ){

        homeElement.scrollTo({

            top:
                momentsElement.offsetTop,

            left:0,

            behavior:"smooth"

        });

    }

}


function overlayBase(className){

    const overlay=
        document.createElement("div");

    overlay.className=className;

    document.body.appendChild(
        overlay
    );

    return overlay;

}


function closeOverlay(overlay){

    if(overlay){

        overlay.remove();

    }

}


function photo(item,origin){

    if(
        !item||
        !item.image||
        !origin
    ){

        return;

    }

    const rect=
        origin.getBoundingClientRect();

    const overlay=
        overlayBase(
            "floating-viewer floating-viewer-show"
        );

    overlay.innerHTML=

        '<div class="floating-backdrop"></div>'+

        '<div class="floating-card">'+

            '<img '+
                'class="floating-image" '+
                'src="'+
                    e(item.image)+
                '" '+
                'alt="">'+

            (
                item.description

                ?

                '<div class="floating-gradient"></div>'+

                '<div class="floating-panel">'+

                    '<p '+
                        'class="floating-description">'+

                        e(item.description)+

                    '</p>'+

                '</div>'

                :

                ""

            )+

        '</div>';

    const card=
        overlay.querySelector(
            ".floating-card"
        );

    const panel=
        overlay.querySelector(
            ".floating-panel"
        );

    const gradient=
        overlay.querySelector(
            ".floating-gradient"
        );

    const description=
        overlay.querySelector(
            ".floating-description"
        );

    const width=
        Math.min(
            window.innerWidth*.95,
            350
        );

    const height=
        width*4/5;

    const targetLeft=
        (window.innerWidth-width)/2;

    const targetTop=
        window.innerHeight*.13;

    card.style.cssText=

        "left:"+
        rect.left+
        "px;"+
        "top:"+
        rect.top+
        "px;"+
        "width:"+
        rect.width+
        "px;"+
        "height:"+
        rect.height+
        "px";

    origin.style.opacity="0";

    requestAnimationFrame(()=>{

        card.style.left=
            targetLeft+
            "px";

        card.style.top=
            targetTop+
            "px";

        card.style.width=
            width+
            "px";

        card.style.height=
            height+
            "px";

    });

    if(
        item.description
    ){

        window.setTimeout(()=>{

            if(panel){

                panel.classList.add(
                    "show"
                );

            }

            if(gradient){

                gradient.classList.add(
                    "show"
                );

            }

            if(description){

                description.classList.add(
                    "show"
                );

            }

        },320);

    }

    function close(){

        if(panel){

            panel.classList.remove(
                "show"
            );

        }

        if(gradient){

            gradient.classList.remove(
                "show"
            );

        }

        if(description){

            description.classList.remove(
                "show"
            );

        }

        card.style.left=
            rect.left+
            "px";

        card.style.top=
            rect.top+
            "px";

        card.style.width=
            rect.width+
            "px";

        card.style.height=
            rect.height+
            "px";

        window.setTimeout(()=>{

            origin.style.opacity="";

            closeOverlay(
                overlay
            );

        },320);

    }

    overlay
        .querySelector(
            ".floating-backdrop"
        ).onclick=close;

    card.onclick=close;

}

function videoOpen(item,origin,isHero=false){

    if(

        !item||
        !item.video||
        !origin
    ){

        return;

    }

    const rect=
        origin.getBoundingClientRect();

    const overlay=
        overlayBase(
            "floating-viewer floating-viewer-show"
        );

    overlay.dataset.heroVideo=
        isHero
            ?
            "true"
            :
            "false";

    overlay.innerHTML=

        '<div class="floating-backdrop"></div>'+

        '<div class="floating-card"></div>';

    const card=
        overlay.querySelector(
            ".floating-card"
        );

    const floatingVideo=
        document.createElement(
            "video"
        );

    floatingVideo.className=
        "floating-video";

    floatingVideo.src=
        item.video;

    floatingVideo.playsInline=true;

    floatingVideo.controls=true;

    card.appendChild(
        floatingVideo
    );

    card.style.cssText=

        "left:"+
        rect.left+
        "px;top:"+
        rect.top+
        "px;width:"+
        rect.width+
        "px;height:"+
        rect.height+
        "px";

    origin.style.opacity="0";

    function target(){

        const ratio=
            floatingVideo.videoWidth&&
            floatingVideo.videoHeight

            ?

            floatingVideo.videoWidth/
            floatingVideo.videoHeight

            :

            16/9;

        const maxWidth=
            window.innerWidth*.95;

        const maxHeight=
            window.innerHeight*.85;

        let width=
            maxWidth;

        let height=
            width/ratio;

        if(height>maxHeight){

            height=
                maxHeight;

            width=
                height*ratio;

        }

        if(width>maxWidth){

            width=
                maxWidth;

            height=
                width/ratio;

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

    function expand(){

        const targetRect=
            target();

        requestAnimationFrame(()=>{

            card.style.left=
                targetRect.left+
                "px";

            card.style.top=
                targetRect.top+
                "px";

            card.style.width=
                targetRect.width+
                "px";

            card.style.height=
                targetRect.height+
                "px";

        });

        const play=()=>{

            floatingVideo.currentTime=0;

            floatingVideo
                .play()
                .catch(()=>{});

        };

        if(
            floatingVideo.readyState>=1
        ){

            play();

        }

        else{

            floatingVideo.addEventListener(

                "loadedmetadata",

                play,

                {
                    once:true
                }

            );

        }

    }

    if(
        floatingVideo.readyState>=1
    ){

        expand();

    }

    else{

        floatingVideo.addEventListener(

            "loadedmetadata",

            expand,

            {
                once:true
            }

        );

    }

    function close(){

        floatingVideo.pause();

        card.style.left=
            rect.left+
            "px";

        card.style.top=
            rect.top+
            "px";

        card.style.width=
            rect.width+
            "px";

        card.style.height=
            rect.height+
            "px";

        window.setTimeout(()=>{

            origin.style.opacity="";

            closeOverlay(
                overlay
            );

        },300);

    }

overlay.querySelector(
    ".floating-backdrop"
).onclick=close;

card.onclick=close;

card.addEventListener(
    "touchend",
    close,
    {
        passive:true
    }
);

floatingVideo.onclick=close;

floatingVideo.addEventListener(
    "touchend",
    close,
    {
        passive:true
    }
);

floatingVideo.onended=()=>{
    close();
};

}


function message(item,origin){

    if(!origin){

        return;

    }

    const data=

        typeof item==="string"

        ?

        {

            body:item,

            signature:"",

            fontSize:20

        }

        :

        {

            body:
                item?.body||
                item?.description||
                item?.text||
                item?.message||
                "",

            signature:
                item?.signature||
                "",

            fontSize:
                item?.fontSize??
                20

        };

    const rect=
        origin.getBoundingClientRect();

    const overlay=
        overlayBase(
            "floating-message-viewer floating-message-viewer-show"
        );

    overlay.style.left="0";

    overlay.style.top="0";

    overlay.style.width="100vw";

    overlay.style.height="100vh";

    overlay.innerHTML=

        '<button '+
            'class="floating-message-backdrop" '+
            'aria-label="Cerrar carta">'+
        '</button>'+

        '<section class="floating-message-card">'+

            '<div '+
                'class="message-envelope">'+

                '<div class="envelope-back"></div>'+

                '<div class="paper-wrapper">'+

                    '<article class="message-paper">'+

                        '<div class="paper-border"></div>'+

                        '<div '+
                            'class="paper-ornament paper-ornament-top">'+

                            '<span></span>♥<span></span>'+

                        '</div>'+

                        '<div '+
                            'class="message-content" '+
                            'style="font-size:'+
                                Number(data.fontSize)+
                                'px">'+

                            e(data.body)+

                        '</div>'+

                        '<div class="message-signature">'+

                            e(data.signature)+

                        '</div>'+

                        '<div '+
                            'class="paper-ornament paper-ornament-bottom">'+

                            '<span></span>♥<span></span>'+

                        '</div>'+

                    '</article>'+

                '</div>'+

                '<div class="envelope-left"></div>'+

                '<div class="envelope-right"></div>'+

                '<div class="envelope-front"></div>'+

                '<div class="envelope-top"></div>'+

                '<div class="message-seal">'+

                    '<span>♥</span>'+

                '</div>'+

            '</div>'+

        '</section>';

    const card=
        overlay.querySelector(
            ".floating-message-card"
        );

    const envelope=
        overlay.querySelector(
            ".message-envelope"
        );

    const width=
        Math.min(
            window.innerWidth*.82,
            340
        );

    const height=
        width/.655;

    const targetLeft=
        (window.innerWidth-width)/2;

    const targetTop=
        (window.innerHeight-height)/2;

    card.style.cssText=

        "left:"+
        rect.left+
        "px;"+
        "top:"+
        rect.top+
        "px;"+
        "width:"+
        rect.width+
        "px;"+
        "height:"+
        rect.height+
        "px";

    origin.style.opacity="0";

    requestAnimationFrame(()=>{

        card.style.left=
            targetLeft+
            "px";

        card.style.top=
            targetTop+
            "px";

        card.style.width=
            width+
            "px";

        card.style.height=
            height+
            "px";

    });

    const openTimer=

        setTimeout(()=>{

            envelope.className=
                "message-envelope message-envelope-opening";

        },380);

    const openPaperTimer=

        setTimeout(()=>{

            envelope.className=
                "message-envelope message-envelope-open";

        },860);

    const readableTimer=

        setTimeout(()=>{

            envelope.className=
                "message-envelope message-envelope-readable";

        },1320);

    function close(){

        clearTimeout(openTimer);

        clearTimeout(openPaperTimer);

        clearTimeout(readableTimer);

        envelope.className=
            "message-envelope";

        card.style.left=
            rect.left+
            "px";

        card.style.top=
            rect.top+
            "px";

        card.style.width=
            rect.width+
            "px";

        card.style.height=
            rect.height+
            "px";

        window.setTimeout(()=>{

            origin.style.opacity="";

            closeOverlay(
                overlay
            );

        },380);

    }

    overlay
        .querySelector(
            ".floating-message-backdrop"
        )
        .onclick=close;

    card.onclick=close;

}


start();

})();

</script>

</body>

</html>`;

}