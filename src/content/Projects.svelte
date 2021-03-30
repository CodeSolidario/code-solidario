<script>
    import axios from "axios"

import { repositoryStore, initialState } from '../stores/repositories'

const resetRepo = () => repositoryStore.set({ ...initialState })

const fetchRepo = async () => {
    try {
        const { data:repositories } = await axios.get(`https://api.github.com/search/repositories?q=topic:emprego&type=Repositories&ref=searchresults`)
        repositoryStore.set({ ...initialState, repositories })
        console.log(repositories)
        return repositories;
    } 
    catch (error) {
        resetRepo();
    }
}

console.log(fetchRepo())
</script>
<section id="projetos">Section projetos</section>

<style>
    #projetos{
        height: 100vh;
    }
</style>