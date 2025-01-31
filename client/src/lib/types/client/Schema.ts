import { OpenAPIV3 } from "openapi-types";
import { getKeyValue } from "../obj";


export const schemaGetProp = (schema: OpenAPIV3.SchemaObject, key: string) => {
    if(!Object.hasOwn(schema, 'properties') || !schema.properties){
        return null;
    }

    return ((
        getKeyValue<
            keyof typeof schema.properties,
            typeof schema.properties
        >(key as keyof typeof schema.properties)(schema.properties)
    ) as OpenAPIV3.SchemaObject);
}
