// import { t as testController } from 'testcafe';
import { page } from '@playwright/test';
import config from '../../config';
import { retry } from '../helpers/utils';
// import backupsPage from '../pages/backups-page';
import basePage from '../pages/base-page';
// import createAccountPage from '../pages/create-account-page';
import { getResetCode } from './api/redis';
import { fetchAdminUser } from './api/user';

// export class MyPage {
// constructor() {
//   this.page = page;
// }

async function myTest() {
  console.log('TESTBLAH');
  // await page.goto('https://console.liferay.coffee');
}

// https://github.com/microsoft/playwright/issues/10358
// export async function selectValue(
//   page: Page,
//   buttonSelector: string,
//   dataValue: string,
// ) {
//   await page.click(buttonSelector);
//   await page.click(`li[role="option"][data-value="${dataValue}"]`);
// }

/**
 * Navigate to a console page via its friendly URL.
 *
 * @param {string} friendlyUrl FriendURL for console page.
 */
async function navigateToConsolePage(
  friendlyUrl,
  { pageLoadTimeout = 10000 } = {},
) {
  // this.page = page;
  await page.goto(config.consoleUrl + friendlyUrl);
  // await retry(3, 3000, async () => {
  //   // const page = new Page(page);
  //   // await testController.navigateTo(config.consoleUrl + friendlyUrl);
  //   console.log(config.consoleUrl + friendlyUrl)
  //   await page.goto(config.consoleUrl + friendlyUrl);
  // });

  await basePage.waitForLoadingBar();

  await basePage.waitForSkeletons({ timeout: pageLoadTimeout });
}

/**
 * Navigate to an accounts page.
 *
 * @param {string} page Accounts page (profile|alerts-preferences).
 */
async function navigateToAccountsPage(page) {
  await navigateToConsolePage(`/account/${page}`);
}

/** Navigate to the alerts page. */
async function navigateToAlertsPage() {
  await navigateToConsolePage('/alerts');
}

/**
 * Get reset code and navigate to change password page.
 *
 * @param {string} testerEmail User email.
 */
async function navigateToChangePasswordPage(testerEmail) {
  await navigateToConsolePage('/password/reset');

  await testController.typeText(createAccountPage.emailInput, testerEmail);

  await basePage.clickBtn('Send Reset Instructions');

  const user = await fetchAdminUser(testerEmail);

  let resetCode;
  await retry(10, 5000, async () => {
    resetCode = await getResetCode(user.id);
  });

  await navigateToConsolePage(
    `/password/change?code=${resetCode}&email=${testerEmail}`
  );
}

/**
 * Navigate to environments list page.
 *
 * @param {string} projectId Project ID.
 */
async function navigateToEnvironmentsListPage(projectId) {
  await navigateToConsolePage(`/projects/${projectId}`);
}

async function navigateToProjectBackupsPage(projectId, backupsTab = '') {
  await navigateToProjectPage(projectId, `backups/${backupsTab}`, {
    pageLoadTimeout: 120000,
  });

  await backupsPage.waitForPageToLoad();
}

/** Navigate to the projects list page. */
async function navigateToProjectListPage() {
  await navigateToConsolePage('/projects/');
}

/**
 * Navigate to a project page.
 *
 * @param {string} projectId Project id.
 * @param {string} page      Project page.
 */
async function navigateToProjectPage(
  projectId,
  page,
  { pageLoadTimeout = 10000 } = {}
) {
  await navigateToConsolePage(`/projects/${projectId}/${page.toLowerCase()}`, {
    pageLoadTimeout,
  });
}

/**
 * Navigate to a project secret page.
 *
 * @param {string} projectId Project id.
 * @param {string} page      Secret page.
 */
async function navigateToProjectSecretPage(projectId, secretName, page) {
  await navigateToConsolePage(
    `/projects/${projectId}/settings/secrets/${secretName}/${page.toLowerCase()}`
  );
}

/**
 * Navigate to a service page.
 *
 * @param {string} projectId Project id.
 * @param {string} serviceId Service id.
 * @param {string} page      Service page.
 */
async function navigateToProjectServicePage(
  projectId,
  serviceId,
  page,
  { pageLoadTimeout = 10000 } = {}
) {
  await navigateToConsolePage(
    `/projects/${projectId}/services/${serviceId}/${page}`,
    { pageLoadTimeout }
  );
}

/**
 * Navigate to a logs page with filter service.
 *
 * @param {string} projectId Project id.
 * @param {string} serviceId Service id.
 */
async function navigateToLogsWithFilteredService(
  projectId,
  serviceId,
  { pageLoadTimeout = 10000 } = {}
) {
  await navigateToConsolePage(
    `/projects/${projectId}/logs?logServiceId=${serviceId}`,
    { pageLoadTimeout }
  );
}

/**
 * Navigate to a monitoring page with filter service.
 *
 * @param {string} projectId Project id.
 * @param {string} serviceId Service id.
 */
async function navigateToMonitoringWithFilteredService(projectId, serviceId) {
  await navigateToConsolePage(
    `/projects/${projectId}/monitoring/metrics?serviceId=${serviceId}`
  );
}

module.exports = {
  navigateToAccountsPage,
  navigateToAlertsPage,
  navigateToChangePasswordPage,
  navigateToConsolePage,
  navigateToEnvironmentsListPage,
  navigateToLogsWithFilteredService,
  navigateToMonitoringWithFilteredService,
  navigateToProjectBackupsPage,
  navigateToProjectListPage,
  navigateToProjectPage,
  navigateToProjectSecretPage,
  navigateToProjectServicePage,
};
