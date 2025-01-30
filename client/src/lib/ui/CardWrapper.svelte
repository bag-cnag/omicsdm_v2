<script>
    import { Card } from 'flowbite-svelte';

    const {children, ...rest } = $props();

    export { children };
</script>

<Card {...rest}>{@render children()}</Card>
