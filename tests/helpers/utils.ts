import basePage from '../pages/base-page';

// const getCurrentUrl = ClientFunction(() => window.location.href);
// const getCurrentUrl = async (page) => {
//   const currentUrl = await page.url(() => document.location.href);

//   return currentUrl;
// };
// async function getCurrentUrl(page) {
//   const currentUrl = await page.url();

//   return currentUrl;
// }
  // const getCurrentUrl = async () => {
  //   const currentUrl = await page.url();

  //   return currentUrl;
  // }

/**
 * Asserts an error message does not appear in the browsers console.
 *
 * @param {string} message Error message to be checked.
 */
async function assertConsoleErrorDoesNotExist(message) {
  const browserConsole = await testController.getBrowserConsoleMessages();

  for (let i = 0; i < browserConsole.error.length; i++) {
    await testController.expect(browserConsole.error[i]).notContains(message);
  }
  return;
}

/** @returns {Object} */
async function getCurrentUrlParams() {
  const currentUrl = await getCurrentUrl();
  const urlObject = new URL(currentUrl);

  const searchParams = Array.from(urlObject.searchParams.entries());

  return searchParams.reduce((acc, [key, val]) => {
    acc[key] = val;
    return acc;
  }, {});
}

/**
 * Checks if current url includes or ends with url string.
 *
 * @param {string} url                String to be checked.
 * @param {object} [options]          Additional options.
 * @param {string} [options.strategy] URL assertion strategy (contains|endsWith)
 *     Default is `'endsWith'`
 * @param {number} [options.tries]    Number of tries to assert URL Default is `10`
 */
async function assertCurrentUrl(
  url,
  { strategy = 'endsWith', tries = 10 } = {}
) {
  await basePage.waitForLoadingBar();

  await retry(tries, 1000, async () => {
    const currentUrl = await getCurrentUrl();

    let action, urlMatch;

    if (strategy === 'endsWith') {
      action = 'end with';
      urlMatch = currentUrl.endsWith(url);
    }

    if (strategy === 'contains') {
      action = 'contain';
      urlMatch = currentUrl.includes(url);
    }

    await testController
      .expect(urlMatch)
      .ok(`Current URL ${currentUrl} does not ${action} ${url}`);
  });
}

/**
 * Assert link contains expected URL and query parameters.
 *
 * @param {string} targetLink Link to be validated.
 * @param {string} url        Expected URL.
 */
async function assertUrlContainsQueryParams(targetLink, url) {
  await basePage.waitForLoadingBar();

  const [expectedUrl, queryParamsListFromExpectedUrl] = url.split('?');

  await testController.expect(targetLink).contains(expectedUrl);

  const queryParamsFromExpectedUrl = queryParamsListFromExpectedUrl.split('&');

  for (let i = 0; i < queryParamsFromExpectedUrl.length; i++) {
    await testController
      .expect(targetLink)
      .contains(
        queryParamsFromExpectedUrl[i],
        `Query param ${queryParamsFromExpectedUrl[i]} not found in URL ${targetLink}`
      );
  }
}

/**
 * Generate random project id. Use for provisioned projects.
 *
 * @returns {string} Project Id.
 */
function randomDxpProjectId() {
  return `dxpqa${Math.random().toString(36).substring(2)}`;
}

/**
 * Generate random environment id.
 *
 * @returns {string} Random environment Id.
 */
function randomEnvironmentName() {
  return Math.random().toString(36).substring(7);
}

/**
 * Generate random project id.
 *
 * @returns {string} Project Id.
 */
function randomProjectId() {
  return `qatc${Math.random().toString(36).substring(2)}`;
}

/**
 * Generate random user email.
 *
 * @returns {string} User email.
 */
function randomUserEmail() {
  return `${randomProjectId()}@test.com`;
}

/**
 * Returns first and last name based on user email.
 *
 * @param   {string} email    User Email.
 * @param   {string} lastName User's last name. Defaults to 'Tester'
 * @returns
 */
async function getFirstAndLastName(email, lastName = 'Tester') {
  const lowercaseFirstName = email.split('@')[0];
  const firstName =
    lowercaseFirstName.charAt(0).toUpperCase() + lowercaseFirstName.slice(1);
  return {
    firstName,
    lastName,
  };
}

/**
 * Retry an asynchronous function, pausing between each attempt.
 *
 * @param {number}   tries   Number of tries.
 * @param {number}   timeout Time in ms to wait between tries.
 * @param {function} retryFn Async function to retry.
 */
async function retry(tries, timeout, retryFn) {
  for (let i = 0; i < tries; i++) {
    try {
      await retryFn();
      return;
    } catch (error) {
      if (i === tries - 1) {
        throw error;
      }

      await sleep(timeout);
    }
  }
}

/**
 * Retry assertions, reloading page between each try.
 *
 * @param {number}   tries   Number of tries.
 * @param {function} retryFn Async function to retry.
 *     Function should contain at least one assert.
 */
// async function retryWithRefresh(tries, retryFn) {
//   // const url = await getCurrentUrl();
//   this.page = page;
//   const url = page.url();


//   for (let i = 0; i < tries; i++) {
//     try {
//       await retryFn();
//       return;
//     } catch (error) {
//       if (i === tries - 1) {
//         throw error;
//       }

//       await page.goto(url);
//     }
//   }
// }

/**
 * Stop and restore the execution after some time.
 *
 * @param   {number}  ms Time to sleep.
 * @returns {Promise}    Returns a Promise which will be resolved after the
 *     sleep timeout to pass.
 */
async function sleep(ms) {
  return new Promise((done) => setTimeout(done, ms));
}

/**
 * @param {number} [params.times]   Number of times to sleep indicated minutes.
 * @param {number} [params.minutes] Sleep interval in minutes.
 */
async function sleepAndLog({ times, minutes = 1 }) {
  console.log(`Starting to wait for total of ${times * minutes} minutes`);
  for (let i = 0; i < times; i++) {
    await sleepInMinutes(minutes);
    console.log(`Finished waiting for ${(i + 1) * minutes} minutes`);
  }
}

/**
 * Stop and restore the execution after given time in minutes.
 *
 * @param   {number}  minutes Time to sleep.
 * @returns {Promise}         Returns a Promise which will be resolved after the
 *     sleep timeout to pass.
 */
async function sleepInMinutes(minutes) {
  let amount = minutes * 60000;
  return new Promise((done) => setTimeout(done, amount));
}

const explicitErrorHandler = () => {
  window.addEventListener('error', (e) => {
    if (
      e.message ===
        'ResizeObserver loop completed with undelivered notifications.' ||
      e.message === 'ResizeObserver loop limit exceeded'
    ) {
      e.stopImmediatePropagation();
    }
  });
};

/**
 * @param   {string} remote
 * @returns        String representing the remote environment. (i.e. liferay.st -> st)
 */
async function mapRemoteToEnvironmentName(remote) {
  const regularRegex = new RegExp('^liferay\\.([a-z]+)$');
  const resultsOfRegularEnv = regularRegex.exec(remote);

  if (resultsOfRegularEnv) {
    const [, env] = resultsOfRegularEnv;
    return env;
  }

  const sandboxRegex = new RegExp('^([a-z0-9]+)\\.liferay\\.([a-z]+)$');
  const resultsOfSandbox = sandboxRegex.exec(remote);

  if (resultsOfSandbox) {
    const [, env] = resultsOfSandbox;
    return `${env}.sh`;
  }

  if (remote == 'liferaycloud.dev') {
    return 'localdev';
  }

  throw Error(`Unrecognized remote provided: ${remote}`);
}

module.exports = {
  assertConsoleErrorDoesNotExist,
  assertCurrentUrl,
  assertUrlContainsQueryParams,
  // getCurrentUrl,
  getCurrentUrlParams,
  getFirstAndLastName,
  mapRemoteToEnvironmentName,
  randomDxpProjectId,
  randomEnvironmentName,
  randomProjectId,
  randomUserEmail,
  retry,
  // retryWithRefresh,
  sleep,
  sleepAndLog,
  sleepInMinutes,
  explicitErrorHandler,
};