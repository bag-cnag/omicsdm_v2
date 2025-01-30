<script lang="ts">
    import type { Dataset, Project, File as SrvFile } from "client";

    import { SvgArrowRight, SvgArrowLeft, SvgPdf, SvgFolderArrowUp } from "$lib/icons";
    import { downloadFile } from "./submit";

    import { toTitle } from "$lib/types/str";
    import { datasetGet } from "$lib/types/client/Dataset";

    let {
        dataset,
        project,
        licence,
        last_upload,
        prev,
        next
    }: {
        dataset: Partial<Dataset>,
        project: Partial<Project>,
        licence?: Partial<SrvFile>,
        last_upload?: Partial<SrvFile>,
        prev?: Partial<Dataset>,
        next?: Partial<Dataset>,
    } = $props()

    const bio_fields = [
        "submitter_username",
        "contact_username",
        "disease",
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
    ];
</script>

<style lang="postcss">
    #btn-link {
        padding-left: 1.25rem;
        padding-right: 1.25rem;
        padding-top: 0.569rem;
        padding-bottom: 0.569rem;
    }

    .cartouche {
        border-left: 2rem solid #f8f8f8;
    }

    .nav-link {
        @apply w-52 m-2 ml-4;
    }

    .nav-link span {
        text-align: center;
        vertical-align: middle;
    }
</style>

<div class="flex flex-row">
    <div class="w-2/3 flex flex-wrap -mr-2 text-sm">
        <div class="mr-2 text-sm text-gray-500 dark:text-gray-400">
            <h1>{dataset.short_name} - v{dataset.version}</h1>
            <h2 class="ml-4">{dataset.long_name}</h2>

            <p class="m-2">{dataset.description}</p>
        </div>

        <hr class="w-4/5 mt-4 mb-4">

        <div class="relative ml-8">
            <h3 class="text-gray-500 dark:text-gray-400" style="font-size: 16px;">Characteristics</h3>
            <table class="text-left text-sm text-gray-500 dark:text-gray-400">
                <tbody>
                {#each bio_fields as field}
                    <tr>
                        <th class="text-xs uppercase text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">{toTitle(field)}</th>
                        <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{datasetGet(dataset,field)}</td>
                    </tr>
                {/each}
                </tbody>
            </table>
        </div>
    </div>

    <div class="cartouche flex flex-col -mt-5 -mb-5 w-1/3">
            <h3 class="text-gray-500 dark:text-gray-400 mt-2 ml-2">Links</h3>

            <a href={"/project/"+ project.id} class="link-btn mt-4 nav-link">
                Project<div class="float-right"><SvgFolderArrowUp cclass="text-white dark:text-gray-800"/></div>
            </a>

            {#if prev}
                <a data-sveltekit-reload href={"/dataset/" + prev.id + "_" + prev.version} class="link-btn nav-link">
                  Previous version<div class="float-right"><SvgArrowLeft cclass="text-white dark:text-gray-800"/></div>
                </a>
            {/if}

            {#if next}
                <a data-sveltekit-reload href={"/dataset/" + next.id + "_" + next.version} class="link-btn nav-link">
                    Next version<div class="float-right"><SvgArrowRight cclass="text-white dark:text-gray-800"/></div>
                </a>
            {/if}

            <hr class="w-full mt-2 mb-2">

            {#if licence}

                <h3 class="text-gray-500 dark:text-gray-400 ml-2">Licence</h3>

                <button type="button" id="btn-link" class="pri-btn nav-link" onclick={() => {downloadFile(licence!)}}>
                    <div class="float-left align-center">Download</div><div class="float-right"><SvgPdf cclass="text-white dark:text-gray-800"/></div>
                </button>

                <hr class="w-full mt-2 mb-2">

            {/if}
            
            <h3 class="text-gray-500 dark:text-gray-400 ml-2">Publication</h3>

            <h4 class="m-4">{dataset.submission_date}</h4>
    
            <hr class="w-full mt-2 mb-2">

            {#if last_upload}
                <h3 class="text-gray-500 dark:text-gray-400 ml-2">Last Upload</h3>

                <h4 class="m-4">{last_upload.validated_at}</h4>

                <hr class="w-full mt-2 mb-2">
            {/if}
    </div>
</div>