<script lang="ts">
    import { type Dataset } from "client";
    export var dataset: Partial<Dataset> = {};
</script>

<div class="flex flex-wrap -mr-2 text-sm text-gray-500 dark:text-gray-400">
    <!-- <div class="md:flex md:items-center mb-6 w-full">
        <div class="md:w-1/2 h-full bg-gray-50">
            <h1>{dataset.short_name}</h1>
            <h2>{dataset.long_name}</h2>
            <p>{dataset.description}</p>        
        </div>
        <div class="md:w-1/4"></div>
        <div class="md:w-1/4 h-full bg-gray-50">
            <h1>plop</h1>
        </div>
    </div> -->
    <div class="w-2/3 mr-2 text-sm text-gray-500 dark:text-gray-400">
        <h1>{dataset.short_name} - v{dataset.version}</h1>
        <h2>{dataset.long_name}</h2>
        <p>{dataset.description}</p>
    </div>
    <div class="w-1/3 mr-2 text-sm text-gray-500 dark:text-gray-400">
    </div>
</div>
