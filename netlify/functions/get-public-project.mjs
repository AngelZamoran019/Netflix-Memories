import {createClient} from "@supabase/supabase-js";

const SUPABASE_URL=
    process.env.SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY=
    process.env.SUPABASE_SERVICE_ROLE_KEY;

const headers={

    "Content-Type":
        "application/json",

    "Cache-Control":
        "no-store",

    "Access-Control-Allow-Origin":
        "*",

    "Access-Control-Allow-Headers":
        "Content-Type",

    "Access-Control-Allow-Methods":
        "GET, OPTIONS"

};

function response(
    statusCode,
    body
){

    return{

        statusCode,

        headers,

        body:
            JSON.stringify(body)

    };

}

export async function handler(event){

    if(
        event.httpMethod==="OPTIONS"
    ){

        return response(
            204,
            {}
        );

    }

    if(
        event.httpMethod!=="GET"
    ){

        return response(
            405,
            {
                error:
                    "Method not allowed"
            }
        );

    }

    if(
        !SUPABASE_URL ||
        !SUPABASE_SERVICE_ROLE_KEY
    ){

        console.error(
            "Missing Supabase environment variables."
        );

        return response(
            500,
            {
                error:
                    "Server configuration error."
            }
        );

    }

    const projectId=
        String(
            event.queryStringParameters?.id ||
            ""
        ).trim();

    if(!projectId){

        return response(
            400,
            {
                error:
                    "Project id is required."
            }
        );

    }

    const supabase=
        createClient(
            SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY,
            {
                auth:{
                    autoRefreshToken:false,
                    persistSession:false
                }
            }
        );

    const{

        data,
        error

    }=
        await supabase

            .from("projects")

            .select(
                "id, project_data, html, paid, paid_at"
            )

            .eq(
                "id",
                projectId
            )

            .maybeSingle();

    if(error){

        console.error(
            "Supabase public project lookup error:",
            error
        );

        return response(
            500,
            {
                error:
                    "Unable to load project."
            }
        );

    }

    if(!data){

        return response(
            404,
            {
                error:
                    "Project not found."
            }
        );

    }

    if(data.paid!==true){

        return response(
            402,
            {
                error:
                    "Project is not published yet.",
                paid:false
            }
        );

    }

    if(
        typeof data.html!=="string" ||
        !data.html.trim()
    ){

        console.error(
            "Published project has no HTML:",
            projectId
        );

        return response(
            500,
            {
                error:
                    "Published project has no HTML."
            }
        );

    }

    const projectData=
        data.project_data &&
        typeof data.project_data==="object"
            ?
            data.project_data
            :
            {};

    return response(
        200,
        {
            success:true,

            projectId:data.id,

            paid:true,

            paidAt:data.paid_at,

            title:
                typeof projectData.title==="string"
                    ?
                    projectData.title
                    :
                    "Netflix Memories",

            html:data.html
        }
    );

}

export default handler;