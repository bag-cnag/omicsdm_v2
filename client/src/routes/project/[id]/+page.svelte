<script lang="ts">
    import { getProjectsById, type Dataset, type Project} from "client";

    import { page } from "$app/stores";
    import { goto } from '$app/navigation';

    import { Tabs, TabItem } from 'flowbite-svelte';
    import { TableHandler, Datatable, Th, ThFilter, RowCount, RowsPerPage, Pagination, type State } from '@vincjo/datatables/server'

    import { checkGroups, isAuthenticated, groups } from "auth";
    import { DatasetForm, ProjectForm } from "$lib/form";
    import Modal from "$lib/ui/Modal.svelte";
    import SvgColumns from "$lib/icons/SvgColumns.svelte";
    import { reload } from "./table";
    import { datasetCreate, projectShare } from "./submit";
    import { onMount } from "svelte";

    // Local context
    const { id } = $page.params;
    const table = new TableHandler<Dataset>([], { rowsPerPage: 10 })
    let page_project = $state.raw<Project>();
    let showModal = $state(false);
    let pr_write_selected: Array<string> = $state([]);
    let pr_download_selected: Array<string> = $state([]);
        
    let ds_read_selected: Array<string> = $state([])
    let ds_write_selected: Array<string> = $state([])
    let ds_download_selected: Array<string> = $state([])


    // https://github.com/vincjo/datatables/blob/main/src/routes/examples/server/pokedex-api/Main.svelte
    table.load( (state: State) => reload(state, id));
    table.invalidate();

    const view = table.createView([
        { index: 0, name: 'Short Name' },
        { index: 1, name: 'Version' },
        { index: 2, name: 'Long Name' },
        { index: 3, name: 'Description' },
        { index: 4, name: 'Samples Count' },
    ])

    onMount(async ()=>{
        let response = await getProjectsById({
            path: {
                id: id
            }
        })
        if (response.response.ok){
            page_project = response.data!;

            // Fill in data for sharing
            if(page_project.perm_datasets && page_project.perm_datasets.write){
                for(const one of page_project.perm_datasets.write.groups!){
                    pr_write_selected.push(one.path!);
                }
            }
            if(page_project.perm_datasets && page_project.perm_datasets.download){
                for(const one of page_project.perm_datasets.download.groups!){
                    pr_download_selected.push(one.path!);
                }
            }
        } else {
            goto('/');
        }
    })
</script>
                
<style>
    tr {
        cursor: pointer;
    }

    .tail {
        white-space: nowrap;
        /* Make sure last word and icon will break ultimately */
        display: inline-flex;
        flex-wrap: wrap; 
    }

    button {
        @apply inline-block text-sm font-medium text-center disabled:cursor-not-allowed p-4 rounded-t-lg ; 
    }

    button.active {
        @apply inline-block text-sm font-medium text-center disabled:cursor-not-allowed p-4 text-primary-600 bg-gray-100 rounded-t-lg dark:bg-gray-800 dark:text-primary-500; 
    }
</style>


{#if page_project}
<Tabs class="relative">
    <TabItem open title="Overview">
        <div class="md:flex md:items-center space-y-4 flex flex-wrap">
            <img style="height:200px" src="{page_project.logo_url}" alt="logo">
            <p>{page_project.short_name}</p>
            <p>{page_project.long_name}</p>
            <p>{page_project.description}</p>

            <hr class="w-full">

            <Datatable {table}>
                {#snippet header()}
                    <div>
                        <button id="col-sel" class="link-btn" onclick={() => {showModal = true;}}>
                            <span class="tail">
                                <SvgColumns cclass="text-white dark:text-gray-800"/>&nbsp;Columns
                            </span>                            
                        </button>
                    </div>
                    <RowsPerPage {table} options={[5, 10, 20, 30, 50]}/>
                {/snippet}
                <table>
                    <thead>
                        <tr>
                            <Th>Short Name</Th>
                            <Th>Version</Th>
                            <Th>Long Name</Th>
                            <Th>Description</Th>
                            <Th>Samples Count</Th>
                        </tr>
                        <tr>
                            <ThFilter {table} field="short_name"/>
                            <ThFilter {table} field="version"/>
                            <ThFilter {table} field="long_name"/>
                            <ThFilter {table} field="description"/>
                            <ThFilter {table} field="samples_count"/>
                        </tr>
                    </thead>
                    <tbody>
                        {#each table.rows as row}
                        <tr onclick={() => {goto('/dataset/'+row.id + '_' + row.version)}}>
                            <td>{row.short_name}</td>
                            <td>{row.version}</td>
                            <td>{row.long_name}</td>
                            <td>{row.description}</td>
                            <td>{row.samples_count}</td>
                        </tr>
                        {/each}
                    </tbody>
                </table>
                {#snippet footer()}
                    <RowCount {table}/>
                    <Pagination {table}/>
                {/snippet}
            </Datatable>
            <Modal bind:showModal>
                {#snippet header()}
                    <h2>Select columns to display</h2>
                {/snippet}
                {#each view.columns as column}
                    <button type="button" 
                        class:active={column.isVisible}
                        onclick={() => column.toggle()}
                    >
                        {column.name}
                    </button>
                {/each}
            </Modal>
        </div>
    </TabItem>
    <div class="flex absolute right-0">
        {#if checkGroups(page_project!.perm_datasets!.write)}
            <TabItem title="+New Dataset">
                <h1>Create new Dataset in project: {page_project.short_name}</h1>
                <DatasetForm
                    onsubmit={(e: SubmitEvent) => (datasetCreate(
                            e, +page_project!.id!,
                            ds_read_selected, ds_write_selected, ds_download_selected
                    ))}
                    bind:read_selected={ds_read_selected}
                    bind:write_selected={ds_write_selected}
                    bind:download_selected={ds_download_selected}
                />
            </TabItem>
        {/if}
        {#if $isAuthenticated && $groups.includes("admin")}
            <TabItem title="Share">
                <ProjectForm
                    id="share_project_form"
                    isSharing={true}
                    bind:write_selected={pr_write_selected}
                    bind:download_selected={pr_download_selected}
                    onsubmit={() => projectShare(
                        page_project!, pr_write_selected, pr_download_selected
                    )}
                />
            </TabItem>
        {/if}
    </div>
    </Tabs>
{/if}
