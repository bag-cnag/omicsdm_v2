<script lang="ts">
    import ViewProjects from '../lib/ViewProjects.svelte'
    import { isAuthenticated, groups } from '../auth';
    import { TabItem, Tabs } from 'flowbite-svelte';
    import { ProjectForm } from '$lib/form';
    import { projectCreate } from './submit';
    import { goto } from '$app/navigation';
    import DirectForm from '$lib/form/DirectForm.svelte';

    let write_selected: Array<string> = [];
    let download_selected: Array<string> = [];
</script>

<Tabs class="relative">
    <div class="flex">
        <TabItem open title="Projects">
            <ViewProjects />
        </TabItem>
    </div>
    {#if $isAuthenticated && $groups.includes("admin")}
        <div class="flex absolute right-0">
            <TabItem title="+ New">
                <DirectForm
                    btnText="Send"
                    entry="project"
                />
                <hr />
                <h1>Create new project</h1>
                <ProjectForm
                    bind:write_selected
                    bind:download_selected
                    onsubmit={(e: Event) => projectCreate(e, write_selected, download_selected)}
                />
            </TabItem>
        </div>
    {/if}
</Tabs>
