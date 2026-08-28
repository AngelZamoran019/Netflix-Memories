const STORAGE_KEY="netflix_memories_projects";

const DEFAULT_PRICE_CENTS=11000;

const DEFAULT_CURRENCY="MXN";

function normalizeProject(project){

    if(
        !project ||
        typeof project!=="object" ||
        Array.isArray(project)
    ){

        return project;

    }

    const normalizedProject={
        ...project,

        priceCents:
            Number.isInteger(
                Number(project.priceCents)
            ) &&
            Number(project.priceCents)>0

                ?

            Number(project.priceCents)

                :

            DEFAULT_PRICE_CENTS,

        currency:
            typeof project.currency==="string" &&
            project.currency.trim()

                ?

            project.currency
                .trim()
                .toUpperCase()

                :

            DEFAULT_CURRENCY

    };

    return normalizedProject;

}

export function getProjects(){

    const data=localStorage.getItem(
        STORAGE_KEY
    );

    if(!data){

        return [];

    }

    let projects;

    try{

        projects=JSON.parse(data);

    }catch{

        return [];

    }

    if(
        !Array.isArray(projects)
    ){

        return [];

    }

    const normalizedProjects=
        projects.map(
            normalizeProject
        );

    const changed=
        JSON.stringify(
            normalizedProjects
        )!==JSON.stringify(
            projects
        );

    if(changed){

        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(
                normalizedProjects
            )

        );

    }

    return normalizedProjects;

}

export function getProjectById(id){

    const projects=getProjects();

    return projects.find(

        project=>

            project.id===Number(id)

    );

}

export function saveProject(project){

    const projects=getProjects();

    const normalizedProject=
        normalizeProject(
            project
        );

    if(normalizedProject.id){

        const updated=projects.map(

            item=>

                item.id===
                normalizedProject.id

                    ?

                normalizedProject

                    :

                item

        );

        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(updated)

        );

        return normalizedProject;

    }

    const newProject={

        ...normalizedProject,

        id:Date.now(),

        template:
            normalizedProject.template ||
            "netflix-v1",

        created:
            normalizedProject.created ||
            new Date().toISOString(),

        published:false,

        publishedDate:null,

        priceCents:
            normalizedProject.priceCents,

        currency:
            normalizedProject.currency

    };

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify([

            ...projects,

            newProject

        ])

    );

    return newProject;

}

export function deleteProject(id){

    const projects=getProjects();

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(

            projects.filter(

                item=>

                    item.id!==id

            )

        )

    );

}