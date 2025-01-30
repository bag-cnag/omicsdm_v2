import type { State } from "@vincjo/datatables/server"
import { DatasetSchema, getDatasets, type Dataset, type GetDatasetsData } from "client"
import { parseFilters } from "$lib/table/helpers"
import { OpenAPIV3 } from "openapi-types"

export const reload = async (
    { offset, currentPage, rowsPerPage, filters, setTotalRows }: State, id: string
) => {
    let query: Partial<GetDatasetsData["query"]> = {}
    let extra_q: string = parseFilters(
        (DatasetSchema as unknown as OpenAPIV3.BaseSchemaObject), filters
    )

    if (extra_q){
        query["q"] = extra_q
    }
    query["project_id"] = +id
    query.start = +offset
    query.end = currentPage * rowsPerPage
    query.count = true

    const response = await getDatasets({query: (query as GetDatasetsData["query"])})
    if(response.response.ok){
        setTotalRows(+response.response.headers.get('x-total-count')!)
        return (response.data as Dataset[])
    } else {
        throw new Error(response.response.statusText)
    }
}
