<script lang="ts">
    import { onMount } from "svelte";

    let { cclass } : { cclass?: string | null } = $props();
    let appclass = $state("w-6 h-6");

    onMount(()=>{
        if (cclass){
            appclass += cclass;
        } else {
            appclass += "text-gray-800 dark:text-white";
        }
    })
</script>

<svg class={appclass} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path fill-rule="evenodd" clip-rule="evenodd" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m8 10 4 4 4-4"/>
</svg>
  