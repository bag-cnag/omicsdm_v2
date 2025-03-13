<script lang="ts">
    import { Form } from "./components"
    import type { EventHandler } from "svelte/elements";
    import { Button } from 'flowbite-svelte';
    import { SvgChevronUp, SvgChevronDown, SvgDownload } from '$lib/icons';

    let {
        btnText = "Submit",
        entry,
        orientation = "vertical",
        id = null,
        fClass="",
        ...rest
    } : {
        btnText?: string,
        id?: string | null,
        fClass?: string,
        orientation?: string,
        entry: string,
        rest?: SvelteRestProps
    } = $props();

    const template_prefix = "/public/metadata_templates/";
    let display = $state<boolean>(false);
    let template_path = $state<string>(template_prefix + entry + "_template.csv");

    const icon_cols = "w-6 h-6 ms-2 text-white dark:text-white";
    
    function formatChange(ev: Event){
        let format = (ev.target! as HTMLFormElement).value;
        
        if(format === 'tsv'){
            // template_path = ProjectTemplate;%sveltekit.assets%
            template_path = template_prefix + entry + "_template.csv";
        } else if(format === 'json'){
            template_path = template_prefix + entry + "_template.json";
        } else {
            console.error("Invalid format: " + format);
        }
    }
    // https://github.com/ajv-validator/ajv/issues/763#issuecomment-590566870s
    function directCreate(ev: Event){
        const form = (ev.target! as HTMLFormElement);
        const formdata = new FormData(form);
        const file = (formdata.get('ds_metadata_file') as File);
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                // Store the file as a base64 string in localStorage
                sessionStorage.setItem('direct_json_data', JSON.stringify({
                    format: formdata.get('format'),
                    entry: entry,
                    data: reader.result,
                }));
            };
            reader.readAsDataURL(file);
            window.location.href = window.location.origin + "/direct_json"
        }
    }

    async function FileChange(ev:  Event){
        let file = ((ev.target! as HTMLFormElement).files as FileList)[0];
        if (file.type == "application/json"){
            document.getElementById("format")!.value = "json";
        } else {
            document.getElementById("format")!.value = "tsv";
        }
    }
    const btn_class = "pri-btn h-min" + (orientation === 'horizontal' ? " flex-row" : ""); 
    const form_class = fClass + (orientation === 'horizontal' ? " grid grid-cols-1 w-full" : "")
</script>


<div class={(orientation === 'horizontal') ? "grid grid-cols-1" : ""}>
<button class={btn_class} onclick={() => {display = !display;}}>
    <span class="tail">
        Direct creation
        {#if display}
            <SvgChevronUp cclass="w-6 h-6 ms-2 text-white dark:text-white"/>
        {:else}
            <SvgChevronDown cclass="w-6 h-6 ms-2 text-white dark:text-white"/>
        {/if}
    </span>
</button>

<!-- <Button size={"xs"} class={ }> -->
<!-- </Button> -->

{#if display}
<Form id={id} fClass={form_class} btnText={"verify"} onsubmit={(e) => directCreate(e)} {...rest}>
    <p style="line-height: 64px;">
        <label for="format">Format:</label>
        <select id="format" name="format" onchange={formatChange}>
            <option value="tsv">TSV</option>
            <option value="json">JSON</option>
        </select>
        <a class="link-btn" href={template_path} download>
            <span class="tail">template <SvgDownload cclass={icon_cols}/></span>
        </a>
    </p>
    <p>
        <input type="file" onchange={e => FileChange(e)} id="ds_metadata_file" name="ds_metadata_file">
    </p>
<!-- 
    <InputContainer field="format" required={true}>
        <select id="format" name="format" onchange={()=>{}}>
            <option value="tsv">TSV</option>
            <option value="json">JSON</option>
        </select>
    </InputContainer>
    <button id="dl_template_btn" class="m-2 mr-8 ml-8 pri-btn">template</button>
    <InputContainer field="file" required={true}>
        <input type="file" id="ds_metadata_file" name="ds_metadata_file">
    </InputContainer> -->
</Form>
{/if}
</div>
