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

                    src="https://vzluajyoibwbibdhhhmg.supabase.co/storage/v1/object/sign/PROYECTOS/MUESTRA/Video%20Intro/YTDown.com_YouTube_Netflix-Intro-1080p-Highest-Quality_Media_6Jg_rkKtJgo_001_1080p.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jNjliN2NmYS1jYjE5LTQyZjEtYjg5Ni03MDA3YzE3M2U3YzIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJQUk9ZRUNUT1MvTVVFU1RSQS9WaWRlbyBJbnRyby9ZVERvd24uY29tX1lvdVR1YmVfTmV0ZmxpeC1JbnRyby0xMDgwcC1IaWdoZXN0LVF1YWxpdHlfTWVkaWFfNkpnX3JrS3RKZ29fMDAxXzEwODBwLm1wNCIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODc1NTkxMTgsImV4cCI6NTI4ODA1NTExOH0.bBUM1ylJBrmIZhdK_wnV5yYIIxIWC9SPYusZ0MtS1jo"

                    type="video/mp4"

                />

            </video>

        </section>

    );

}