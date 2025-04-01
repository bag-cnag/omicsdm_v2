<script lang="ts">let { table, field, check = undefined } = $props();
    const filter = table.createFilter(field, check);
    export {};
</script>

<style>
    th {
        border-bottom: 1px solid var(--grey, #e0e0e0);
    }
    input {
        width: 100%;
        height: 24px;
        border: none;
        text-align: left;
        padding: 0 20px;
        background: inherit;
        outline: none;
        border-radius: 0;
        font-size: 14px;
        color: var(--font-grey, #757575);
        font-family: Arial, Helvetica, sans-serif;
    }
    input::placeholder {
        color: var(--grey, #bdbdbd);
        font-size: 13px;
    }
    input:focus {
        outline: none;
        border: none;
    }
</style>


<th>
    <span class="tail">
    <input
        type="text"
        placeholder={table.i18n.filter}
        spellcheck="false"
        bind:value={filter.value}
        oninput={() => filter.set()}
    />
    <button>x</button>
    </span>
</th>
