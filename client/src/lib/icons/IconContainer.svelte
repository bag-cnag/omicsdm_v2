<script lang="ts">
    import { onMount, type Snippet } from "svelte";

    let { cclass, children } : { cclass?: string | null, children: Snippet } = $props();
    let appclass = $state("w-6 h-6 ");

    onMount(()=>{
        if (cclass){
            appclass += cclass;
        } else {
            appclass += "text-gray-800 dark:text-white";
        }
    })
</script>

<svg class={appclass} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    {@render children()}
</svg>
