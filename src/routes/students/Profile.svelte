<script>
  import I18n from "i18n-js";
  import {onMount} from "svelte";
  import {navigate} from "svelte-routing";
  import Button from "../../components/Button.svelte";
  import {formatCreateDate, translateProperties} from "../../util/utils";
  import {deleteProfile, getProfile, getSocialAccountsSafe, withdrawTermsForBadge,} from "../../api";
  import {authToken, redirectPath, userLoggedIn, userRole} from "../../stores/user";
  import {Modal} from "../../components/forms";
  import {Spinner} from "../../components";
  import Verified from "../../components/shared/Verified.svelte";
  import {queryData} from "../../api/graphql";
  import moment from "moment";
  import {flash} from "../../stores/flash";

  export let isStudent = true;

  let profile;
  let loaded = false;
  let instititions = [];

  //Modal
  let showModal = false;
  let modalTitle;
  let modalQuestion;
  let modalAction;

  const query = `query {
    currentUser {
      validatedName,
      schacHomes,
      termsAgreements {
        entityId,
        updatedAt,
        terms {
          entityId,
          institution {
            nameDutch,
            nameEnglish,
            entityId
          },
          termsType
        },
        agreed,
        agreedVersion
      }
    }
  }`;

  onMount(() => {
    reload();
  });

  const reload = () => {
    let promises = [getProfile(), getSocialAccountsSafe()];
    if (isStudent) {
      promises.push(queryData(query));
    }
    Promise.all(promises).then(res => {
      profile = res[0];
      profile.eduid = res[1][0].eduid;
      profile.dateAdded = res[1][0].dateAdded;
      if (isStudent) {
        const currentUser = res[2].currentUser;
        if (currentUser.validatedName) {
          profile.validatedName = currentUser.validatedName;
        }
        const termAgreements = currentUser.termsAgreements;
        termAgreements.forEach(termAgreement => {
          if (termAgreement.terms.institution) {
            translateProperties(termAgreement.terms.institution);
          }
        });
        instititions = termAgreements.reduce((acc, cur) => {
          if (cur.agreed && cur.terms.institution) {
            const terms = cur.terms;
            const institution = terms.institution;
            const foundInstitution = acc.find(i => i.entityId === institution.entityId);
            if (foundInstitution) {
              foundInstitution.agreedTerms.push({
                entityId: cur.entityId,
                date: cur.updatedAt,
                type: terms.termsType,
                version: cur.agreedVersion
              });
              return acc;
            } else {
              acc.push({
                entityId: institution.entityId,
                name: institution.name,
                agreedTerms: [{entityId: cur.entityId, type: terms.termsType, version: cur.agreedVersion}]
              });
              return acc;
            }
          }
          return acc;
        }, []);
      }
      loaded = true;
    });
  };

  const withdrawPermission = (entityId, name) => {
    withdrawTermsForBadge(entityId).then(() => {
      reload();
      flash.setValue(I18n.t("profile.consentWithdrawn", {institution: name}));
    })
  };

  const deleteProfileAction = showConfirmation => () => {
    if (showConfirmation) {
      showModal = true;
      modalTitle = I18n.t("profile.deleteAccount");
      modalQuestion = I18n.t("profile.deleteAccountConfirmation");
      modalAction = deleteProfileAction(false);
    } else {
      showModal = false;
      deleteProfile().then(() => {
        $userLoggedIn = "";
        $userRole = "";
        $authToken = "";
        $redirectPath = "";
        navigate("/login?after_delete=true");
      });
    }
  };

  const eduIdValue = () => profile.eduid;

</script>

<style lang="scss">
  h1 {
    font-size: 24px;
    margin-bottom: 40px;

    &.with-border {
      margin-top: 15px;
    }
  }

  div.profile-section {
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;
  }

  h3 {
    margin-bottom: 8px;
  }

  p.account-info {
    margin-bottom: 25px;
  }

  .agreedTerm {
    display: flex;
    justify-content: space-between;
  }

  div.delete {
    margin-top: 50px;
    padding-top: 15px;
  }

  div.border {
    border-top: 4px solid var(--grey-3);
  }

</style>

{#if loaded}
  <div class="profile">
    {#if isStudent}
      <h1>{I18n.t("profile.profile")}</h1>
    {/if}
    {#if profile}
      <div class="profile"></div>
      <div class="profile-section">
        {#if !profile.validatedName}
          <h3>{I18n.t("profile.name")}</h3>
          <Verified value={`${profile.first_name} ${profile.last_name}`} fromEduID={true} showVerified={false}/>
        {/if}
        {#if profile.validatedName}
          <h3>{I18n.t("profile.validatedName")}</h3>
          <Verified value={`${profile.validatedName}`} fromEduID={false} showVerified={true}/>
        {/if}
      </div>
      <div class="profile-section">
        <h3>{I18n.t("profile.email")}</h3>
        <Verified value={profile.email} fromEduID={isStudent} showVerified={false}/>
      </div>
      {#if profile.eduid}
        <div class="profile-section">
          <h3>{I18n.t("profile.eduid")}</h3>
          <Verified value={eduIdValue()} fromEduID={true} showVerified={false}/>
        </div>
      {/if}
      <div class="profile-section">
        <h3>{I18n.t("profile.memberSince")}</h3>
        <Verified value={I18n.t("profile.memberSinceDate", formatCreateDate(profile.dateAdded))}
                  fromEduID={true} showVerified={false}/>
      </div>
    {/if}
  </div>

  {#if isStudent}
    <div class="border">
      <h1 class="with-border">{I18n.t("profile.permissionsHeader")}</h1>
      <p class="account-info">{I18n.t("profile.permissionsInfo")}</p>
      <div>
        {#if instititions.length === 0}
          <p>{I18n.t("profile.noPermissions")}</p>
        {/if}
        {#each instititions as institution}
          <div>
            <h2>{institution.name}</h2>
            {#if institution.agreedTerms.length === 0}
              <p>No permissions</p>
            {/if}
            {#each institution.agreedTerms as agreedTerm}
              <div class="agreedTerm">
                <div>
                  <h4>{agreedTerm.type === "FORMAL_BADGE" ? I18n.t(['acceptTerms', 'student', 'formalBadges']) : I18n.t(['acceptTerms', 'student', 'informalBadges'])}</h4>
                  <p>{agreedTerm.type === "FORMAL_BADGE" ? I18n.t(['acceptTerms', 'student', 'agreedOn']) : I18n.t(['acceptTerms', 'student', 'readOn'])}{moment(agreedTerm.date).format('MMM D, YYYY')}</p>
                  <p>{I18n.t(['acceptTerms', 'student', 'version'])}{agreedTerm.version}</p>
                </div>
                {#if agreedTerm.type === "FORMAL_BADGE"}
                  <div>
                    <Button action={() => withdrawPermission(agreedTerm.entityId, institution.name)}
                            text={I18n.t(['acceptTerms', 'student', 'withdrawConsent'])} disabled={false}/>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>

    <div class="delete border">
      <h3>{I18n.t("profile.deleteHeader")}</h3>
      <p class="account-info">{@html I18n.t("profile.deleteInfo1")}</p>
      <p class="account-info">{@html I18n.t("profile.deleteInfo2")} {@html I18n.t("profile.deleteInfo3")}</p>
      <p class="account-info">{@html I18n.t("profile.deleteInfo4")}</p>
      <Button secondary={true} action={deleteProfileAction(true)} text={I18n.t("profile.deleteAccount")}/>
    </div>
  {/if}
{:else}
  <Spinner/>
{/if}

{#if showModal}
  <Modal
    submit={modalAction}
    warning={true}
    cancel={() => showModal = false}
    question={modalQuestion}
    title={modalTitle}/>
{/if}
