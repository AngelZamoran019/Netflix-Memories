import {useNetflix} from "../context/NetflixContext";

export default function HomeHeader({

    onBackToProfiles,

    homeStage=0

}){

    const{

        project,

        selectedProfile

    }=useNetflix();

    const avatar=

        selectedProfile?.avatar ||

        selectedProfile?.image ||

        project?.profile ||

        "";

    return(

        <header

            className={`

                cinema-header

                ${
                    homeStage>=3
                        ?
                        "cinema-show-header"
                        :
                        ""
                }

            `}

        >

            <img

                className="cinema-logo"

                src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg"

                alt="Netflix"

            />

            {

                avatar &&

                <img

                    className="cinema-avatar"

                    src={avatar}

                    alt="Perfil"

                    onClick={onBackToProfiles}

                />

            }

        </header>

    );

}