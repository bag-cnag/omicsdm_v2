import type { State } from "@vincjo/datatables/server"
import { DatasetSchema, getDatasets, type Dataset, type GetDatasetsData } from "client"

export const reload = async ({ offset, currentPage, rowsPerPage, filters, setTotalRows }: State, id: string) => {
    let query: GetDatasetsData["query"] = {}
    let extra_q: string = ""

    if (filters){
        for(let { field, value } of filters){
            let target_type: string = DatasetSchema.properties[field.toString()].type
            switch (target_type){
                case "string":
                    query[field]="*"+value+"*";
                    break;
                case "float":
                case "integer":
                    const [c1, c2, ...tail] = value;
                    if (c1 === ">"){
                        if (c2 && c2 === "="){
                            extra_q += field + "." + "ge(" + tail.join('') +")";
                        } else {
                            extra_q += field + "." + "gt(" + c2 + tail.join('') +")";
                        }
                        break;
                    }
                    if (c1 === "<"){
                        if (c2 && c2 === "="){
                            extra_q += field + "." + "le(" + tail.join('') +")";
                        } else {
                            extra_q += field + "." + "lt(" + c2 + tail.join('') +")";
                        }
                        break;
                    }
                    if ( value == "min" ){
                        extra_q += field + "." + "min()";
                        break;
                    }
                    if (value == "max" ){
                        extra_q += field + "." + "max()";
                        break;
                    }
                    if ( value == "min_v" ){
                        extra_q += field + "." + "min_v()";
                        break;
                    }
                    if (value == "max_v" ){
                        extra_q += field + "." + "max_v()";
                        break;
                    }
                default:
                    query[field] = value;
            }
        }
        // TODO: think about operators
        // query = Object.fromEntries( filters.map( x => [key_maker(x), value_maker(x)]) );
    }
    if (extra_q){
        query["q"] = extra_q
    }
    query["project_id"] = +id
    query.start = +offset
    query.end = currentPage * rowsPerPage
    query.count = true

    const response = await getDatasets({query: query})
    if(response.response.ok){
        setTotalRows(+response.response.headers.get('x-total-count')!)
        return (response.data as Dataset[])
    } else {
        throw new Error(response.response.statusText)
    }
}
