<script lang="ts">
    import ViewProjects from '../lib/ViewProjects.svelte'
    import { goto } from '$app/navigation';
    import { isAuthenticated, groups } from '../auth';
    import { TabItem, Tabs } from 'flowbite-svelte';
    import { ProjectForm } from '$lib/form';
    import { projectCreate } from './submit';

    let write_selected: Array<string> = []
    let download_selected: Array<string> = []
</script>


<h1 class="text-3xl font-bold text-center">
	3TR Data Warehouse !
</h1>


<Tabs class="relative">
    <div class="items-center">
        <TabItem open title="Projects">
            <ViewProjects />
        </TabItem>
    </div>
    {#if $isAuthenticated && $groups.includes("admin")}
        <div class="flex absolute right-0">
            <TabItem title="+ New">
                <h1>Create new project</h1>
                <ProjectForm
                    bind:write_selected
                    bind:download_selected
                    onsubmit={(e: SubmitEvent) => projectCreate(e, write_selected, download_selected)}
                />
            </TabItem>
        </div>
    {/if}
</Tabs>

<!-- 
<div class="card">
    {#if $isAuthenticated && $groups.includes("admin")}
        <div class="flex absolute right-0">
        <button onclick={() => {goto("/project/create")}} type="button" class="inline-block text-sm font-medium text-center disabled:cursor-not-allowed p-4 text-gray-500 rounded-t-lg hover:text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300">
            + New
        </button>
        </div>
    {/if}
    
</div> -->
