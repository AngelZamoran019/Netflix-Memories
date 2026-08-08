export default function IntroScreen({onFinish}){

    return(

        <section className="cr-intro">

            <video

                className="cr-intro-video"

                autoPlay

                playsInline

                onEnded={onFinish}

            >

                <source

                    src="https://aypgsriighcuegzuqmxj.supabase.co/storage/v1/object/public/PruebaNetflix/Video%20Inicial/YTDown.com_YouTube_Netflix-New-Logo-Animation-2019_Media_GV3HUDMQ-F8_001_1080p.mp4"

                    type="video/mp4"

                />

            </video>

        </section>

    );

}