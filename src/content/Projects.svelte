<script>
  import axios from "axios";
  import {
    repositoryStore,
    initialState,
    topics,
    pagination,
  } from "../stores/repositories";

  let repositories = [];
  repositoryStore.subscribe((_) => (repositories = _.repositories));
  const resetRepo = () => repositoryStore.set({ ...initialState });
  let filter = "";

  const fetchRepo = async () => {
    let searchUrl = `https://api.github.com/search/repositories?q=topic:open-source+topic:interesse-social`;
    if (filter) {
      searchUrl += `+topic:${filter}`;
    }
    searchUrl += `&type=Repositories&ref=searchresults&page=${$pagination.page}&per_page=${$pagination.totalPerPage}`;
    try {
      const repositories = await axios
        .get(searchUrl)
        .then((response) => {
          $pagination.totalCount = response.data.total_count;
          $pagination.totalPages = Math.ceil(
            $pagination.totalCount / $pagination.totalPerPage
          );
          return response.data.items;
        })
        .catch((err) => {
          throw new Error(err);
        });
      repositoryStore.set({ ...initialState, repositories });
      console.log($pagination);
      return repositories;
    } catch (error) {
      resetRepo();
    }
  };

  let promise = fetchRepo();
  function handleSelect() {
    promise = fetchRepo();
  }
</script>

<section id="projetos">
  <div class="content">
    <h2>Projetos</h2>
    <div class="select">
      <div class="row">
        <div class="input-group">
          <input
            type="text"
            class="form-control"
            placeholder="Problema social - Ex: desemprego"
            aria-label="Recipient's username"
            aria-describedby="basic-addon2"
            bind:value={filter}
          />
          <div class="input-group-append">
            <button
              class="btn btn-success"
              type="button"
              on:click={handleSelect}>Buscar</button
            >
          </div>
        </div>
      </div>
    </div>
    <div class="repos">
      {#await promise}
        <p>...waiting</p>
      {:then}
        <div class="row">
          {#each repositories as repo}
            <div class="card col-lg-4 col-md-6 col-sm12" style="border: none">
              <div class="card-body">
                <h5 class="card-title">
                  <a href={repo.html_url} target="_blank" class="card-link"
                    >{repo.name}</a
                  >
                </h5>
                <h6 class="card-subtitle mb-2 text-muted">{repo.language}</h6>
                <p class="card-text">
                  {repo.description ? repo.description.substring(0, 100) : ""}
                </p>
              </div>
            </div>
          {/each}
        </div>
      {:catch error}
        <p style="color: red">{error.message}</p>
      {/await}
    </div>
    <nav aria-label="Page navigation example">
      <ul class="pagination justify-content-center">
        <li class="page-item">
          <button
            class="page-link"
            aria-label="Previous"
            on:click={(($pagination.page -= 1), handleSelect)}
            disabled={$pagination.page <= 1}
          >
            <span aria-hidden="true">&laquo;</span>
            <span class="sr-only">Previous</span>
          </button>
        </li>
        <li class="page-item">
          <button
            class="page-link"
            aria-label="Next"
            on:click={(($pagination.page += 1), handleSelect)}
            disabled={$pagination.page >= $pagination.totalPages}
          >
            <span aria-hidden="true">&raquo;</span>
            <span class="sr-only">Next</span>
          </button>
        </li>
      </ul>
    </nav>
  </div>
</section>

<style>
  #projetos {
    height: auto !important;
    text-align: center;
  }
  .card-link {
    color: rgba(132, 106, 221, 1) !important;
    font-weight: bold;
    text-decoration: none;
  }
</style>
