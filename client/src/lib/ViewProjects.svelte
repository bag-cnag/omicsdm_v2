<script>
    import { Card } from 'flowbite-svelte';
    import { getProjects } from 'client';
</script>

<div class="flex flex-wrap -mt-2 -mr-2">
    {#await getProjects()}
        <p>loading</p>
    {:then projects}
        {#each projects.data as project}
            <Card class="mt-2 mr-2" img="{project.logo_url}" href="/project/{project.id}" imgClass="h-64" horizontal size="md">
                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {project.short_name}
                </h5>
                <p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">
                    {project.long_name}
                </p>
            </Card>
        {/each}
    {/await}
</div>
