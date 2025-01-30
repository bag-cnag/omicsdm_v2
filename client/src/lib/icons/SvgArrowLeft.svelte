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
    <path transform="scale (-1, 1)" transform-origin="center" fill-rule="evenodd" d="M3 4a1 1 0 0 0-.822 1.57L6.632 12l-4.454 6.43A1 1 0 0 0 3 20h13.153a1 1 0 0 0 .822-.43l4.847-7a1 1 0 0 0 0-1.14l-4.847-7a1 1 0 0 0-.822-.43H3Z" clip-rule="evenodd"/>
</svg>
