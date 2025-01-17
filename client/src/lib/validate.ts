import Ajv from "ajv-draft-04"
import addFormats from "ajv-formats"
import { endpoint } from './config'

// Load API Schema
const OpenAPISchema = (await ((await fetch(endpoint + '/schema')).json())) 

export const ajv = new Ajv({strict: false, allErrors: true, coerceTypes: true})
addFormats(ajv)
ajv.addSchema(OpenAPISchema, "API.json")

// Schemas base path
const sbp = "API.json#/components/schemas/"

// simple method, expects type name as id (e.g. Project, Dataset...)
export function val(id: string, data: object){
    return ajv.validate({ "$ref": sbp + id }, data)
}
