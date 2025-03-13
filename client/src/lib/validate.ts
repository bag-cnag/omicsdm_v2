import Ajv from "ajv-draft-04"
import addFormats from "ajv-formats"
import { endpoint } from './config'

// Load API Schema
const OpenAPISchema = (await ((await fetch(endpoint + '/schema')).json())) 
const identifier = "API.json";

export const ajv = new Ajv({strict: false, allErrors: true, coerceTypes: true, verbose: true})
addFormats(ajv)

ajv.addSchema(OpenAPISchema, identifier)


// Schemas base path
const sbp = identifier + "#/components/schemas/"


function computeRef(id: string){
    return id.startsWith('#') ? identifier + id : sbp + id;
}


// simple method, expects type name as id (e.g. Project, Dataset...)
export function val(id: string, data: object){
    return ajv.validate({ "$ref": computeRef(id) }, data);
}


export function getSchema(id: string){
    return ajv.getSchema(computeRef(id))?.schema;
}


export function getArrayValidator(id: string){
    const innerArraySchema = {
        "type": "array",
        "items" : {
            "$ref": computeRef(id)
        }
    }
    return ajv.compile(innerArraySchema)
}