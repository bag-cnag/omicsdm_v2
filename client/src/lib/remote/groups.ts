import { getGroups } from "client";
import { type SelectOptionType } from 'flowbite-svelte';


export async function groupsForMultiselect(
    ): Promise<SelectOptionType<string>[]> {
    const res = await getGroups()
    const ret = []
    if (res.response.ok){
        for(const group of res.data!)
            if(group.path != "admin")
                ret.push({'value': group.path, 'name': group.path})

        return (ret.sort(( a, b ) => {
            if (b['name']!.includes(a['name']!))
                return -1;
            if (a['name']! > b['name']!)
                return -1;
            if (b['name']! < a['name']!)
                return 1;
            return 0;
        }) as SelectOptionType<string>[]);
    } else
        throw new Error(res.response.statusText)
}

export const GroupsForMultiselect = await groupsForMultiselect();
