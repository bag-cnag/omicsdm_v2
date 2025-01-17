import type { State } from "@vincjo/datatables/server"
import { getFiles, type GetFilesData } from "client"

export const reload = async (
    { offset, currentPage, rowsPerPage, filters, setTotalRows }: State,
    id: string,
    version: string
) => {
    let query: Partial<GetFilesData["query"]> = {}
    let extra_q: string = "ready=true"

    query["q"] = extra_q
    query.dataset_id = +id
    query.dataset_version = +version
    query.type = "clinical,molecular"
    query.start = +offset
    query.end = currentPage * rowsPerPage
    query.enabled = true
    query.count = true

    const response = await getFiles({query: (query as GetFilesData["query"])})
    if (response.response.ok){
        setTotalRows(+response.response.headers.get('x-total-count')!)
        return response.data!
    } else {
        throw new Error(response.response.statusText)
    }
}
