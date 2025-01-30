<script lang="ts">
    import { MultiSelect, type MultiSelectEvents } from 'svelte-multiselect'

    type Props = {
        selected: string[],
        options: string[]
    } & MultiSelect<string>['props'];

    let {selected = $bindable(), options, ...rest } : Props = $props();

    function addGroupParenthood(e: MultiSelectEvents['add']){
        let added = (e.detail.option as string);
        for(const v of options){
            if (v != added && v.includes(added)){
                selected.push(v)
            }
        }
    }

    function removeGroupParenthood(e: MultiSelectEvents['remove']){
        let removed = (e.detail.option as string);
        for(const v of selected){
            if(v != removed && removed.includes(v)){
                selected = (selected as string[]).filter(item => item !== v)
            }
        }
    }
</script>


<MultiSelect options={options} bind:selected {...rest}
    outerDivClass="relative border border-gray-300 flex items-center rounded-lg gap-2 dark:border-gray-600 ring-primary-500 dark:ring-primary-500 focus-visible:outline-none px-4 py-2 min-h-[3.2rem] w-3/4 focus-within:ring-1 focus-within:border-primary-500 dark:focus-within:border-primary-500"
    liSelectedClass="overflow-x-hidden text-sm bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    ulSelectedClass="overflow-x-hidden"
    on:add={addGroupParenthood}
    on:remove={removeGroupParenthood}
/>
