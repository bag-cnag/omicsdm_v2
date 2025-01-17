<script lang="ts">
    import { DatasetSchema, type Dataset } from "client";
    import { MultiSelect, type SelectOptionType, Textarea } from 'flowbite-svelte';
    import { onMount } from "svelte";
    import { groupsForMultiselect } from "$lib/remote/groups";
    import { getKeyValue } from '$lib/types/obj'; 
    import { Form, AutoInput, InputContainer } from "./components"

    // inputs "props"
    let {
        btnText = "Create",
        id = null,
        isSharing = false,
        dataset = {},
        read_selected = $bindable(),
        write_selected = $bindable(),
        download_selected = $bindable(),
        onsubmit
    } : {
        btnText?: string,
        id?: string | null,
        isSharing?: boolean,
        dataset?: Dataset | Partial<Dataset>,
        read_selected: Array<string>,
        write_selected: Array<string>,
        download_selected: Array<string>,
        onsubmit: Function
    } = $props();

    // Access perm
    let all_groups: Array<SelectOptionType<string>> = $state([])

    const datasetGet = (key: string) => {
        // Typescript compliant get
        if (dataset) {
            return getKeyValue<keyof Dataset, Dataset | Partial<Dataset>>(
                key as keyof Dataset)(dataset);
        }
        return null;
    }

    onMount(async () => {
        // fetch groups
        all_groups = await groupsForMultiselect()
    });
</script>


<Form id={id} btnText={btnText} onsubmit={onsubmit}>
    {#if !isSharing}
        <AutoInput schema={DatasetSchema} field="short_name" value={dataset.short_name}/>
        <AutoInput schema={DatasetSchema} field="long_name" value={dataset.long_name}/>

        <InputContainer field="description" required={false}>
            <Textarea value={dataset['description']} id="description" class="w-3/4" placeholder="Lorem ipsum..." rows=4 name="description" />
        </InputContainer>

        <InputContainer field="disease" required={true}>
            <select value={dataset['disease']} class="w-3/4" name="disease" id="disease" required>
                {#each DatasetSchema.properties.disease.enum as d}
                    <option value="{d}">{d}</option>
                {/each}
            </select>
        </InputContainer>

        {#each [
            "treatment",
            "molecular_info",
            "sample_type",
            "data_type",
            "value_type",
            "platform",
            "genome_assembly",
            "annotation",
            "samples_count",
            "features_count",
            "features_id",
            "healthy_controls_included",
            "additional_info",
            "contact_username"
        ] as auto_field
        }
            <AutoInput schema={DatasetSchema} field={auto_field} value={datasetGet(auto_field)}/>
        {/each}
    {/if}

    <InputContainer field="read_groups" required={false}>
        <MultiSelect id="read_groups" class="w-3/4" items={all_groups} bind:value={read_selected} size="lg" />
    </InputContainer>

    <InputContainer field="write_groups" required={false}>
        <MultiSelect id="write_groups" class="w-3/4" items={all_groups} bind:value={write_selected} size="lg" />
    </InputContainer>

    <InputContainer field="download_groups" required={false}>
        <MultiSelect id="download_groups" class="w-3/4" items={all_groups} bind:value={download_selected} size="lg" />
    </InputContainer>
</Form>

<!-- DatasetSchema
# Classic
short_name      = String(required=True)
long_name       = String()
description     = String()
submission_date = Date(dump_only=True)

# Bio
disease =  String(validate=OneOf(("COPD", "ASTHMA", "CD", "UC", "MS", "SLE", "RA")), required=True)
treatment =  String(required=True)
molecular_info =  String(required=True)
sample_type =  String(required=True)
data_type =  String(required=True)
value_type =  String(required=True)
platform =  String(required=True)
genome_assembly = String(required=True)
annotation =  String(required=True)
samples_count =  Integer(required=True)
features_count =  Integer(required=True)
features_id =  String(required=True)
healthy_controls_included = Boolean(required=True)
additional_info =  String()

# Fk
project_id = Integer(required=True)
submitter_username = String() # Auto-filled
contact_username = String(required=True)
-->