
import { writable } from 'svelte/store';

type Config = {
    endpoint: string;
    retries: number;
    chunkSize: number;
};


const config = writable<Config>();


export const setConfig = (data: Config) => {
    config.set(data);
}


export default config;