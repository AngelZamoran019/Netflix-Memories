import {useNetflix} from "../context/NetflixContext";

export default function ProfilesScreen({

    dragging,

    moved,

    startDrag,

    moveDrag,

    endDrag,

    profilesExit,

    selectProfile,

scrollRef

}){

    const {project}=useNetflix();

    if(!project?.profiles || project.profiles.length===0){

        return(

            <section className="cinema-profiles-screen">

                <img

                    className="cinema-profiles-logo profiles-logo"

                    src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg"

                    alt="Netflix"

                />

                <h1 className="cinema-profiles-title profiles-title">

                    Agrega un perfil desde el editor

                </h1>

            </section>

        );

    }

    return(

        <section
            className={`cinema-profiles-screen ${profilesExit ? "profiles-exit" : ""}`}
        >

            <img

                className="cinema-profiles-logo profiles-logo"

                src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg"

                alt="Netflix"

            />

            <h1 className="cinema-profiles-title profiles-title">

                ¿Quién está viendo ahora?

            </h1>

<div

    ref={scrollRef}

    className={`cinema-profiles-scroll ${dragging ? "dragging" : ""}`}

                onMouseDown={startDrag}

                onMouseMove={moveDrag}

                onMouseUp={endDrag}

                onMouseLeave={endDrag}

            >

                <div className="cinema-profiles-row">

                    {

                        (project.profiles || []).map((profile,index)=>(

                            <div

                                key={profile.id}

                                className="cinema-profile-card profile-item"

                                style={{

                                    "--profile-index":index

                                }}

                                onClick={()=>{

                                    if(moved.current) return;

                                    selectProfile(profile);

                                }}

                            >

                                <img

                                    className="cinema-profile-image"

                                    src={profile.image}

                                    alt={profile.name}

                                    draggable={false}

                                />

                                <p className="cinema-profile-name">

                                    {profile.name}

                                </p>

                            </div>

                        ))

                    }

                </div>

            </div>

        </section>

    );

}