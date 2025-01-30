<script lang="ts">
    import { Card } from 'flowbite-svelte';
    import { getProjects } from 'client';
    import type { Project } from 'client';

    async function fetchProjects(){
        const res = await getProjects({});
        if (res.response.ok) {
            return (res.data as Project[]);
        } else if (res.response.status === 511) {
            throw new Error("You must be logged in to access Projects.")
        } else {
            throw new Error(res.error!.message);
        }
    }
    let gprojects = fetchProjects();
</script>

<div class="flex flex-wrap -mt-2 -mr-2">
    {#await gprojects}
        <p>loading</p>
    {:then data}
        {#each data as project}
            <Card class="mt-2 mr-2" img="{project.logo_url}" href="/project/{project.id}" imgClass="h-64" horizontal size="md">
                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {project.short_name}
                </h5>
                <p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">
                    {project.long_name}
                </p>
            </Card>
        {/each}
    {:catch error}
	    <p class="text-red-800">{error.message}</p>
    {/await}
</div>
