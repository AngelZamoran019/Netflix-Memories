import Creator from "./creator/Creator";

import {NetflixProvider} from "./renderer/context/NetflixContext";

export default function App(){

    return(

        <NetflixProvider>

            <Creator/>

        </NetflixProvider>

    );

}