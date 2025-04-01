<script lang="ts">
    import {
        getDatasetsByIdByVersion, getDatasets, postFiles,
        getProjectsById, postFilesByIdByVersionRelease, deleteFilesByIdByVersion,
        FileSchema, getFiles
    } from "client";
    import type { File as SrvFile, Dataset, Project, Error as SrvError } from "client"
    import { checkGroups, user } from "auth";

    import { mount, onMount, unmount } from 'svelte';
    import { get } from 'svelte/store';
    import { page } from "$app/state";

    import { Tabs, TabItem, Modal } from 'flowbite-svelte';
    import { 
        TableHandler, Datatable, Th, ThFilter,
        RowCount, RowsPerPage, Pagination, type State
    } from '@vincjo/datatables/server'
    import ThEnumFilter from "$lib/table/ThEnumFilter.svelte";

    import { SvgDownload, SvgUpload, SvgTrashBin, SvgEye } from "$lib/icons";
    import { DatasetForm, FileForm } from "$lib/form";
    import { clearFormErrors, displayFormError } from '$lib/form/messages'
    import { listGroupToListPaths, listGroupToPreSelection } from "$lib/form/helpers";
    import { groupsForMultiselect } from "$lib/remote/groups";
    import { chunkSize } from "$lib/config";
    import { ResumeCard, UploadCard }  from "$lib/ui";

    import { reload } from "./table";
    import Overview from "./Overview.svelte";
    import {
        uploadFile, downloadFile, datasetRelease,
        datasetShare, visualizeFile, extractAndValidateFile,
    } from "./submit"
    import { goto } from "$app/navigation";
    import DirectForm from "$lib/form/DirectForm.svelte";

    interface FileAndResumeCard extends SrvFile {
        card: ResumeCard
    };

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
    let failed_uploads = $state<Array<Partial<FileAndResumeCard>>>([]);
    let error = $state<string>();

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
                    id: page_dataset!.project_id
                },
                query: {
                    fields: ['id', 'perm_files', 'perm_datasets']
                }
            });
            if(pr_response.response.ok){
                page_project = pr_response.data;

                if (checkGroups(page_project!.perm_datasets?.write)){
                    // Pre Fill in data for sharing.
                    write_selected = listGroupToPreSelection(page_dataset!.perm_files?.write, all_groups);
                    download_selected = listGroupToPreSelection(page_dataset!.perm_self?.download, all_groups);
                    read_selected = listGroupToPreSelection(page_dataset!.perm_self?.read, all_groups);
                }
            }
            // Licence
            let li_res = await getFiles({
                query: {
                    dataset_id: [+page_dataset!.id!],
                    dataset_version: [+page_dataset!.version!],
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
            // Last Update
            let lu_res = await getFiles({
                query: {
                    dataset_id: [+page_dataset!.id!],
                    dataset_version: [+page_dataset!.version!],
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

            if (checkGroups(page_project!.perm_datasets?.write)
                && checkGroups(page_dataset!.perm_files?.write)){
                failed_uploads = await getFiles({
                    query: {
                        dataset_id: [+page_dataset!.id!],
                        dataset_version: [+page_dataset!.version!],
                        fields: ['id','version', 'filename', 'extension', 'size', 'upload'],
                        ready: false,
                        submitter_username: [get(user)]
                    }
                }).then((res) => res.response.ok ? res.data! : [])
            }
        } else if(response.response.status == 404) {
            goto('404');
        } else {
            error = (response.error as SrvError).message;
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

    // Initialize table
    const table = new TableHandler<SrvFile>([], { rowsPerPage: 5 })
    table.load((state: State) => reload(state, id, version))
    table.invalidate()
    let action_bar = $state<Element>();

    // This method stays here because it touches local context stuff (table, showFUPModal)
    async function uploadFormSubmit(ev: Event, reup?: SrvFile){
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

                try {
                    let completion = await uploadFile(
                        file,
                        response.data!.upload!.parts!,
                        response.data!.id!,
                        response.data!.version!,
                        up_card
                    );

                    if(completion.response.ok){
                        // Fade out card
                        setTimeout(() => {
                            unmount(up_card, { outro: true })
                        }, 5000)
                        // Refresh table
                        table.invalidate();
                        // If licence
                        if(body.type == "licence"){
                            licence = (response.data as SrvFile);
                        }
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
                } else if (response.error!.message.includes('uc_file_in_dataset')) {
                    displayFormError("One file with this name and version already exists.", form.id);
                } else {
                    displayFormError(response.error!.message, form.id);
                }
            }
        } catch(e) {
            console.error(e)
            displayFormError((e as Error).toString(), form.id);
        }
    }

    async function resumeUpload(ev: Event, failed_up: Partial<FileAndResumeCard>){
        const finput = (ev.target! as HTMLFormElement);
        const file = (finput.files as FileList)[0];
        failed_up.card!.error = "";

        if(file.size != failed_up.size!){
            failed_up.card!.error = "File size mismatch";
            return;
        }

        finput.style.setProperty('display', 'none');

        const completion = await uploadFile(
            file, failed_up.upload!.parts!, failed_up.id!, failed_up.version!, failed_up.card!
        )
        if(completion.response.ok){
            // remove element from array => triggers card deletion.
            setTimeout(() => {
                let idx = failed_uploads.findIndex(
                    u => (u.id === failed_up.id && u.version === failed_up.version)
                );
                if (idx !== -1) {
                    failed_uploads.splice(idx, 1);
                }
            }, 5000)
            // Refresh table
            table.invalidate();
        } else {
            finput.style.setProperty('display', 'block');
            failed_up.card!.error = completion.error!.message;
            console.error(completion.error!.message)
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

<style lang="postcss">
    .pricol {
        color: theme('colors.primary.500');
    }
</style>


{#if page_project && page_dataset} <!-- onMount succeded -->
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
                            <Th>Description</Th>
                            <Th>Name</Th>
                            <Th>Version</Th>
                            <Th>Submitter</Th>
                            <Th>Date</Th>
                            <Th>Type</Th>
                            <Th>Actions</Th>
                        </tr>
                        <tr>
                        <ThFilter {table} field="description"/>
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
                        {#each table.rows as row, i}
                        <tr>
                            <!-- {@debug table} -->
                            <!-- ^|v -->
                            <td>{row.description}</td>
                            <td>{row.filename}.{row.extension}</td>
                            <td>
                                {row.version}&nbsp;
                                <span class="pricol">
                                    {#if table.rows.filter((e)=>e.id == row.id && e.version! < row.version!).length == 0}
                                        ^
                                    {:else if table.rows.filter((e)=>e.id == row.id && e.version! > row.version!).length == 0}
                                        v
                                    {:else}
                                        |
                                    {/if}
                                </span>
                            </td>
                            <td>{row.submitter_username}</td>
                            <td>{row.validated_at}</td>
                            <td>{row.type}</td>
                            <td class="hiflex">
                                {#if checkGroups(page_project!.perm_datasets?.download)}
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
                                {#if row.is_latest
                                  && checkGroups(page_project!.perm_datasets?.write)
                                  && checkGroups(page_dataset!.perm_files?.write)}
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
        <div id="action-bar" bind:this={action_bar} class="border-2 mt-5 min-h-4 inline-flex overflow-x-visible">
            {#each failed_uploads as failed_up}
                {@const n = Math.ceil(failed_up.size! / chunkSize)}
                {@const progress = (failed_up.upload!.parts!.filter((v)=>v.etag).length / n)*100}
                <ResumeCard
                    bind:this={failed_up.card}
                    filename={failed_up.filename + "." + failed_up.extension}
                    progress={progress.toString()}
                    onchange={(e)=>resumeUpload(e, failed_up)}
                />
            {/each}
        </div>
    </TabItem>
    <div class="flex absolute right-0">
        {#if checkGroups(page_project!.perm_datasets?.write)}
            <TabItem title="Share">
                <DatasetForm
                    isSharing={true}
                    id="share_dataset_form"
                    btnText="Share"
                    dataset={page_dataset}
                    write_options={listGroupToListPaths(page_project!.perm_datasets?.write)}
                    download_options={listGroupToListPaths(page_project!.perm_datasets?.download)}
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
                            write_options={listGroupToListPaths(page_project!.perm_datasets?.write)}
                            download_options={listGroupToListPaths(page_project!.perm_datasets?.download)}
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
        {#if checkGroups(page_project!.perm_datasets?.write)
          && checkGroups(page_dataset!.perm_files?.write)}
            <li role="presentation">
                <button onclick={() => (showFUPModal = true)} type="button" role="tab" class="inline-block text-sm font-medium text-center disabled:cursor-not-allowed p-4 text-gray-500 rounded-t-lg hover:text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300">
                    + Upload
                </button>
            </li>
        {/if}
    </div>


    <Modal bind:open={showFUPModal} outsideclose>
        <h2>Upload A File</h2>
		<hr />
        <div id="modal_content" class="flex">
            <FileForm class="flex-col" id="file_upload_form" onsubmit={(e: Event) => uploadFormSubmit(e)}/>
            <!-- <DirectForm class="flex-col" onsubmit={(e: Event) => uploadFormSubmit(e)}/> -->
            <DirectForm
                fClass="border-2 border-solid p-2"
                orientation="horizontal"
                btnText="Send"
                entry="file"
            />
        </div>
    </Modal>

    <Modal bind:open={showFREUPModal} outsideclose>
        <h2>Upload A new Version for this File</h2>
		<hr />
        <div id="modal_content">
            <FileForm id="file_reupload_form" bind:reupFile={fileToREUP}
                onsubmit={(e: Event) => uploadFormSubmit(e, fileToREUP)}
            />
        </div>
    </Modal>
</Tabs>
{:else}
    <p class="error">{error}</p>
{/if}
