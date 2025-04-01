import { postDatasets, postProjects } from "client";
import type { Project, Dataset, Error as SrvError} from "client";
import { goto } from '$app/navigation';
import { ajv, val } from '$lib/validate'

import { fieldsToObject } from "$lib/form/fieldsToObject";
import { clearFormErrors, displayFormError, displayFormSuccess } from "$lib/form/messages";
import { extractDatasetPermissions, extractProjectPermissions } from "$lib/form";


export async function projectShare(
    project: Project,
    write_selected: Array<string>,
    download_selected: Array<string>
){
    clearFormErrors();

    // Build body
    let data: Partial<Project> = {
        id: project.id,
    }

    data = extractProjectPermissions(data, write_selected, download_selected) 

    let response = await postProjects({body: (data as Project)})
    if (response.response.ok){
        displayFormSuccess('ok', 'share_project_form')
    } else {
        let e = new Error(response.response.statusText)
        console.error(e)
        displayFormError("Server error: "+ e.toString(), 'share_project_form')
    }
}


export function datasetCreate(
    ev: Event,
    project_id: number,
    read_selected: Array<string>,
    write_selected: Array<string>,
    download_selected: Array<string>,
){
    clearFormErrors();

    // Build body
    let data: Partial<Dataset> = fieldsToObject(ev.target as HTMLFormElement)
    data = extractDatasetPermissions(data, read_selected, write_selected, download_selected)
    data['project_id'] = project_id

    // Cast boolean:
    data['healthy_controls_included'] = (
        data['healthy_controls_included'] ? true : false
    )

    // Validate and submit
    let validate = val("Dataset", data)
    if(!validate)
        displayFormError(ajv.errorsText().toString())
    else {
        postDatasets({body: (data as Dataset)}).then((response) => {
            if (response.response.ok)
                goto("/dataset/" + response.data!.id + "_" + response.data!.version)
            else {
                let e = new Error((response.error! as SrvError).message)
                console.error(e)
                displayFormError("Server error: "+ e.toString(), (ev.target as HTMLFormElement)!.id)
            }
        })
    }
}
