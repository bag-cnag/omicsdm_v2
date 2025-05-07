import { goto } from "$app/navigation";
import { base } from "$app/paths";
import { mount } from "svelte";
import { get } from "svelte/store";


import { extractDatasetPermissions, fieldsToObject } from "$lib/form";
import { clearFormErrors, displayFormError, displayFormSuccess } from "$lib/form/messages";
import { 
    getFilesByIdByVersionDownload,
    postDatasets,
    postDatasetsByIdByVersionRelease,
    postFilesByIdByVersionVisualize,
    putFilesByIdByVersionComplete
} from "client";
import type { Dataset, File as SrvFile, UploadPart, Error as SrvError} from "client";

import { ajv, val } from '$lib/validate'
import VisualizationCard from "$lib/ui/VisualizationCard.svelte";
import UploadCard from "$lib/ui/UploadCard.svelte";
import { retry } from "$lib/js/retry"
import { triggerDownload } from "$lib/js/utils";


import config from 'config';


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
        description: (formdata.get('description')! as string),
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
        triggerDownload(response.data!)
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


export async function uploadFile(
    file: File,
    parts: Array<UploadPart>,
    id: number,
    version: number,
    status_card?: UploadCard
){
    let i = 0;
    let n = parts.length;
    let progress = 0;
    let chunks = []
    let head = 0;
    let parts_etags = [];

    // Prepare chunks.
    for (const part of parts){
        if(!part.etag){
            chunks.push(
                {
                    "chunk": file.slice(head, head + get(config).chunkSize),
                    "form": part.form!,
                    "num": part.part_number!
                }
            )
        } else {
            progress++;
            parts_etags.push({'PartNumber': part.part_number!, 'ETag': part.etag!})
        }
        head += get(config).chunkSize;
        i++;
    }

    // Prepare upload promises.
    const promises = chunks.map(async (one) => {
        // Declare function call
        const fn = () => uploadChunk(one.chunk, one.form)
        // setup retries
        const etag = await retry(fn, get(config).retries);
        return {'PartNumber': one.num, 'ETag': etag!}
    })

    if(status_card){
        // Display progress, tying a promise on each uploadChunk call.
        promises.forEach(p => p.then(() => {
            progress++;
            status_card.progress = (progress/n*100).toString()
        }));
    }

    // Execute and merge.
    parts_etags = parts_etags.concat(
        await Promise.all(promises)
    ).sort((a, b) => a.PartNumber-b.PartNumber);

    // Send completion notice.
    return putFilesByIdByVersionComplete({
        path: {
            id: id,
            version: version
        },
        body: parts_etags
    })
}


export async function datasetRelease(
    ev: Event,
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
        goto(base + "/dataset/" + response.data!.id + "_" + response.data!.version).then(
            () => window.location.reload() // Force refresh.
        )
    } else {
        let e = new Error(response.error?.message)
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
        let e = new Error((response.error! as SrvError).message)
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
            id: "visualize-" + file.id?.toString(),
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
