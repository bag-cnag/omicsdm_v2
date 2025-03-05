<script lang="ts">
    import { DatasetSchema as dsSchema, getProjectsById, type Dataset, type Project} from "client";
    import { checkGroups, isAuthenticated, groups } from "auth";

    import { page } from "$app/state";
    import { goto } from '$app/navigation';
    import { onMount } from "svelte";

    import { OpenAPIV3 } from "openapi-types"
    import { Tabs, TabItem } from 'flowbite-svelte';
    import { 
        TableHandler, Datatable, Th,
        ThFilter, RowCount, RowsPerPage, Pagination, type State
    } from '@vincjo/datatables/server'
    import ThEnumFilter from "$lib/table/ThEnumFilter.svelte";
    import { Modal } from "flowbite-svelte";

    import { DatasetForm, ProjectForm } from "$lib/form";

    import { horizontallyScrollable } from "$lib/ui/anim";
    import SvgColumns from "$lib/icons/SvgColumns.svelte";
    import { toTitle } from "$lib/types/str";
    import { datasetGet } from "$lib/types/client/Dataset";
    import { listGroupToListPaths, listGroupToPreSelection } from "$lib/form/helpers";
    import { groupsForMultiselect } from "$lib/remote/groups";
    import { schemaGetProp } from "$lib/types/client/Schema";
    import Form from "$lib/form/components/Form.svelte";

    import { reload } from "./table";
    import { datasetCreate, projectShare } from "./submit";


    // Local context
    const { id } = page.params;
    const table = new TableHandler<Dataset>([], { rowsPerPage: 10 })
    let page_project = $state.raw<Project>();
    let showModal = $state(false);
    let pr_write_selected: Array<string> = $state([]);
    let pr_download_selected: Array<string> = $state([]);
        
    let ds_read_selected: Array<string> = $state([])
    let ds_write_selected: Array<string> = $state([])
    let ds_download_selected: Array<string> = $state([])


    // https://github.com/vincjo/datatables/blob/main/src/routes/examples/server/pokedex-api/Main.svelte
    table.load((state: State) => reload(state, id));
    table.invalidate();

    onMount(async ()=>{
        let response = await getProjectsById({path: {id: +id}})
        if (response.response.ok){
            page_project = response.data!;

            if ($isAuthenticated && $groups.includes("admin")){
                // Fill in data for sharing
                const all_groups = await groupsForMultiselect();

                pr_write_selected = listGroupToPreSelection(page_project!.perm_datasets?.write, all_groups);
                pr_download_selected = listGroupToPreSelection(page_project!.perm_datasets?.download, all_groups);
            }
        } else {
            goto('/');
        }
    })

    const dataset_fields = [
        "short_name",
        "long_name",
        "version",
        "submission_date",
        "disease",
        "treatment",
        "molecular_info",
        "sample_type",
        "data_type",
        "value_type",
        "platform",
        "genome_assembly",
        "annotation",
        "samples_count",
        "features_count",
        "features_id",
        "healthy_controls_included",
        "additional_info",
    ];

    let view_input = [];
    let i = 0;
    for(const field of dataset_fields){
        view_input.push({index: i, name: toTitle(field)})
        i++;
    }
    const view = table.createView(view_input);
    const DatasetSchema = (dsSchema as unknown as OpenAPIV3.BaseSchemaObject);
</script>

<style lang="postcss">
    tr {
        cursor: pointer;
    }

    .col-btn {
        @apply inline-block text-sm font-medium text-center disabled:cursor-not-allowed p-4 rounded-t-lg ; 
    }

    .col-btn.active {
        @apply inline-block text-sm font-medium text-center disabled:cursor-not-allowed p-4 text-primary-600 bg-gray-100 rounded-t-lg dark:bg-gray-800 dark:text-primary-500; 
    }
</style>


{#if page_project}
<Tabs class="relative">
    <TabItem open title="Overview">
        <div class="md:flex md:items-center space-y-4 flex flex-wrap">
            <img style="height:200px" src="{page_project.logo_url}" alt="logo">
            <div class="ml-4">
                <p>{page_project.short_name}</p><br/>
                <p>{page_project.long_name}</p><br/>
                <p>{page_project.description}</p><br/>
            </div>
            <hr class="w-full">
            <div id="dt-container" class="overflow-x-hidden overflow-y-hidden"
                 use:horizontallyScrollable
            >
            <Datatable {table}>
                {#snippet header()}
                    <div >
                        <button id="col-sel" class="pri-btn" onclick={() => {showModal = true;}}>
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
                            {#each dataset_fields as field}
                                <Th>{toTitle(field)}</Th>
                            {/each}
                        </tr>
                        <tr>
                            {#each dataset_fields as field}
                                {#if schemaGetProp((DatasetSchema), field)?.type == 'boolean'}
                                    <ThEnumFilter {table} field={field as keyof Dataset}
                                        options={["true", "false"]}/>
                                {:else if schemaGetProp((DatasetSchema), field)?.enum}
                                    <ThEnumFilter {table} field={field as keyof Dataset} 
                                        options={(schemaGetProp((DatasetSchema), field)!.enum as string[])}/>
                                {:else}
                                    <ThFilter {table} field={field as keyof Dataset}/>
                                {/if}
                            {/each}
                        </tr>
                    </thead>
                    <tbody>
                        {#each table.rows as row}
                        <tr onclick={() => {goto('/dataset/'+row.id + '_' + row.version)}}>
                            {#each dataset_fields as field}
                                <td style={schemaGetProp((DatasetSchema), field)?.format == 'date' ? "white-space: nowrap;" : null}>
                                    {datasetGet(row, field)}
                                </td>
                            {/each}
                        </tr>
                        {/each}
                    </tbody>
                </table>
                {#snippet footer()}
                    <RowCount {table}/>
                    <Pagination {table}/>
                {/snippet}
            </Datatable>
            </div>

            <Modal bind:open={showModal} outsideclose>
                <h2>Select columns to display</h2>
                <hr />
                {#each view.columns as column}
                    <button type="button"
                        class="col-btn"
                        class:active={column.isVisible}
                        onclick={() => column.toggle!()}
                    >
                        {column.name}
                    </button>
                {/each}
            </Modal>
        </div>
    </TabItem>
    <div class="flex absolute right-0">
        {#if checkGroups(page_project!.perm_datasets?.write)}
            <TabItem title="+New Dataset">
                <h1>Create new Dataset in project: {page_project.short_name}</h1>
                <div class="flex flex-row">
                    <DatasetForm
                        onsubmit={(e) => (datasetCreate(
                                e, +page_project!.id!,
                                ds_read_selected, ds_write_selected, ds_download_selected
                        ))}
                        write_options={listGroupToListPaths(page_project!.perm_datasets?.write)}
                        download_options={listGroupToListPaths(page_project!.perm_datasets?.download)}
                        bind:read_selected={ds_read_selected}
                        bind:write_selected={ds_write_selected}
                        bind:download_selected={ds_download_selected}
                    />
                    <div class="w-1/5 mt-4">
                        <Form btnText="Send" class="border-2 border-solid p-2">
                            Or - Create from:
                            <select id="format" name="format" onchange={()=>{}}>
                                <option value="tsv">TSV</option>
                                <option value="json">JSON</option>
                            </select>
                            <button id="dl_template_btn" class="m-2 mr-8 ml-8 pri-btn">template</button>
                            <input type="file" id="ds_metadata_file" name="ds_metadata_file">
                        </Form>
                    </div>
                </div>
            </TabItem>
        {/if}
        {#if $isAuthenticated && $groups.includes("admin")}
            <TabItem title="Share">
                <ProjectForm
                    id="share_project_form"
                    btnText="Share"
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
