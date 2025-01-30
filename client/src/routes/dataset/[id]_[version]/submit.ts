import { goto } from "$app/navigation";
import { extractDatasetPermissions, fieldsToObject } from "$lib/form";
import { clearFormErrors, displayFormError, displayFormSuccess } from "$lib/form/messages";
import { 
    getFilesByIdByVersionDownload,
    postDatasets,
    postDatasetsByIdByVersionRelease,
    postFilesByIdByVersionVisualize
} from "client";
import type { Dataset, File as SrvFile} from "client";
import { ajv, val } from '$lib/validate'
import { mount } from "svelte";
import VisualizationCard from "$lib/ui/VisualizationCard.svelte";


export function extractAndValidateFile(
    formdata: FormData, id: string, version: string
): SrvFile {
    const file = (formdata.get('file') as File);
    let [ name, ext ] = (formdata.get('filename')! as string).split('.');
    const body = {
        filename: name,
        extension: ext,
        type: (formdata.get('filetype')! as string),
        size: file.size,
        comment: (formdata.get('comment')! as string),
        dataset_id: +id,
        dataset_version: +version,
    }

    // Validate
    let validate = val("File", body)
    if(!validate){
        throw new Error(ajv.errorsText().toString())
    }
    return (body as SrvFile);
}


export async function downloadFile(file: SrvFile | Partial<SrvFile>){
    let response = await getFilesByIdByVersionDownload({
        path: {
            id: file.id!,
            version: file.version!
        }
    })
    if (response.response.ok){
        const downloadLink = document.createElement('a')
        downloadLink.href = response.data!
        downloadLink.download = ""
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink)
    } else {
        throw new Error(response.response.statusText)
    }
}


export async function uploadChunk(chunk: Blob, url: string){
    let response = await fetch(url, {
        method: 'PUT',
        body: chunk,
        headers: {'Content-Encoding': 'gzip'}
    }).then( res => {
        if(!res.ok){
            return res.text().then(text => {
                throw new Error(text)
            })
        } else {
            return res;
        }
    })

    if (response.ok){ // comes with trailing quotes
        return response.headers.get('ETag')!.replaceAll('"', '');
    }
}


export async function datasetRelease(
    ev: SubmitEvent,
    dataset: Dataset,
    read_selected: Array<string>,
    write_selected: Array<string>,
    download_selected: Array<string>
){
    // Reset
    clearFormErrors();
    // Build body
    let data: Partial<Dataset> = fieldsToObject(ev.target as HTMLFormElement)
    // Get permissions
    data = extractDatasetPermissions(data, read_selected, write_selected, download_selected)
    // Cast boolean
    data['healthy_controls_included'] = (
        data['healthy_controls_included'] ? true : false
    )

    // TODO: only send the diff
    let response = await postDatasetsByIdByVersionRelease({
        path: {
            id: dataset.id!,
            version: dataset.version!
        },
        body: (data as Dataset)
    })
    if (response.response.ok){
        // Pass through the root first to reload
        goto('/').then(
            () => goto("/dataset/" + response.data!.id + "_" + response.data!.version)
        );
    } else {
        let e = new Error(response.response.statusText)
        console.error(e)
        displayFormError("Server error: "+ e.toString(), "release_dataset_form")
    }
}


export async function datasetShare(
    dataset: Dataset,
    read_selected: Array<string>,
    write_selected: Array<string>,
    download_selected: Array<string>
){
    clearFormErrors();

    // Build body
    let data: Partial<Dataset> = {
        id: dataset.id,
        version: dataset.version
    }
    data = extractDatasetPermissions(data, read_selected, write_selected, download_selected)

    let response = await postDatasets({body: (data as Dataset)})
    if (response.response.ok){
        displayFormSuccess('ok', 'share_dataset_form')
    } else {
        let e = new Error(response.response.statusText)
        console.error(e)
        displayFormError("Server error: "+ e.toString(), "share_dataset_form")
    }
}


export async function visualizeFile(file: SrvFile){
    // UI.
    const action_bar = document.getElementById('action-bar');
    let vis_card = mount(VisualizationCard, {
        target: action_bar!,
        props: {
            id: "visualize-" + file.id,
            class: "action-card w-fit",
            filename: file.filename + "." + file.extension,
            url: ""
        },
    })

    let response = await postFilesByIdByVersionVisualize({
        path: {
            id: file.id!,
            version: file.version!
        }
    })

    if (response.response.ok){
        const url = response.data!
        vis_card.url = url;
        setTimeout(()=>{window.open((url as string), '_blank')?.focus()}, 5000)
    } else {
        console.error(response.error?.message)
        vis_card.error = response.error?.message;
    }
}
