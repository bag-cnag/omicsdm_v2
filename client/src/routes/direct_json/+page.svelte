<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    import { type ErrorObject, type SchemaObject } from "ajv";
    import { val, ajv, getArrayValidator, getSchema } from "$lib/validate";
    import { capitalizeFirstLetter } from "$lib/types/str";
    import {postProjects, postDatasets, type Error as SrvError, postFiles} from "client";

    import { JSONEditor, Mode } from 'svelte-jsoneditor';
    import { parseTSV } from "./csv";
    import { improveAjvError, normalizeAjvError } from "./valid"

    let mounted = $state<boolean>(false);
    let isValid = $state<boolean>(true);
    let entry = $state<string>();
    let content = $state.raw<any>();
    let format = $state<string>();
    let topSchema = $state.raw<SchemaObject>(); 
    let error = $state<string>();

    // Retrieve the JSON data from localStorage when the component mounts
    onMount(() => {
        const input = sessionStorage.getItem('direct_json_data');
        if (input) {
            const jsonInput = JSON.parse(input);
            format = jsonInput.format;
            const base64Content = jsonInput.data.split(',')[1];
            const contentString = atob(base64Content);
            entry = jsonInput.entry;

            topSchema = (getSchema(capitalizeFirstLetter(entry!)) as SchemaObject);

            if(!topSchema || !entry){
                goto("/");
            } else {
                if(format == "json"){
                    try {
                        content = {json: JSON.parse(contentString)};
                    } catch(e){
                        console.error((e as Error));
                    }
                } else {
                    content = {json: parseTSV(contentString, entry!, topSchema)};
                }
                mounted = true;
            }
        } else {
            goto("/");
        }
    })

    function createValidator(id: string){
        return function validate(json: any) {
            let ajvErrors: Array<ErrorObject> = [];
            if(Array.isArray(json)){
                const fn = getArrayValidator(id);
                fn(json);
                ajvErrors = ajvErrors.concat(fn.errors || []);
            } else {
                val(id, json);
                ajvErrors = ajvErrors.concat(ajv.errors || []);
            }

            ajvErrors = ajvErrors
            .map((e) => improveAjvError(e, topSchema!))
            .filter((error)=>error != null)

            isValid = ajvErrors.length === 0;
            return ajvErrors.map((error) => normalizeAjvError(json, error));
        };
    }

    async function submitToServer(){
        let submitFn;
        if(entry == 'project'){
            submitFn = postProjects;
        } else if(entry == 'dataset'){
            submitFn = postDatasets;
        } else if(entry == 'file'){
            submitFn = postFiles;
        } else {
            return new Error("entry mismatch");
        }

        let body;
        if(content.json){
            body = content.json;
        } else {
            body = JSON.parse(content.text);
        }

        let response = await submitFn({body: body})
        if(response.response.ok){
            alert('ok');
            content = {json: {}};
        } else {
            error = (response.error as SrvError).message;
        }
    }
</script>

{#if mounted}
<div class="container">
    <div class="grid justify-items-stretch">
        <h1>Direct {entry} creation</h1>
        <button class="pri-btn justify-self-end" disabled={!isValid} onclick={submitToServer}>Send</button>
    </div>
    <JSONEditor
        bind:content
        mode={(format == 'json' ? Mode.text : Mode.table)}
        validator={createValidator(capitalizeFirstLetter(entry!))}
    />
    {#if error}
        <p class="error">{error}</p>
    {/if}
    <button class="pri-btn" disabled={!isValid} onclick={submitToServer}>Send</button>
</div>
{/if}
