<!-- <script>
    import IconContainer from "./IconContainer.svelte";
    const {...rest} = $props();
</script>

<IconContainer {...rest}>
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
</IconContainer> -->
<script lang="ts">
    import { onMount } from "svelte";

    let { cclass } : { cclass?: string | null } = $props();
    let appclass = $state("w-6 h-6 ");

    onMount(()=>{
        if (cclass){
            appclass += cclass;
        } else {
            appclass += "text-gray-800 dark:text-white";
        }
    })
</script>


<svg class={appclass} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
</svg>
