import { schemaGetProp } from "$lib/types/client/Schema";
import type { Filter } from "@vincjo/datatables/server";
import { OpenAPIV3 } from "openapi-types"
import * as Schemas from "client/schemas.gen"


const unary_operators = ["min", "max", "min_v", "max_v", "min_a", "max_a"];


export function parseFilters(
    schema: OpenAPIV3.BaseSchemaObject,
    filters: Filter<any>[] | undefined
){
    let extra_q = ""

    if (filters){
        for(let { field, value } of filters){
            if (!value){
                continue;
            }

            let field_def = schemaGetProp(schema, field.toString())

            field = field.toString()
            switch (field_def?.type){
                case "array":
                    const nested = field_def['items']['$ref'].split('/').pop() + 'Schema';
                    const nested_schema = Schemas[nested];
                    const keys = Object.keys(nested_schema.properties);
                    if(keys.length == 1){
                        const down = parseFilters(nested_schema, [{field: keys[0], value: value}])
                        extra_q += field + "." + down.substring(0, down.length-1);
                    }
                case "boolean":
                    value = (value as string).toLowerCase()
                    if(value === 'true'){
                        extra_q += field + '=1';
                    }
                    if(value === 'false'){
                        extra_q += field + '=0';
                    }
                    break;
                case "string":
                    if (field_def.format != "date"){
                        if (field_def.enum){
                            extra_q += field + '=' + (value as string)    
                        } else {
                            extra_q += field + '=*' + (value as string).split(',').join('*,*') + '*'
                        }
                        break;
                    }
                case "number":
                case "integer":
                    const [c1, c2, ...tail] = (value as string);
                    let op  = "";
                    let v = tail.join('');

                    if (c1 + c2 === ">="){
                        op = "ge";
                    } else if (c1 + c2 === "<="){
                        op = "le";
                    } else if (c1 === ">"){
                        op ="gt";
                        v = (c2 || '') + v;
                    } else if (c1 === "<"){
                        op = "lt";
                        v = (c2 || '') + v;
                    }

                    if (op){
                        if(v == ''){
                            continue;
                        }
                        extra_q += field + "." + op + "(" + v + ")";
                        break;
                    }

                    if (unary_operators.includes(value as string)){
                        extra_q += field + "." + value + "()";
                        break;
                    }

                    // Implicit else: cast for default below.
                    value = (value as string).split(',')
                    value = Array.from((value as string[]), (obj)=>{
                        const x = Number(obj);
                        if(isNaN(x)){
                            return null;
                        } else {
                            return x;
                        }
                    }).join(',')
                    if (value == ''){
                        continue;
                    }
                default:
                    extra_q += field + "="+ value;
            }
            extra_q += "&"
        }
    }

    return extra_q
}
