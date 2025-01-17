export const ssr = false;
export const csr = true;
export const prerender = false;
import { endpoint } from '$lib/config';
import { client, getLogin } from 'client/services.gen';
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
    if (response.status == 511){
        if(window.location.href !== window.location.origin + '/'){
            let url = (await getLogin({
                    query: {
                      redirect_uri: window.location.origin + "/login"
                    }
                })).data;
            window.location.assign(url!);
        }
    }
    return response;
})
