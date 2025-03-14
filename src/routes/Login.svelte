<script>
  import I18n from "i18n-js";
  import {Card, CardSubtext, LoginButton} from "../components/guests";
  import {userLoggedIn, userRole, redirectPath} from "../stores/user";
  import {role} from "../util/role";
  import {getService} from "../util/getService";
  import {requestLoginToken, requestSAMLLoginToken} from "../api";
  import schoolbag from "../icons/school-bag.svg";
  import hand from "../icons/hand.svg";
  import catalog from "../icons/catalog.svg";
  import {onMount} from "svelte";
  import {navigate} from "svelte-routing";
  import {queryData} from "../api/graphql";

  let accountCreationStep = 1;
  let showLoginCards = true;
  let badgeInstancesCount = "?";
  let badgeClassesCount = "?";

  onMount(() => {
    if ($userRole && $userLoggedIn) {
      navigate('/')
    } else {
      queryData("query {badgeInstancesCount, badgeClassesCount}").then(res => {
        badgeInstancesCount = res.badgeInstancesCount;
        badgeClassesCount = res.badgeClassesCount;
      });
    }
  });

  const loginGeneric = () => {
    requestSAMLLoginToken();
  }


  const logIn = chosenRole => {
    $userRole = chosenRole;
    const path = $redirectPath;
    const service = getService(chosenRole);

    const urlSearchParams = new URLSearchParams(window.location.search);
    const validateName = urlSearchParams.get("validateName");
    requestLoginToken(service, validateName === "true" || path.indexOf("direct-awards") > -1);
  };

  const toggleLoginCreateAccount = () => (showLoginCards = !showLoginCards);

</script>

<style lang="scss">
  h1 {
    color: var(--black);
    font-size: 48px;
    margin-bottom: 5px;
  }

  h2 {
    color: var(--purple);
    font-size: 32px;
  }

  h4 {
    font-weight: 300;
    font-size: 18px;
    color: var(--black);
    margin: 10px 0;
  }

  div.login-info {
    font-size: 20px;
  }

  p.destination {
    color: var(--purple);
    font-weight: bold;
    margin-top: 15px;
  }

  .login-page {
    flex: 1;
    font-size: 18px;

    --login-spacing: 30px;
    padding: var(--login-spacing) calc(var(--login-spacing) + 10px);

    display: flex;
    flex-direction: column;
  }

  .login-cards {
    margin-right: calc(var(--login-spacing) * -1);

    display: flex;
    flex-wrap: wrap;
  }

  .login-element {
    flex: 1;

    position: relative;

    display: flex;
    flex-direction: column;

    min-width: 315px;
    margin-right: var(--login-spacing);
    padding-top: var(--login-spacing);
  }

  .svg-container {
    margin: 35px 0 15px 0;
  }

  .login {
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .create-account-content > * {
    margin-bottom: 20px;
    text-align: left;
  }

  .invite-only {
    display: flex;
    margin-top: 19px;
    background-color: var(--green-light);
    color: var(--black);
    border-radius: 18px;
    padding: 6px 18px;
    font-weight: bold;
    position: absolute;
    text-align: center;
    z-index: 9;
    left: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 2px 3px 4px 0 rgba(0, 0, 0, 0.67);
    font-size: 16px;

    &.beta {
      background-color: var(--yellow-medium);
      transform: translate(-50%, -180%);
    }
  }
</style>

<div class="login-page">

  <h1>{I18n.t('login.title')}</h1>
  <div class="login-info">
    <p>{I18n.t('login.description')}</p>
    <p class="destination">{I18n.t('login.destination')}</p>

  </div>

  <div class="login-cards">
    <!-- <div class="login-element">
      <div class="invite-only">
        <p>{I18n.t("login.teacher.byInviteOnly")}</p>
      </div>
      <Card outOfFocus={!showLoginCards}>
        <h2>
          {@html I18n.t('login.teacher.title')}
        </h2>
        <div class="svg-container">
          {@html hand}
        </div>
        <h4>{I18n.t('login.teacher.subtitle')}</h4>
        <LoginButton
          label={I18n.t('login.teacher.action')}
          onClick={() => logIn(role.TEACHER)}/>
      </Card>
      <CardSubtext
        hidden={!showLoginCards}
        lineOne={I18n.t('login.teacher.accountCreation.askAccount')}/>

    </div> -->


    <div class="login-element">
      <Card outOfFocus={!showLoginCards}>
        <h2>
          {@html I18n.t('login.generic.title')}
        </h2>
        <div class="svg-container">
          {@html hand}
        </div>
        <h4>{I18n.t('login.teacher.subtitle')}</h4>
        <LoginButton
          label={I18n.t('login.generic.action')}
          onClick={() => loginGeneric()}/>
      </Card>
      <CardSubtext
        hidden={!showLoginCards}
        lineOne={I18n.t('login.generic.info')}/>
    </div>


    <div class="login-element">
      <Card none={!showLoginCards}>
        <div class="invite-only beta">
          <p>{I18n.t("login.catalog.beta", {badgeClassesCount})}</p>
        </div>

        <h2>
          {@html I18n.t('login.catalog.title')}
        </h2>
        <div class="svg-container">
          {@html catalog}
        </div>
        <h4>{I18n.t('login.catalog.subtitle', {badgeInstancesCount})}</h4>
        <div class="login">
          <LoginButton
            label={I18n.t('login.catalog.action')}
            onClick={() => navigate("/catalog")}/>
        </div>
      </Card>
      <CardSubtext small={true} lineOne={I18n.t('login.catalog.info')}/>

    </div>
    <!-- <div class="login-element">
      <Card none={!showLoginCards}>
        <h2>
          {@html I18n.t('login.student.title')}
        </h2>
        <div class="svg-container">
          {@html schoolbag}
        </div>
        <h4>{I18n.t('login.student.subtitle')}</h4>
        <div class="login">
          <LoginButton
            label={I18n.t('login.student.action')}
            onClick={() => logIn(role.STUDENT)}/>

        </div>
      </Card>
      <CardSubtext small={true} lineOne={I18n.t('login.student.noEduId')}/>

    </div> -->
  </div>
</div>
