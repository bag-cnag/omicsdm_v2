<script lang="ts">
    import { FileSchema, type File as srvFile } from "client";
    import { Form, AutoInput, InputContainer } from "./components"
    import { capitalizeFirstLetter } from "$lib/types/str";
    import { tick } from "svelte"
    import type { EventHandler } from "svelte/elements";

    let {
        btnText = "Upload",
        id = null,
        reupFile = $bindable(),
        onsubmit
    } : {
        btnText?: string,
        id?: string | null,
        reupFile?: srvFile,
        onsubmit: EventHandler
    } = $props();

    let size_form_value = $state<String>()

    async function FileChange(ev:  Event){
        let file = ((ev.target! as HTMLFormElement).files as FileList)[0];
        // filename_form_value = file.name;
        size_form_value = file.size.toString();
        document.getElementById("filename")!.value = file.name
        // document.getElementById("size")!.value = file.size
        await tick(); // Force refresh
        // https://github.com/sveltejs/svelte/issues/9496
    }
</script>

<Form id={id} btnText={btnText} onsubmit={onsubmit}>
    <InputContainer field="filename" required={true}>
        <!-- <input id="filename" name="filename" type="text" value={filename_form_value()}/> -->
        <!-- <input id="filename" name="filename" type="text"
            value={filename_form_value != "" ? filename_form_value : (
                    reupFile ? reupFile?.filename + "." + reupFile?.extension : ""
            )}
        /> -->
        <input id="filename" name="filename" type="text" class="w-full"
            value={(reupFile ? reupFile?.filename + "." + reupFile?.extension : "")}
        />
    </InputContainer>
    <InputContainer field="file" required={true}>
        <input class="text-white w-full" id="file" onchange={e => FileChange(e)} name="file" type="file" />
    </InputContainer>
    <InputContainer field="filetype" required={true}>
        <select class="border-2 border-gray-600 w-full" name="filetype" id="filetype" value={reupFile?.type}>
            {#each FileSchema.properties.type.enum as filetype}
                <option value="{filetype}">{capitalizeFirstLetter(filetype)}</option>
            {/each}
        </select>
    </InputContainer>
    <!-- <AutoInput schema={FileSchema} field="comment" value={comment_form_value}/> -->
    <!-- <AutoInput schema={FileSchema} field="comment" value={reupFile?.comment}/> -->

    <InputContainer field="description" required={false}>
        <input class="text-black w-full" id="description" name="description" type="text" value={reupFile?.description}/>
    </InputContainer>

    <InputContainer field="size" required={false}>
        <input id="size" class="text-stone-600 w-full" name="size" value={size_form_value} readonly type="number"/>
        <!-- <input id="size" class="text-stone-600" name="size" readonly value={size_form_value} type="number"/> -->
    </InputContainer>
</Form>
