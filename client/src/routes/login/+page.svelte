<script lang="ts">
    import { getSynAck, getAuthenticated } from "client";
    import { onMount } from 'svelte';
    import { isAuthenticated, token, user, groups, lastpage, setexpires } from "auth";
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';

    async function login(code: string){
        getSynAck({
            query: {
                    code: code,
                    redirect_uri: window.location.origin + window.location.pathname
                }
        }).then(async response => {
            if (response.response.ok){
                isAuthenticated.set(true)
                token.set(response.data!)
                setexpires(response.data!.expires_in!)
                let user_info = await getAuthenticated()
                if (user_info.response.ok){
                    user.set(user_info.data!.username!)
                    groups.set(user_info.data!.groups!)
                    goto($lastpage)
                } else {
                    return new Error(user_info.response.statusText)
                }
            } else {
                return new Error(response.response.statusText)
            }
        }).catch(error => {
            return new Error(error)
        })
    }

    onMount(async () => {
        if (!$page.url.searchParams.has('code')){
            goto($lastpage)
        }
        await login($page.url.searchParams.get('code')!)
    });
</script>
