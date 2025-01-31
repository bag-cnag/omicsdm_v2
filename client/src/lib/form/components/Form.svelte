<script lang="ts">
    import type { Snippet } from "svelte";
    import type { EventHandler } from "svelte/elements";

    let {
        btnText,
        onsubmit,
        children,
        ...rest
    } : {
        btnText: string,
        onsubmit?: EventHandler,
        children?: Snippet
    } = $props();
</script>

<form class="p-3 w-2/3" onsubmit={onsubmit} {...rest}>
    <div class="text-white bg-green-500 rounded-md w-1/3 successMessages"></div>
    <div class="p-3 successMessagesFiller"><p>&nbsp;</p></div>

    {@render children?.()}

    <div class="md:flex md:items-center mb-6"> 
        <div class="md:w-2/3"></div>
        <div class="md:w-1/3">
          <button type="submit">{btnText}</button>
        </div>
    </div>

    <div class="text-red-500 errorMessages"></div>
</form>
