import { type ErrorObject, type SchemaObject } from "ajv";
import { getSchema } from "$lib/validate";
import { ValidationSeverity } from 'svelte-jsoneditor';
import { parsePath } from 'immutable-json-patch';
import { capitalizeFirstLetter } from "$lib/types/str";

// Below are some functions copied createAjvValidator.js
// Slightly tweaked for the use case.
export function normalizeAjvError(json: object, ajvError: ErrorObject) {
    return {
        path: parsePath(json, ajvError.instancePath),
        message: ajvError.message || 'Unknown error',
        severity: ValidationSeverity.warning
    };
}
/**
 * Improve the error message of a JSON schema error,
 * for example list the available values of an enum.
 */
export function improveAjvError(ajvError: ErrorObject, topSchema: SchemaObject) {
    let message = undefined;
    if (ajvError.keyword === 'enum' && Array.isArray(ajvError.schema)) {
        let enums = ajvError.schema;
        if (enums) {
            enums = enums.map((value) => JSON.stringify(value));
            if (enums.length > 7) {
                const more = ['(' + (enums.length - 7) + ' more...)'];
                enums = enums.slice(0, 7);
                enums.push(more);
            }
            message = 'should be equal to one of: ' + enums.join(', ');
        }
    }
    if (ajvError.keyword === 'additionalProperties') {
        message = 'should NOT have additional property: ' + ajvError.params.additionalProperty;
    }
    if(ajvError.keyword === 'required' && ajvError.params.missingProperty){
        // Check that there is a path between top level schema and that missing property.
        const missing = ajvError.params.missingProperty.split('_');
        if(missing.length === 2){
            let schema = topSchema!;
            for(const one of ajvError.instancePath.split('/')){
                const properties = Object.keys(schema.properties); 
                if(properties.findIndex((e) => e == one) != -1){
                    const nested = schema.properties[one];
                    let ref;
                    if(nested.type == 'array'){
                        ref = nested.items['$ref'];
                    } else {
                        ref = nested['$ref'];
                    }
                    if(ref){
                        // Check that this missing property is present in upper level schema.
                        const referenced = getSchema(ref);
                        if(
                            referenced == ajvError.parentSchema &&
                            properties.findIndex((e) => e == missing[1]) != -1 &&
                            getSchema(capitalizeFirstLetter(missing[0])) == schema
                        ){
                            return null;
                        }
                        schema = referenced;
                    }
                }
            }
        }
    }
    return message ? { ...ajvError, message } : ajvError;
}
