<script lang="ts">
    import { onMount } from 'svelte';
    import { logout, lastpage, token } from "auth";
    import { postLogout } from 'client';
    import { goto } from '$app/navigation';
    import { get } from 'svelte/store';

    onMount(() => {
        postLogout({
            "body":{
                "refresh_token": get(token).refresh_token!
            }
        }).catch((error) => {
            console.error(error);
        }).finally(()=>{
            logout();
            goto($lastpage);
        })
    });
</script>
