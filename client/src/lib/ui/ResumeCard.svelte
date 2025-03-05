<!-- ResumeCard.svelte -->
<script lang="ts">
    import { Card, Progressbar } from 'flowbite-svelte';
    import { SvgCircleCheck } from '$lib/icons';
    import { fade } from 'svelte/transition';
    import type { EventHandler } from 'svelte/elements';

    let {progress, filename, onchange, error, ...rest } : {
        progress: string,
        filename: string,
        onchange: EventHandler,
        error?: string,
        rest?: SvelteRestProps
    } = $props();
    export { progress, error };
</script>

<div out:fade={{ duration: 5000 }}>
<Card {...rest}>
    <h5>Resume Uploading -- {filename}</h5>
    <div class="tail">
        <Progressbar bind:progress/>
        {#if progress === "100"}
            <SvgCircleCheck cclass="text-green-500"/>
        {/if}
    </div>
    <input class="text-gray m-1" onchange={onchange} name="file" type="file" />
    {#if error} 
        <div class="error">
            Error: {error}
        </div>
    {/if}
</Card>
</div>
