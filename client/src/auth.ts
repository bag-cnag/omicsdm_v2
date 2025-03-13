import { writable, get } from "svelte/store";
import { persisted } from 'svelte-persisted-store'
import { browser } from "$app/environment"
import { type GetSynAckResponse, type ListGroup, postRefresh } from './client';


export const isAuthenticated = persisted<boolean>('ls_isAuthenticated', false);
export const token = persisted<GetSynAckResponse>('ls_token', {});
export const user = persisted<string>('ls_user', "anon");
export const groups = persisted<Array<string>>('ls_groups', []);
export const expires = persisted<number>('ls_expires', -1);


export const logout = () => {
    token.set({})
    user.set("anon")
    groups.set([])
    isAuthenticated.set(false)
}


export const lastpage = writable(browser && localStorage.getItem("lastpage") || "/")
lastpage.subscribe((val) => {
    if (browser) return (localStorage.lastpage = val)
})


export const setexpires = (val: number) => {
    // Val, delta in seconds, should be greater than 2
    expires.set(Date.now() + ((val - 5) * 1000));
}


export const checkGroups = (lg: ListGroup | undefined) => {
    if (!get(isAuthenticated)) // user not logged in
        return false;
    if (!lg || !lg.groups) // empty list
        return true;
    if (get(groups).includes("admin")) // not empty, user is admin
        return true;
    for(const allowed_group of lg.groups){ // group path matching
        for(const user_group of get(groups)){
            if (user_group.includes(allowed_group.path!))
               return true;
        }
    }
    return false; // No match
}


export const refresh = async () =>{
    let refresh_token = get(token).refresh_token!;
    // void before requesting
    token.set({});
    let response = await postRefresh({
        body: {
            refresh_token: refresh_token
        }
    });

    if (response.response.ok){
        token.set(response.data!);
        setexpires(response.data!.expires_in!);
    } else {
        logout();
        console.error(new Error(response.error?.message));
    }
}
