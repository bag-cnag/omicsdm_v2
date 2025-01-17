import type {
    AssoPermDatasetSelf, AssoPermDatasetFiles, Dataset, AssoPermProjectDatasets, Project
} from "client";


export function extractDatasetPermissions(
    data: Partial<Dataset>,
    read_selected: Array<string>,
    write_selected: Array<string>,
    download_selected: Array<string>,
){
    let perm_self: AssoPermDatasetSelf = {}
    if (read_selected && read_selected.length){
        perm_self.read = {groups: []}
        for(const path of read_selected)
            perm_self.read.groups!.push({"path": path})
    } else
        perm_self.read = {}

    if (download_selected && download_selected.length){
        perm_self.download = {groups: []}
        for(const path of download_selected)
            perm_self.download.groups!.push({"path": path})
    } else
        perm_self.download = {}

    let perm_files: AssoPermDatasetFiles = {}
    if (write_selected && write_selected.length){
        perm_files.write = {groups: []}
        for(const path of write_selected)
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
        for(const path of write_selected)
            perm_datasets.write.groups!.push({"path": path})
    } else
        perm_datasets.write = {}
    
    if (download_selected && download_selected.length){
        perm_datasets.download = {groups: []}
        for(const path of download_selected)
            perm_datasets.download.groups!.push({"path": path})
    } else
        perm_datasets.download = {}
    
    data['perm_datasets'] = perm_datasets
    return data
}
