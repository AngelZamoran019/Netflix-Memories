import ProjectSection from "./sections/ProjectSection";

import DesignSection from "./sections/DesignSection";

import ProfilesSection from "./sections/ProfilesSection";

import MomentsSection from "./sections/MomentsSection";

import VideosSection from "./sections/VideosSection";

import MessagesSection from "./sections/MessagesSection";

export default function EditorContent({

    section,

    onSave

}){

    switch(section){

        case "Proyecto":

            return(

                <ProjectSection

                    onSave={onSave}

                />

            );

        case "Diseño":

            return <DesignSection/>;

        case "Perfiles":

            return <ProfilesSection/>;

        case "Momentos":

            return <MomentsSection/>;

        case "Videos":

            return <VideosSection/>;

        case "Mensajes":

            return <MessagesSection/>;

        default:

            return null;

    }

}