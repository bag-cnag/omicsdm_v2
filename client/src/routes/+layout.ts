export const ssr = false;
export const csr = true;
export const prerender = "auto";


import { client, getLogin, type Error } from 'client';
import { refresh, token, expires } from 'auth';
import { isEmpty } from '$lib/types/obj';
import { get } from "svelte/store";
import type { LayoutLoad } from './$types';
import { setConfig } from 'config';


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
    if (response.status == 511 && window.location.href !== window.location.origin + '/'){
        const url = (await getLogin({ // TODO: use store if possible.
            query: {
              redirect_uri: window.location.origin + "/login"
            }
        })).data;
        const content: Error = await response.clone().json()
        if(content.message.includes('Authentication required.')){
            window.location.assign(url!);
        }
    }
    return response;
})
