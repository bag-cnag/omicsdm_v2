import { toIndex } from "$lib/types/str";
import { getSchema } from "$lib/validate";
import type { SchemaObject } from "ajv";

export function parseTSV(contentString: string, entry: string, schema: SchemaObject){
    // Parse TSV into JSON
    const lines = contentString.split('\n');
    let headers = lines[0].split('\t');
    headers = headers.map((e) => toIndex(e));
    let result = [];
    for(let i=1;i<lines.length;i++){
        const bits = lines[i].split('\t')
        if(bits.length === 1 && bits[0] === '')
            continue;
        let obj = {};
        for(var j=0;j<headers.length;j++){
            const prop = schema!.properties[headers[j]];
            if(prop && prop.type == 'array'){
                obj[headers[j]] = bits[j].split(',').map(
                    (e)=>{
                        try {
                            return JSON.parse(e);
                        } catch {
                            const innerSchema = getSchema(prop.items['$ref']);
                            if(
                                innerSchema &&
                                Object(e) !== e &&
                                innerSchema.required.length === 1
                            ){
                                let inner = {};
                                inner[innerSchema.required[0]] = e;
                                return inner;
                            } else {
                                console.error('not implemented');
                            }
                        }
                    }
                );
            } else if(entry == 'dataset' && [
                "read_groups", "download_groups"
            ].includes(headers[j])){
                if(!bits[j])
                    continue;
                obj['perm_self'] = obj['perm_self'] || {};
                obj['perm_self'][headers[j].split('_')[0]] = {
                    "groups": bits[j].split(',').map((e) => {return {'path': e};})          
                }
            } else if(entry == 'dataset' && headers[j] === "write_groups"){
                if(!bits[j])
                    continue;
                obj['perm_files'] = {
                    "write": {
                        "groups": bits[j].split(',').map((e) => {return {'path': e};})          
                    }
                }
            } else if(entry == 'project' && [
                "write_groups", "download_groups"
            ].includes(headers[j])){
                if(!bits[j])
                    continue;
                obj['perm_datasets'] = obj['perm_datasets'] || {};
                obj['perm_datasets'][headers[j].split('_')[0]] = {
                    "groups": bits[j].split(',').map((e) => {return {'path': e};})          
                }
            } else {
                obj[headers[j]] = bits[j];
            }
        }
        result.push(obj);
    }
    return result;
}
