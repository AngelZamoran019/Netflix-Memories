const STORAGE_KEY="netflix_memories_projects";

export function getProjects(){

    const data=localStorage.getItem(
        STORAGE_KEY
    );

    return data

        ?

        JSON.parse(data)

        :

        [];

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

    if(project.id){

        const updated=projects.map(item=>

            item.id===project.id

                ?

                project

                :

                item

        );

        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(updated)

        );

        return project;

    }

    const newProject={

        ...project,

        id:Date.now(),

        template:project.template || "netflix-v1",

        created:new Date().toISOString(),

        published:false,

        publishedDate:null

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