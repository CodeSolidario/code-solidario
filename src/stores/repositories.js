import { writable } from 'svelte/store';


export const initialState = {
    repositories: []
}

export const repositoryStore = writable(initialState);