import type { State } from "@vincjo/datatables/server"
import { FileSchema, getFiles, type GetFilesData} from "client"
import { parseFilters } from "$lib/table/helpers"
import { OpenAPIV3 } from "openapi-types"


export const reload = async (
    { offset, currentPage, rowsPerPage, filters, setTotalRows }: State,
    id: string,
    version: string
) => {
    let query: Partial<GetFilesData["query"]> = {}
    let extra_q: string = parseFilters(
        (FileSchema as unknown as OpenAPIV3.BaseSchemaObject), filters
    )

    extra_q += "ready=true"
    if (!extra_q.includes('type=')){
        query.type = ["clinical","molecular"]
    }

    query["q"] = extra_q
    query.dataset_id = [+id]
    query.dataset_version = [+version]
    query.start = +offset
    query.end = currentPage * rowsPerPage
    query.enabled = true
    query.count = true

    const response = await getFiles({query: (query as GetFilesData["query"])})
    if (response.response.ok){
        setTotalRows(+response.response.headers.get('x-total-count')!)
        return response.data!
    } else {
        throw new Error(response.error!.message)
    }
}
