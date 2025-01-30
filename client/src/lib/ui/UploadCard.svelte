<!-- UploadCard.svelte -->
<script lang="ts">
    import { Card, Progressbar } from 'flowbite-svelte';
    import { SvgCircleCheck } from '$lib/icons';
    import { fade } from 'svelte/transition';

    let {progress, filename, reup, error, ...rest } : {
        progress: string,
        filename: string,
        reup: boolean,
        error?: string,
        rest?: SvelteRestProps
    } = $props();
    export { progress, error };
</script>

<div out:fade={{ duration: 5000 }}>
<Card {...rest}>
    {#if reup}
        <h5>Re-Upload -- {filename}</h5>
    {:else}
        <h5>Upload -- {filename}</h5>
    {/if}
    {#if error}
        <div class="error">
            Error: {error}
        </div>
    {:else}
        <div class="tail">
            <Progressbar bind:progress/>
            {#if progress === "100"}
                <SvgCircleCheck cclass="text-green-500"/>
            {/if}
        </div>
    {/if}
</Card>
</div>
