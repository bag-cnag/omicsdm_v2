import type {
    AssoPermDatasetSelf, AssoPermDatasetFiles, Dataset, AssoPermProjectDatasets, Project, ListGroup
} from "client";


export function containsParent(ls: string[], element: string): boolean {
    for(const v of ls){
        if(element != v && element.includes(v)){
            return true;
        }
    }
    return false;
}


export function listGroupToListPaths(lg: ListGroup | undefined): string[] {
    const ls: string[] = [];
    if(!lg || !lg.groups){
        return ls;
    }

    for(const group of lg.groups){
        ls.push(group.path!);
    }

    return ls.sort();
}


export function listGroupToPreSelection(lg: ListGroup | undefined, all_groups: string[]): string[] {
    let pre_selected = listGroupToListPaths(lg);

    pre_selected = pre_selected.concat(
        all_groups.filter(item => containsParent(pre_selected, item))
    )

    return pre_selected;
}


export function extractDatasetPermissions(
    data: Partial<Dataset>,
    read_selected: Array<string>,
    write_selected: Array<string>,
    download_selected: Array<string>,
){
    let perm_self: AssoPermDatasetSelf = {}
    if (read_selected && read_selected.length){
        perm_self.read = {groups: []}
        for(const path of read_selected.filter(item => !containsParent(read_selected, item)))
            perm_self.read.groups!.push({"path": path})
    } else
        perm_self.read = {}

    if (download_selected && download_selected.length){
        perm_self.download = {groups: []}
        for(const path of download_selected.filter(item => !containsParent(download_selected, item)))
            perm_self.download.groups!.push({"path": path})
    } else
        perm_self.download = {}

    let perm_files: AssoPermDatasetFiles = {}
    if (write_selected && write_selected.length){
        perm_files.write = {groups: []}
        for(const path of write_selected.filter(item => !containsParent(write_selected, item)))
            perm_files.write.groups!.push({"path": path})
    } else
        perm_files.write = {}

    data['perm_self'] = perm_self
    data['perm_files'] = perm_files
    return data
}


export function extractProjectPermissions(
    data: Partial<Project>,
    write_selected: Array<string>,
    download_selected: Array<string>,
){
    let perm_datasets: AssoPermProjectDatasets = {}
    if (write_selected && write_selected.length){
        perm_datasets.write = {groups: []}
        for(const path of write_selected.filter(item => !containsParent(write_selected, item)))
            perm_datasets.write.groups!.push({"path": path})
    } else
        perm_datasets.write = {}

    if (download_selected && download_selected.length){
        perm_datasets.download = {groups: []}
        for(const path of download_selected.filter(item => !containsParent(download_selected, item)))
            perm_datasets.download.groups!.push({"path": path})
    } else
        perm_datasets.download = {}
    
    data['perm_datasets'] = perm_datasets
    return data
}
