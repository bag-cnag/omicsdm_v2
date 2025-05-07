<script lang="ts">
    import { DatasetSchema, type Dataset } from "client";
    import { Textarea } from 'flowbite-svelte';
    import { onMount } from "svelte";
    import { groupsForMultiselect } from "$lib/remote/groups";
    import { Form, AutoInput, InputContainer } from "./components"
    import { datasetGet } from "$lib/types/client/Dataset";
    import GroupMultiSelect from "./components/GroupMultiSelect.svelte";
    import { containsParent } from "./helpers"
    import type { EventHandler, HTMLAttributes } from "svelte/elements";

    type Props = {
        btnText?: string,
        isSharing?: boolean,
        dataset?: Dataset | Partial<Dataset>,
        write_options?: string[],
        download_options?: string[],
        read_selected: string[],
        write_selected: string[],
        download_selected: string[],
        onsubmit: EventHandler
    } & HTMLAttributes<HTMLFormElement>;

    // inputs "props"
    let {
        btnText = "Create",
        isSharing = false,
        dataset = {},
        write_options,
        download_options,
        read_selected = $bindable(),
        write_selected = $bindable(),
        download_selected = $bindable(),
        onsubmit,
        ...rest
    } : Props = $props();

    let all_groups: string[] = $state([]);
    let mounted = $state(false);

    onMount(async () => {
        // fetch groups
        all_groups = await groupsForMultiselect();

        // Visual consistency, put child groups (only) of all allowed groups from Project.
        if(write_options?.length){
            write_options = all_groups.filter(item => containsParent(write_options!, item))
        }
        if(download_options?.length){
            download_options = all_groups.filter(item => containsParent(download_options!, item))
        }

        mounted = true;
    });
</script>

{#if mounted}
<Form btnText={btnText} onsubmit={onsubmit} {...rest}>
    <!-- id={id}  -->
    {#if !isSharing}
        <AutoInput schema={DatasetSchema} field="short_name" value={dataset.short_name}/>
        <AutoInput schema={DatasetSchema} field="long_name" value={dataset.long_name}/>

        <InputContainer field="description" required={false}>
            <Textarea value={dataset['description']} id="description" class="w-3/4"
                placeholder="Lorem ipsum..." rows={4} name="description" />
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
            // "contact_username"
            "contact_email"
        ] as field
        }
            <AutoInput schema={DatasetSchema} field={field} value={datasetGet(dataset, field)}/>
        {/each}
    {/if}

    <InputContainer field="read_groups" required={false}>
        <GroupMultiSelect id="read_groups" size="lg"
            options={all_groups}
            bind:selected={read_selected} />
    </InputContainer>

    <InputContainer field="write_groups" required={false}>
        <GroupMultiSelect id="write_groups" size="lg"
            options={write_options?.length ? write_options : all_groups}
            bind:selected={write_selected} />
    </InputContainer>

    <InputContainer field="download_groups" required={false}>
        <GroupMultiSelect id="download_groups" size="lg"
            options={download_options?.length ? download_options : all_groups}
            bind:selected={download_selected} />
    </InputContainer>
</Form>
{/if}

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