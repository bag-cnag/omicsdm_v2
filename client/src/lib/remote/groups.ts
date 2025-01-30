import { getGroups } from "client";
import { get, writable } from "svelte/store";
import { isEmpty } from "$lib/types/array";


const _all_groups = writable<string[]>([]);


export async function groupsForMultiselect(): Promise<string[]> {
    let stored = get(_all_groups)
    if(!isEmpty(stored)){
        return stored
    }

    const res = await getGroups()
    let ret: string[] = []
    if (res.response.ok){
        for(const group of res.data!)
            if(group.path != "admin")
                ret.push(group.path!)

        ret.sort();

        _all_groups.set(ret);
        return ret;
    } else {
        throw new Error(res.response.statusText)
    }
}
