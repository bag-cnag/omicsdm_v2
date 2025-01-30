<script lang="ts">
    import { ProjectSchema, type Project } from "client";
    import { onMount } from "svelte";
    import { groupsForMultiselect } from "$lib/remote/groups";
    import { Form, AutoInput, InputContainer } from "./components"
    import { Textarea } from "flowbite-svelte";
    import GroupMultiSelect from "./components/GroupMultiSelect.svelte";

    let {
        btnText = "Create",
        id = null,
        project = {},
        isSharing = false,
        write_selected = $bindable(),
        download_selected = $bindable(),
        onsubmit
    } : {
        btnText?: string,
        id?: string | null,
        project?: Project | Partial<Project>,
        isSharing?: boolean,
        write_selected: Array<string>,
        download_selected: Array<string>,
        onsubmit: Function
    } = $props();

    let all_groups: string[] = $state([])

    onMount(async ()=>{
        all_groups = await groupsForMultiselect()
    })
</script>

<Form id={id} btnText={btnText} onsubmit={onsubmit}>
    {#if !isSharing}
        <AutoInput schema={ProjectSchema} field="short_name" value={project.short_name}/>
        <AutoInput schema={ProjectSchema} field="long_name" value={project.long_name}/>
        <InputContainer field="description" required={false}>
            <Textarea value={project['description']} id="description" class="w-3/4" placeholder="Lorem ipsum..." rows={4} name="description" />
        </InputContainer>
        <AutoInput schema={ProjectSchema} field="logo_url" value={project.logo_url}/>
    {/if}

    <InputContainer field="write_groups" required={false}>
        <GroupMultiSelect id="write_groups" size="lg" options={all_groups} bind:selected={write_selected} />
    </InputContainer>
    <InputContainer field="download_groups" required={false}>
        <GroupMultiSelect id="download_groups" size="lg" options={all_groups} bind:selected={download_selected} />
    </InputContainer>
</Form>

<!-- <AutoInput schema={DatasetSchema} field="long_name" value={dataset.long_name}/> -->

<!-- 
<form id="file_upload_form" class="p-3 w-2/3" onsubmit={
    e => FormSubmit(e, write_selected, download_selected)
}>
    <div class="md:flex md:items-center mb-6">
      <div class="md:w-1/3">
        <label for="short_name">Short Name<span class="text-red-500">*</span></label>
      </div>
      <div class="md:w-2/3">
        <input id="short_name" class="text-black w-3/4" name="short_name" type="text"/>
      </div>
    </div>
    <div class="md:flex md:items-center mb-6">
        <div class="md:w-1/3">
          <label for="long_name">Long Name</label>
        </div>
        <div class="md:w-2/3">
          <input id="long_name" class="text-black w-3/4" name="long_name" type="text"/>
        </div>
    </div>
    <div class="md:flex md:items-center mb-6">
        <div class="md:w-1/3">
          <label for="description">Description</label>
        </div>
        <div class="md:w-2/3">
          <Textarea id="description" class="w-3/4" placeholder="Lorem ipsum..." rows="4" name="Description" />
        </div>
    </div>
    <div class="md:flex md:items-center mb-6">
        <div class="md:w-1/3">
          <label for="logo_url">Logo Url</label>
        </div>
        <div class="md:w-2/3">
          <input id="logo_url" class="text-black w-3/4" name="logo_url" type="text"/>
        </div>
    </div>
    <div class="md:flex md:items-center mb-6">
        <div class="md:w-1/3">
          <label for="write_groups">Write Groups</label>
        </div>
        <div class="md:w-2/3">
            {#await all_groups then data}
                <MultiSelect id="write_groups" class="w-3/4" items={data} bind:value={write_selected} size="lg" />
            {/await}
        </div>
    </div>
    <div class="md:flex md:items-center mb-6">
        <div class="md:w-1/3">
          <label for="download_groups">Download Groups</label>
        </div>
        <div class="md:w-2/3">
            {#await all_groups then data}
                <MultiSelect id="download_groups" class="w-3/4" items={data} bind:value={download_selected} size="lg" />
            {/await}
        </div>
    </div>
    <div class="md:flex md:items-center mb-6"> 
      <div class="md:w-2/3"></div>
      <div class="md:w-1/3">
        <button type="submit">Create</button>
      </div>
    </div>
    <div class="text-red-500" id="errorMessages"></div>
</form> -->