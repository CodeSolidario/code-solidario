<section id="contato">
  <div class="bg-contact100" style="background-image: url('images/bg-01.jpg');">
    <div class="container-contact100">
      <div class="wrap-contact100">
        <div class="contact100-pic js-tilt" data-tilt>
          <img src="images/img-01.png" alt="IMG" />
        </div>
        <form
          action="https://formspree.io/f/mgerevbb"
          method="POST"
          class="contact100-form validate-form"
        >
          <span class="contact100-form-title"> Entre em contato </span>

          <div
            class="wrap-input100 validate-input"
            data-validate="Name is required"
          >
            <input
              class="input100"
              type="text"
              name="name"
              placeholder="Nome"
            />
            <span class="focus-input100" />
            <span class="symbol-input100">
              <i class="fa fa-user" aria-hidden="true" />
            </span>
          </div>

          <div
            class="wrap-input100 validate-input"
            data-validate="Valid email is required: ex@abc.xyz"
          >
            <input
              class="input100"
              type="text"
              name="email"
              placeholder="Email"
            />
            <span class="focus-input100" />
            <span class="symbol-input100">
              <i class="fa fa-envelope" aria-hidden="true" />
            </span>
          </div>

          <div
            class="wrap-input100 validate-input"
            data-validate="Message is required"
          >
            <textarea class="input100" name="message" placeholder="Menssagem" />
            <span class="focus-input100" />
          </div>

          <div class="container-contact100-form-btn">
            <button type="submit" class="contact100-form-btn"> Enviar </button>
          </div>
        </form>
      </div>
    </div>
    <div class="icons">
      <div class="row">
        <div class="col-3">
          <span
            ><a
              href="https://github.com/CodeSolidario/code-solidario"
              target="_blank"
              ><i class="fa fa-github-alt" aria-hidden="true" /></a
            ></span
          >
        </div>
        <div class="col-3">
          <span
            ><a href="https://www.facebook.com/codesolidario" target="_blank"
              ><i class="fa fa-facebook-square" aria-hidden="true" /></a
            ></span
          >
        </div>
        <div class="col-3">
          <span
            ><a
              href="https://www.linkedin.com/company/code-solid%C3%A1rio/"
              target="_blank"
              ><i class="fa fa-linkedin-square" aria-hidden="true" /></a
            ></span
          >
        </div>
        <div class="row">
          <div class="col-12">
            <p>&copy; Made by Code Solidário</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
	.icons {
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
	background-color: black;
  }
  a,
  a:hover {
    color: #fff;
    font-size: 18px;
  }
</style>
