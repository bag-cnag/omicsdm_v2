import { postProjects, type Project } from "client";
import { goto } from '$app/navigation';

import { fieldsToObject } from "$lib/form/fieldsToObject";
import { ajv, val } from '$lib/validate'
import { clearFormErrors, displayFormError  } from "$lib/form/messages";
import { extractProjectPermissions } from "$lib/form";


export function projectCreate(
    ev: SubmitEvent,
    download_selected: Array<string>,
    write_selected: Array<string>
){
    // clear errors
    clearFormErrors()

    // Build body
    let data: Partial<Project> = fieldsToObject(ev.target as HTMLFormElement)

    // Handle permissions
    data = extractProjectPermissions(data, write_selected, download_selected) 

    // Validate and submit
    let validate = val("Project", data)

    if(!validate)
        displayFormError(ajv.errorsText().toString(), (ev.target as HTMLFormElement)!.id);
    else {
        postProjects({body: (data as Project)}).then((response) => {
            if (response.response.ok){
                goto("/project/" + response.data!.id);
            }
            else if (response.response.status == 409) {
                displayFormError("A Project with this short_name already exists.");
            } else { 
                displayFormError((new Error(response.response.statusText)).toString());
            }
        })
    }
}
