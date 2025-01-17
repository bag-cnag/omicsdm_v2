<script lang="ts">
    import InputContainer from './InputContainer.svelte';
    let { schema, field, value = null } = $props();

    const input_type = (() => {
        switch (schema.properties[field].type){
        case "string":
            return "text"
        case "integer":
        case "float":
            return "number"
        case "boolean":
            return "checkbox"
        }
    })()
    const required = (schema.required).includes(field) && input_type != "checkbox"
    const checked = (input_type == "checkbox" && value == true)
</script>


<InputContainer {field} {required}>
    <input
        id="{field}" name="{field}"
        class="w-3/4 text-black"
        type={input_type}
        required={ required || null}
        checked={ checked || null}
        value={value}
    />
</InputContainer>
