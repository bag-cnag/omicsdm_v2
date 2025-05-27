import { version } from '$app/environment';
import { writable } from 'svelte/store';
import { persisted } from 'svelte-persisted-store';


type Config = {
    endpoint: string;
    retries: number;
    chunkSize: number;
};


export const stored_version = persisted<string>('ls_stored_version', version);


const config = writable<Config>();


export const setConfig = (data: Config) => {
    config.set(data);
}


export default config;