<!-- UploadCard.svelte -->
<script lang="ts">
    import { Card, Spinner } from 'flowbite-svelte';
    import SvgArrowUpRight from '$lib/icons/SvgArrowUpRight.svelte';

    let {filename, url, error, ...rest } : {
        filename: string,
        url: string,
        error?: string,
        rest?: SvelteRestProps
    } = $props();
    export { url, error };
</script>

<Card {...rest}>
    <h5>Starting Visualizer -- {filename}</h5>
    <div class="tail">
        {#if url}
            <a href={url} title="Open" class="link-btn">
                <SvgArrowUpRight/>
            </a>
        {:else if error}
            <div class="error">
                Error: {error}
            </div>
        {:else}
            <Spinner size={14}/>
        {/if}
    </div>
</Card>
