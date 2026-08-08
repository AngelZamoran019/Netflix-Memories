import {useNetflix} from "../../../../renderer/context/NetflixContext";

import MomentEditor from "../MomentEditor";

export default function MomentsSection(){

    const{

        project,

        update

    }=useNetflix();

    return(

        <MomentEditor

            moments={project.moments}

            setMoments={(value)=>

                update(

                    "moments",

                    value

                )

            }

        />

    );

}