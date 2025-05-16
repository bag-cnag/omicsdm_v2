import { getLogin } from "client";
import { get } from "svelte/store";
import { persisted } from 'svelte-persisted-store'
import { base } from '$app/paths';


const _login_url = persisted<string>('ls_login_url', '');
const redirect_uri = window.location.origin + base + "/login/";


export async function loginUrl(): Promise<string> {
    var url = get(_login_url)
    if (url){
        return url;
    } else {
        const response = await getLogin({
            query: {
              redirect_uri: redirect_uri
            }
        })
        if(response.response.ok){
            _login_url.set(response.data!); 
            return (response.data as string);
        }
        throw new Error("Could not fetch login url");
    }
}
