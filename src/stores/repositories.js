import { writable } from 'svelte/store';


export const initialState = {
    repositories: []
}

export const pagination = writable({
    page: 1,
    totalPages: 1,
    totalCount: 1,
    totalPerPage: 10
})

export const topics = writable([
    {name:"emprego"}, {name: "ambiental"}, {name:"educacao"}, {name:"seguranca"}, {name:"saude"}, {name: "saneamento"}, {name:"animais"}
])

export const repositoryStore = writable(initialState);