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


export async function downloadFile(file: SrvFile){
    let response = await getFilesByIdByVersionDownload({
        path: {
            id: file.id!.toString(),
            version: file.version!.toString()
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
    })
    if (response.ok){ // comes with trailing quotes
        return response.headers.get('ETag')!.replaceAll('"', '');
    }
    throw new Error(response.statusText)
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
            id: dataset.id!.toString(),
            version: dataset.version!.toString()
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
    let elm = document.getElementById('overlay-spinner-modal')
    elm?.style.setProperty('display', 'flex');

    let response = await postFilesByIdByVersionVisualize({
        path: {
            id: file.id!.toString(),
            version: file.version!.toString()
        }
    })

    if (response.response.ok){
        const url = response.data!
        setTimeout(()=>{window.open((url as string), '_blank')?.focus()}, 5000)
    } else {
        throw new Error(response.response.statusText)
    }

    elm?.style.setProperty('display', 'none');
}
