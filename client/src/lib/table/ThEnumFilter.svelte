<script lang="ts">
    import { capitalizeFirstLetter } from "$lib/types/str";
    import type { TableHandler } from "@vincjo/datatables/server";

    let {
        table,
        field,
        options,
    } : {
        table: TableHandler<any>,
        field: string,
        options: string[],
    } = $props()

    const filter = table.createFilter(field);
</script>

<style>
    .dt-enum-filter {
        border-bottom: 1px solid var(--grey, #e0e0e0);
        border-top: 0px;
        border-left: 0px;
        border-right: 0px;
        background: inherit;
        font-size: 14px;
        font-family: Arial, Helvetica, sans-serif;
        line-height: 1em;
    }


    .dt-enum-filter-select {
        background: inherit;
        outline: none;
        border: none;
        border-radius: 0;
        font-size: 14px;
        font-family: Arial, Helvetica, sans-serif;
        line-height: 1em;
    }

    .dt-enum-filter-select:invalid {
        color: var(--grey, #bdbdbd);
    }

    .dt-enum-filter-select:valid {
        color: var(--font-grey, #757575);
    }

    .dt-enum-filter-select::before::after {
        box-sizing: border-box;
        border-width: 0;
        border-style: solid;
        border-color: #E5E7EB;
    }
</style>

<th class="dt-enum-filter">
    <select required class="dt-enum-filter-select w-full"
        oninput={(e) => {
            filter.value = (e.target! as HTMLSelectElement).value;
            filter.set();
        }}
    >
        <option selected value={""} style="color: var(--grey, #bdbdbd);">- Filter -</option>
        {#each options as opt}
            <option value="{opt}">{capitalizeFirstLetter(opt)}</option>
        {/each}
    </select>
</th>
