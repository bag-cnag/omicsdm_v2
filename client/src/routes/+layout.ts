export const ssr = false;
export const csr = true;
// export const prerender = "auto";
export const prerender = true;
export const trailingSlash = 'always';


import { client, getLogin, type Error } from 'client';
import { refresh, token, expires } from 'auth';
import { isEmpty } from '$lib/types/obj';
import { get } from "svelte/store";
import type { LayoutLoad } from './$types';
import { setConfig } from 'config';
import { base } from '$app/paths';


export const load: LayoutLoad = async () => {
	if (typeof window !== 'undefined') {
        setConfig(window.config);
    }
};


// Set token middleware
client.interceptors.request.use(async (request) => {
    if (!isEmpty(get(token))){
        if(Date.now() > get(expires)) // refresh token
            await refresh()
        request.headers.set('Authorization', 'Bearer ' + get(token).access_token);
    }
    return request;
});


// Redirect to login in case it is required
client.interceptors.response.use(async (response) => {
    if (response.status == 511 && window.location.href !== window.location.origin + base + '/'){
        const url = (await getLogin({ // TODO: use store if possible.
            query: {
              redirect_uri: window.location.origin + base + "/login/"
            }
        })).data;
        const content: Error = await response.clone().json()
        if(
            content.message.includes('Authentication required.') ||
            content.message.includes('Refresh token missing.') ||
            content.message.includes('Invalid refresh token.')
        ){
            window.location.assign(url!);
        }
    }
    return response;
})
