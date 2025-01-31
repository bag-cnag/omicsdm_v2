<script lang="ts">
    import { toTitle } from "$lib/types/str";
    import type { Snippet } from 'svelte';

    let {
        field,
        required,
        children = $bindable()
    } : {
        field: string,
        required: boolean,
        children: Snippet
    } = $props();
</script>


<div class="md:flex md:items-center mb-6">
    <div class="md:w-1/3">
        <label for="{field}">
            {toTitle(field)}
            {#if required}
                <span class="text-red-500">*</span>
            {/if}
        </label>
    </div>
    <div class="md:w-2/3 text-black">
        {@render children()}
    </div>
</div>
