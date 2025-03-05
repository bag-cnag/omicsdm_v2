export const ssr = false;
export const csr = true;
export const prerender = false;
import { endpoint } from '$lib/config';
import { client, getLogin, type Error } from 'client';
import { get } from 'svelte/store'
import { refresh, token, expires } from 'auth';
import { isEmpty } from '$lib/types/obj';


// Set server url
client.setConfig({
    baseUrl: endpoint,
});


// Set token middleware
client.interceptors.request.use(async (request, options) => {
    if (!isEmpty(get(token))){
        if(Date.now() > get(expires)) // refresh token
            await refresh()
        request.headers.set('Authorization', 'Bearer ' + get(token).access_token);
    }
    return request;
});


// Redirect to login in case it is required
client.interceptors.response.use(async (response, request, options) => {
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
