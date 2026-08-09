import {createClient} from "@supabase/supabase-js";

const SUPABASE_URL=
    process.env.SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY=
    process.env.SUPABASE_SERVICE_ROLE_KEY;

const PRICE_CENTS=11000;

const CURRENCY="mxn";

const MAX_HTML_LENGTH=5*1024*1024;

const headers={

    "Content-Type":
        "application/json",

    "Access-Control-Allow-Origin":
        "*",

    "Access-Control-Allow-Headers":
        "Content-Type",

    "Access-Control-Allow-Methods":
        "POST, OPTIONS"

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

function cleanProjectData(project){

    if(

        !project ||

        typeof project!=="object" ||

        Array.isArray(project)

    ){

        return null;

    }

    const{

        paid,

        paid_at,

        stripe_session_id,

        ...safeProject

    }=project;

    return safeProject;

}

export async function handler(event){

    if(event.httpMethod==="OPTIONS"){

        return response(

            204,

            {}

        );

    }

    if(event.httpMethod!=="POST"){

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

    let body;

    try{

        body=
            JSON.parse(

                event.body||"{}"

            );

    }catch(error){

        return response(

            400,

            {

                error:
                    "Invalid JSON body."

            }

        );

    }

    const project=
        cleanProjectData(

            body?.project

        );

    const html=
        typeof body?.html==="string"

        ?

        body.html

        :

        "";

    if(!project){

        return response(

            400,

            {

                error:
                    "A valid project is required."

            }

        );

    }

    if(!html){

        return response(

            400,

            {

                error:
                    "The generated HTML is required."

            }

        );

    }

    if(html.length>MAX_HTML_LENGTH){

        return response(

            413,

            {

                error:
                    "The generated HTML is too large."

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

    const projectData={

        ...project,

        paid:false,

        paid_at:null,

        stripe_session_id:null

    };

    const{

        data,

        error

    }=

        await supabase

            .from("projects")

            .insert({

                project_data:
                    projectData,

                html,

                price_cents:
                    PRICE_CENTS,

                currency:
                    CURRENCY,

                paid:false,

                stripe_session_id:null,

                paid_at:null

            })

            .select("id")

            .single();

    if(error){

        console.error(

            "Supabase insert error:",

            error

        );

        return response(

            500,

            {

                error:
                    "Could not create the pending project."

            }

        );

    }

    return response(

        200,

        {

            success:true,

            projectId:
                data.id,

            priceCents:
                PRICE_CENTS,

            currency:
                CURRENCY

        }

    );

}