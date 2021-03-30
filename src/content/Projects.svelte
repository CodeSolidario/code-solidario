<script>
    import axios from "axios"

import { repositoryStore, initialState, topics } from '../stores/repositories'
let repositories = []
repositoryStore.subscribe( _ => ( repositories = _.repositories ))
const resetRepo = () => repositoryStore.set({ ...initialState })
let filter = '';
const fetchRepo = async () => {
    let searchUrl = `https://api.github.com/search/repositories?q=topic:codesolidario`;
    if (filter) {
        searchUrl += `+topic:${filter}`
    }
    searchUrl += `&type=Repositories&ref=searchresults`;
    try {
        const repositories = await axios.get(searchUrl)
        .then(response => {
            return response.data.items;
        })
        .catch(err => {
            throw new Error(err);
        })
        repositoryStore.set({ ...initialState, repositories })
        console.log(repositories)
        return repositories;
    } 
    catch (error) {
        resetRepo();
    }
}

let promise = fetchRepo();
function handleSelect(){
    promise = fetchRepo();
}
</script>
<section id="projetos">Section projetos

    <select class="form-select" aria-label="Default select example" bind:value={filter} on:blur={handleSelect}>
        <option selected value="">Open this select menu</option>
        {#each $topics as topic}
        <option value={topic.name}>{topic.name}</option>
        {/each}
      </select>
{#await promise}
	<p>...waiting</p>
{:then number}
<ul>
	{#each repositories as repo}
        <div class="card" style="width: 18rem;">
            <div class="card-body">
              <h5 class="card-title"> <a href={repo.html_url} target="_blank" class="card-link">{repo.name}</a></h5>
              <h6 class="card-subtitle mb-2 text-muted">{repo.language}</h6>
              <p class="card-text">{repo.description ? repositories.description: ''}</p>
            </div>
          </div>
	{/each}
</ul>
{:catch error}
	<p style="color: red">{error.message}</p>
{/await}
</section>

<style>
    #projetos{
        padding-top: 100px;
        height: 100vh;
    }
</style>