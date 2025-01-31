<script lang="ts">
    import {
        getDatasetsByIdByVersion, getDatasets, postFiles,
        putFilesByIdByVersionComplete, getProjectsById,
        postFilesByIdByVersionRelease, deleteFilesByIdByVersion,
        FileSchema, getFiles
    } from "client";
    import type { PartsEtag, File as SrvFile, Dataset, Project } from "client"

    import { mount, onMount, unmount} from 'svelte';
    import { page } from "$app/state";

    import { Tabs, TabItem } from 'flowbite-svelte';
    import { 
        TableHandler, Datatable, Th, ThFilter,
        RowCount, RowsPerPage, Pagination, type State
    } from '@vincjo/datatables/server'
    import ThEnumFilter from "$lib/table/ThEnumFilter.svelte";


    import { checkGroups } from "auth";
    import Modal from "$lib/ui/Modal.svelte";
    import { SvgDownload, SvgUpload, SvgTrashBin, SvgEye } from "$lib/icons";
    import { DatasetForm, FileForm } from "$lib/form";
    import { clearFormErrors, displayFormError } from '$lib/form/messages'

    import { reload } from "./table";
    import Overview from "./Overview.svelte";
    import {
        uploadChunk, downloadFile, datasetRelease,
        datasetShare, visualizeFile, extractAndValidateFile
    } from "./submit"
    import UploadCard from "$lib/ui/UploadCard.svelte";
    import { listGroupToListPaths, listGroupToPreSelection } from "$lib/form/helpers";
    import { groupsForMultiselect } from "$lib/remote/groups";

    // Local context
    const { id, version } = page.params;
    let showFUPModal = $state(false);
    let showFREUPModal = $state(false);
    let fileToREUP = $state<SrvFile>()

    let page_dataset = $state.raw<Dataset>();
    let page_project = $state.raw<Project>();
    let update_datset = $state.raw<Dataset>();
    let licence = $state<Partial<SrvFile>>();
    let last_upload = $state<Partial<SrvFile>>();

    let prev_version = $state.raw<Dataset>()
    let next_version = $state.raw<Dataset>()

    let read_selected: Array<string> = $state([])
    let write_selected: Array<string> = $state([])
    let download_selected: Array<string> = $state([])


    onMount(async ()=>{
        let all_groups = await groupsForMultiselect();
        let response = await getDatasetsByIdByVersion({
            path: {
                id: id,
                version: version
            }
        })
        if (response.response.ok){
            page_dataset = response.data!

            let pr_response = await getProjectsById({
                path: {
                    id: page_dataset.project_id
                }
            });
            if(pr_response.response.ok){
                page_project = pr_response.data;

                if (checkGroups(page_project!.perm_datasets!.write)){
                    // Pre Fill in data for sharing.
                    write_selected = listGroupToPreSelection(page_dataset.perm_files?.write, all_groups);
                    download_selected = listGroupToPreSelection(page_dataset.perm_self?.download, all_groups);
                    read_selected = listGroupToPreSelection(page_dataset.perm_self?.read, all_groups);
                }
            }

            let li_res = await getFiles({
                query: {
                    dataset_id: [+page_dataset.id!],
                    dataset_version: [+page_dataset.version!],
                    fields: ['id','version'],
                    type: ['licence'],
                    q: 'validated_at.max_a()'
                }
            })
            if (li_res.response.ok){
                if(li_res.data?.length){
                    licence = (li_res.data![0] as SrvFile)
                }
            }

            let lu_res = await getFiles({
                query: {
                    dataset_id: [+page_dataset.id!],
                    dataset_version: [+page_dataset.version!],
                    fields: ['validated_at'],
                    type: ['molecular', 'clinical'],
                    q: 'validated_at.max_a()'
                }
            })
            if (lu_res.response.ok){
                if(lu_res.data?.length){
                    last_upload = (lu_res.data![0] as Partial<SrvFile>)
                }
            }
        }

        // fetch adjacent versions
        let adjacents = await getDatasets({
            query: {
                id: [+id],
                version: [+version-1, +version+1],
                fields: ["id","version"]
            }
        })
        if (adjacents.response.ok){
            for(const one of adjacents.data!){
                if(one.version == (page_dataset!.version!-1))
                    prev_version = one
                if(one.version == (page_dataset!.version!+1))
                    next_version = one
            }
        }
    })

    const chunkSize = 100*1024 * 1024; // size of each chunk (100MB)

    // Initialize table
    const table = new TableHandler<SrvFile>([], { rowsPerPage: 5 })
    table.load((state: State) => reload(state, id, version))
    table.invalidate()
    let action_bar = $state<Element>();

    // This method stays here because it touches local context stuff (table, showFUPModal)
    async function uploadFormSubmit(ev: SubmitEvent, reup?: SrvFile){
        clearFormErrors();
        const form = (ev.target! as HTMLFormElement);
        const formdata = new FormData(form);

        try {
            const file = (formdata.get('file') as File);
            const body = extractAndValidateFile(formdata, id, version);
            let response;

            if (!reup){
                response = await postFiles({body: body})
            } else {
                response = await postFilesByIdByVersionRelease({
                    path: {
                        id: reup.id!,
                        version: reup.version!
                    },
                    body: body
                })
            }

            // https://github.com/sveltejs/svelte/discussions/15105

            if (response.response.ok){
                // Status card.
                let up_card = mount(UploadCard, {
                    target: action_bar!,
                    props: {
                        id: "upload" + response.data!.id,
                        class: "action-card w-fit",
                        reup: reup ? true : false,
                        filename: response.data!.filename + "." + response.data!.extension,
                        progress: "0"
                    },
                })

                // Reset form
                form.reset();
                // Manually close modal, as sveltekit is not reliably doing it for us. 
                showFUPModal = false;
                showFREUPModal = false;
                Array.from(document.getElementsByClassName('modal')).forEach(e => {
                    (e as HTMLDialogElement).close();
                });

                // Upload file
                let head = 0;
                let parts_etags: Array<PartsEtag> = [];

                //Progress
                let i = 0;
                let n = response.data!.upload!.parts!.length;

                try {
                    for (const part of response.data!.upload!.parts!){
                        const etag = await uploadChunk(
                            file.slice(head, head + chunkSize),
                            part.form!
                        );
                        parts_etags.push({'PartNumber': part.part_number, 'ETag': etag});
                        head += chunkSize;
                        i++;
                        up_card.progress = ((i/n)*100).toString();
                    }

                    let completion = await putFilesByIdByVersionComplete({
                        path: {
                            id: response.data!.id!,
                            version: response.data!.version!
                        },
                        body: parts_etags
                    })

                    if(completion.response.ok){
                        // Fade out card
                        setInterval(() => {
                            unmount(up_card, { outro: true })
                        }, 5000)
                        // Refresh table
                        table.invalidate();
                    } else {
                        let e = new Error(completion.error!.message);
                        up_card.error = e.message;                    
                        console.error(e);
                    }
                } catch(e){
                    console.error(e);
                    up_card.error = (e as Error).message;
                }
            } else {
                if(response.error!.message.includes('already been released')){
                    displayFormError("Re-Uploading a File is only allowed on latest version.", form.id);
                } else {
                    displayFormError("One file with this name and version already exists.", form.id);
                }
            }
        } catch(e) {
            console.error(e)
            displayFormError((e as Error).toString(), form.id);
        }
    }

    async function deleteFile(row: SrvFile){
        let response = await deleteFilesByIdByVersion({
            path: {
                id: row.id!,
                version: row.version!
            }
        })

        if (response.response.ok){
            // Refresh table data
            table.invalidate()
        } else {
            console.error(response.error!.message)
        }
    }
</script>


{#if page_project && page_dataset} <!-- onMount succeded -->
<!-- <div id="overlay-spinner-modal"><Spinner size={32}/></div> -->
<Tabs class="relative">
    <TabItem open title="Overview">
        <Overview 
            dataset={page_dataset!}
            project={page_project}
            licence={licence}
            last_upload={last_upload}
            prev={prev_version}
            next={next_version}
        />
    </TabItem>
    <TabItem title="Files">
        <div class="text-sm text-gray-500 dark:text-gray-400">
            <Datatable {table}>
                {#snippet header()}
                    <div></div>
                    <RowsPerPage {table} options={[5, 10, 20, 30, 50]}/>
                {/snippet}
                <table>
                    <thead>
                        <tr>
                            <Th>Name</Th>
                            <Th>Version</Th>
                            <Th>Submitter</Th>
                            <Th>Date</Th>
                            <Th>Comment</Th>
                            <Th>Type</Th>
                            <Th>Actions</Th>
                        </tr>
                        <tr>
                        <th></th>
                        <ThFilter {table} field="version"/>
                        <th></th>
                        <th></th>
                        <th></th>
                        <ThEnumFilter {table} field="type"
                            options={
                                Array.from(FileSchema.properties.type.enum).filter(
                                    item => item != 'licence'
                                )
                            }
                        />
                        </tr>
                    </thead>
                    <tbody>
                        {#each table.rows as row}
                        <tr>
                            <td>{row.filename}.{row.extension}</td>
                            <td>{row.version}</td>
                            <td>{row.submitter_username}</td>
                            <td>{row.validated_at}</td>
                            <td>{row.comment}</td>
                            <td>{row.type}</td>
                            <td class="hiflex">
                                {#if checkGroups(page_project!.perm_datasets!.download)}
                                    <button type="button" title="Download" class="faction"
                                        onclick={() => {downloadFile(row)}}
                                    >
                                        <SvgDownload />
                                    </button>
                                {/if}
                                {#if row.extension == 'h5ad'}
                                    <button type="button" title="Visualize" class="faction"
                                        onclick={() => {visualizeFile(row)}}
                                    >
                                        <SvgEye />
                                    </button>
                                {/if}
                                {#if checkGroups(page_dataset!.perm_files!.write)}
                                    <button type="button" title="Re-Upload" class="faction"
                                        onclick={() => {
                                            fileToREUP = row;
                                            showFREUPModal = true;
                                        }}
                                    >
                                        <SvgUpload />
                                    </button>

                                    <button type="button" title="Delete" class="faction"
                                        onclick={() => {deleteFile(row)}}
                                    >
                                        <SvgTrashBin />
                                    </button>
                                {/if}
                            </td>
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
        <div id="action-bar" bind:this={action_bar} class="border-2 mt-5 min-h-4 inline-flex"></div>
    </TabItem>
    <div class="flex absolute right-0">
        {#if checkGroups(page_project!.perm_datasets!.write)}
            <TabItem title="Share">
                <DatasetForm
                    isSharing={true}
                    id="share_dataset_form"
                    btnText="Share"
                    dataset={page_dataset}
                    write_options={listGroupToListPaths(page_project!.perm_datasets!.write)}
                    download_options={listGroupToListPaths(page_project!.perm_datasets!.download)}
                    bind:read_selected
                    bind:write_selected
                    bind:download_selected
                    onsubmit={() => (
                        datasetShare(page_dataset!, read_selected, write_selected, download_selected)
                    )}
                />
            </TabItem>
            {#if !next_version}
                <TabItem onclick={()=>{if(update_datset){page_dataset=update_datset;}}} title="Release">
                    {#key update_datset}
                        <DatasetForm
                            isSharing={false}
                            id="release_dataset_form"
                            btnText="Release"
                            dataset={page_dataset}
                            write_options={listGroupToListPaths(page_project!.perm_datasets!.write)}
                            download_options={listGroupToListPaths(page_project!.perm_datasets!.download)}
                            bind:read_selected
                            bind:write_selected
                            bind:download_selected
                            onsubmit={(e) => (
                                datasetRelease(e, page_dataset!, read_selected, write_selected, download_selected)
                            )}
                        />
                    {/key}
                </TabItem>
            {/if}
        {/if}
        {#if checkGroups(page_dataset!.perm_files!.write)}
            <li role="presentation">
                <button onclick={() => (showFUPModal = true)} type="button" role="tab" class="inline-block text-sm font-medium text-center disabled:cursor-not-allowed p-4 text-gray-500 rounded-t-lg hover:text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300">
                    + Upload
                </button>
            </li>
        {/if}
    </div>

    <Modal bind:showModal={showFUPModal}>
        {#snippet header()}
            <h2>Upload A File</h2>
        {/snippet}
        <div id="modal_content">
            <FileForm id="file_upload_form" onsubmit={(e: SubmitEvent) => uploadFormSubmit(e)}/>
        </div>
    </Modal>
    <Modal bind:showModal={showFREUPModal}>
        {#snippet header()}
            <h2>Upload A new Version for this File</h2>
        {/snippet}
        <div id="modal_content">
            <FileForm id="file_reupload_form" bind:reupFile={fileToREUP}
                onsubmit={(e: SubmitEvent) => uploadFormSubmit(e, fileToREUP)}
            />
        </div>
    </Modal>
</Tabs>
{/if}
