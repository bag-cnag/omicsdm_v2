<script lang="ts">
    import {
        getDatasetsByIdByVersion, getDatasets, postFiles,
        putFilesByIdByVersionComplete, getProjectsById,
        postFilesByIdByVersionRelease, deleteFilesByIdByVersion
    } from "client";
    import type { PartsEtag, File as srvFile, Dataset, Project } from "client"

    import { onMount } from 'svelte';
    import { page } from "$app/stores";

    import { Tabs, TabItem, Spinner } from 'flowbite-svelte';
    import { TableHandler, Datatable, Th, ThFilter, RowCount, RowsPerPage, Pagination, type State } from '@vincjo/datatables/server'

    import { checkGroups } from "auth";
    import Modal from "$lib/ui/Modal.svelte";
    import { SvgDownload, SvgUpload } from "$lib/icons";
    import { DatasetForm, FileForm } from "$lib/form";
    import { clearFormErrors, displayFormError } from '$lib/form/messages'

    import { reload } from "./table";
    import Overview from "./Overview.svelte";
    import { uploadChunk, downloadFile, datasetRelease, datasetShare, visualizeFile } from "./submit"
    import SvgTrashBin from "$lib/icons/SvgTrashBin.svelte";
    import SvgEye from "$lib/icons/SvgEye.svelte";

    // Local context
    const { id, version } = $page.params;
    let showFUPModal = $state(false);
    let showFREUPModal = $state(false);
    let fileToREUP = $state<srvFile>()

    let page_dataset = $state.raw<Dataset>();
    let page_project = $state.raw<Project>();
    let update_datset = $state.raw<Dataset>();

    let prev_version = $state.raw<Dataset>()
    let next_version = $state.raw<Dataset>()

    let read_selected: Array<string> = $state([])
    let write_selected: Array<string> = $state([])
    let download_selected: Array<string> = $state([])


    onMount(async ()=>{
        let response = await getDatasetsByIdByVersion({
            path: {
                id: id,
                version: version
            }
        })
        if (response.response.ok){
            page_dataset = response.data!
            // Fill in data
            if(page_dataset.perm_files && page_dataset.perm_files.write){
                for(const one of page_dataset.perm_files.write.groups!){
                    write_selected.push(one.path!)
                }
            }
            if(page_dataset.perm_self && page_dataset.perm_self.download){
                for(const one of page_dataset.perm_self.download.groups!){
                    download_selected.push(one.path!)
                }
            }
            if(page_dataset.perm_self && page_dataset.perm_self.read){
                for(const one of page_dataset.perm_self.read.groups!){
                    read_selected.push(one.path!)
                }
            }

            let pr_response = await getProjectsById({
                path: {
                    id: page_dataset.project_id.toString()
                }
            });
            if(pr_response.response.ok){
                page_project = pr_response.data;
            }
        }

        // fetch adjacent versions
        let qs_version = ((+version) +1).toString()
        if (+version > 1){
            qs_version += ","+((+version) -1).toString()
        }

        let adjacents = await getDatasets({
            query: {
                id: +id,
                version: qs_version,
                fields: "id,version"
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
    const table = new TableHandler<srvFile>([], { rowsPerPage: 10 })
    table.load((state: State) => reload(state, id, version))
    table.invalidate()

    // This method stays here because it touches local context stuff (table, showFUPModal)
    async function uploadFormSubmit(ev: SubmitEvent, reup?: srvFile){
        clearFormErrors();

        const form = (ev.target! as HTMLFormElement).elements;
        const file: File = form['file'].files[0];
        let [ name, ext ] = form['filename'].value.split('.');

        try {
            let response
            const body = {
                filename: name,
                extension: ext,
                type: form['filetype'].value,
                size: file.size,
                comment: form['comment'].value,
                dataset_id: +id,
                dataset_version: +version,
            }

            if (!reup){
                response = await postFiles({body: body})
            } else {
                response = await postFilesByIdByVersionRelease({
                    path: {
                        id: reup.id!.toString(),
                        version: reup.version!.toString()
                    },
                    body: body
                })
            }

            if (response.response.ok){
                document.getElementById("loading_spinner")!.style.display = "block"

                let head = 0
                let parts_etags: Array<PartsEtag> = []

                for (const part of response.data!.upload!.parts!){
                    const etag = await uploadChunk(file.slice(head, head + chunkSize), part.form!)
                    parts_etags.push({'PartNumber': part.part_number, 'ETag': etag})
                    head += chunkSize
                }

                let completion = await putFilesByIdByVersionComplete({
                    path: {
                        id: response.data!.id!.toString(),
                        version: response.data!.version!.toString()
                    },
                    body: parts_etags
                })
                if(completion.response.ok){
                    // Reset form
                    (ev.target! as HTMLFormElement).reset()
                    showFUPModal = false
                    // Manually close modal, as sveltekit is not doing it for us. 
                    Array.from(document.getElementsByClassName('modal')).forEach(e => {
                        (e as HTMLDialogElement).close()
                    });
                    // Reset modal
                    document.getElementById("loading_spinner")!.style.display = "none"
                    // Refresh table data
                    table.invalidate()
                } else {
                    throw new Error(completion.response.statusText)
                }
            } else {
                if(response.error.message.includes('already been released')){
                    displayFormError("Re-Uploading a File is only allowed on latest version.", ev.target!.id);
                } else {
                    displayFormError("One file with this name and version already exists.", ev.target!.id);
                }
            }
        } catch(e) {
            console.error(e)
            displayFormError("Server error: "+ (e as Error).toString(), ev.target!.id)
        }
    }

    async function deleteFile(row: srvFile){
        let response = await deleteFilesByIdByVersion({
            path: {
                id: row.id!.toString(),
                version: row.version!.toString()
            }
        })

        if (response.response.ok){
            // Refresh table data
            table.invalidate()
        } else {
            let e = new Error(response.response.statusText)
            console.error(e)
        }
    }
</script>

<style>
    td a.fileaction {
        cursor: pointer;
        margin: 5px;
    }
    #loading_spinner {
        display: none;
    }
    #overlay-spinner-modal {
        position:fixed;
        background-color: grey;
        top:0;
        left:0;
        opacity: 60%;
        z-index:1050;
        display:none;
        width:100%;
        height:100%;
        overflow:hidden;
        outline:0;
        @apply justify-center items-center;
    }
</style>

{#if page_project} <!-- onMount succeded -->
<div id="overlay-spinner-modal"><Spinner size={32}/></div>

<Tabs class="relative">
    <TabItem open title="Overview">
        <Overview dataset={page_dataset}/>
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
                        <!-- <tr>
                        <ThFilter {table} field="short_name"/>
                        <ThFilter {table} field="long_name"/>
                        <ThFilter {table} field="description"/>
                        <ThFilter {table} field="samples_count"/>
                        </tr> -->
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
                                    <a title="Download" href={'#'} class="fileaction fdl" onclick={() => {downloadFile(row)}}>
                                        <SvgDownload />
                                    </a>
                                {/if}
                                {#if row.extension == 'h5ad'}
                                    <a title="Visualize" href={'#'} class="fileaction fvis" onclick={() => {visualizeFile(row)}}>
                                        <SvgEye />
                                    </a>
                                {/if}
                                {#if checkGroups(page_dataset!.perm_files!.write)}
                                    <a title="Re-Upload" href={'#'} class="fileaction fup" onclick={() => {
                                            fileToREUP = row;
                                            showFREUPModal = true;
                                        }}
                                    >
                                        <SvgUpload />
                                    </a>
                                    <a title="Delete" href={'#'} class="fileaction fdel" onclick={() => {deleteFile(row)}}>
                                        <SvgTrashBin />
                                    </a>
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
    </TabItem>
    <div class="flex absolute right-0">
        {#if checkGroups(page_project!.perm_datasets!.write)}
            <TabItem title="Share">
                <DatasetForm
                    isSharing={true}
                    id="share_dataset_form"
                    btnText="Share"
                    dataset={page_dataset}
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
                            bind:read_selected
                            bind:write_selected
                            bind:download_selected
                            onsubmit={(e: SubmitEvent) => (
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
        <div id="loading_spinner" class='text-center top-1/2 absolute inset-0 flex justify-center items-center z-10'>
            <Spinner size={32}/>
        </div>
    </Modal>
    <Modal bind:showModal={showFREUPModal}>
        {#snippet header()}
            <h2>Re-Upload A File</h2>
        {/snippet}
        <div id="modal_content">
            <FileForm id="file_reupload_form" bind:reupFile={fileToREUP} onsubmit={(e: SubmitEvent) => uploadFormSubmit(e, fileToREUP)}/>
        </div>
        <div id="loading_spinner" class='text-center top-1/2 absolute inset-0 flex justify-center items-center z-10'>
            <Spinner size={32}/>
        </div>
    </Modal>
</Tabs>
{/if}
