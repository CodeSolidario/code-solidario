<!-- <div class="push"></div> -->
<div id="footer">
  <p>
    <!-- svelte-ignore a11y-missing-content -->
    <button><a href="#home" class="btn-scroll" /></button>
  </p>
  <div class="row">
    <div class="col-3">
      <span><a href="https://github.com/CodeSolidario/code-solidario" target="_blank"><i class="fa fa-github-alt" aria-hidden="true"></i></a></span>
    </div>
    <div class="col-3">
      <span><a href="https://www.facebook.com/codesolidario" target="_blank"><i class="fa fa-facebook-square" aria-hidden="true"></i></a></span>
    </div>
    <div class="col-3">
      <span><a href="https://www.linkedin.com/company/code-solid%C3%A1rio/" target="_blank"><i class="fa fa-linkedin-square" aria-hidden="true"></i></a></span>
    </div>
    <div class="row">
      <div class="col-12">
        <p>&copy; Made by Code Solidário</p>
      </div>
    </div>
  </div>
</div>

<style>
  /* .push {
    background-color: #000;
    height: 50px;
  } */
  #footer {
    color: #fff;
    background-color: #000;
    height: 100px;
    left: 0;
    z-index: -1;
    padding-top: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  /* .row {
    display: flex;
    align-items: center;
    justify-content: center;
  } */
  a, a:hover {
    color: #fff;
    font-size: 18px;
  }
</style>
