import axios from 'axios';

import config from '../../../config';
import { randomUserEmail, sleep } from '../utils';
import { formatApiError, retryApi } from './api-utils';
import { getTeamuserApiToken } from './auth';

/**
 * Add a supported scope to user.
 *
 * @param {string} scope     SupportedScope to give to the user.
 * @param {string} userEmail User email.
 */
async function addSupportedScope(scope, userEmail) {
  const user = await fetchAdminUser(userEmail);
  let currentScope = user.supportedScopes;

  if (currentScope.includes(scope)) {
    return;
  }

  currentScope.push(scope);

  await updateUser(user.id, { supportedScopes: currentScope });
}

/**
 * Asserts that user does not exist. Keeps retrying assert until timeout is reached.
 *
 * @param   {string} userEmail        User email.
 * @param   {number} [timeoutSeconds] Max number of seconds to keep retrying.
 * @returns
 */
async function assertNoUser(userEmail, { timeoutSeconds = 10 } = {}) {
  const retryInterval = 5;
  const maxTries = Math.floor(timeoutSeconds / retryInterval);
  let exists = true;
  let tries = 0;

  for (;;) {
    tries++;
    if (tries > maxTries) {
      throw new Error(`User ${userEmail} exists`);
    }

    exists = await userExists(userEmail);

    if (!exists) return;

    await sleep(retryInterval * 1000);
  }
}

/**
 * Create test user.
 *
 * @returns {object} Returns the created test user.
 */
async function createTestUser(planId = 'premium') {
  const userEmail = randomUserEmail();
  const firstName = userEmail.split('@')[0];

  const userDetails = {
    firstName: firstName,
    lastName: 'Tester',
    email: userEmail,
    isConfirmed: true,
  };

  let user;

  await retryApi(3, async () => {
    user = await createUser(userDetails);
  });

  await retryApi(3, async () => {
    await updateUserPlan(user.id, planId);
  });

  return user;
}

/**
 * Create a generic user.
 *
 * @param   {Object}  user               User to be created.
 * @param   {string}  user.firstName     First name of the user.
 * @param   {string}  user.lastName      Last name of the user.
 * @param   {string}  user.email         Email address of the user.
 * @param   {boolean} [user.isConfirmed] Whether the created user is confirmed.
 * @returns {Object}                     User object.
 */
async function createUser({ firstName, lastName, email, isConfirmed }) {
  let data = {
    email,
    firstName,
    lastName,
    password: config.tester.pw,
  };

  if (isConfirmed) {
    data.confirmed = '';
  }

  let response, user;

  try {
    response = await axios({
      method: 'post',
      url: `${config.apiGatewayUrl}/user/create`,
      data: data,
    });
    user = response.data;
  } catch (error) {
    await deleteUser(email);
    throw new Error(formatApiError(error, 'Failed to create user'));
  }

  return user;
}

/**
 * Delete a user by ID or email address.
 *
 * @param {string} userIdentifier User identifier; may be the user's email address or ID.
 */
async function deleteUser(userIdentifier) {
  let id = userIdentifier;

  if (userIdentifier.includes('@')) {
    const user = await fetchAdminUser(userIdentifier);

    id = user.id;
  }

  await deleteUserById(id);
}

/**
 * Delete a user using the user's ID.
 *
 * @param {string} userId User ID.
 */
async function deleteUserById(userId) {
  try {
    await axios({
      method: 'delete',
      url: `${config.apiGatewayUrl}/admin/user/${userId}`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
      param: { force: true },
    });
  } catch (error) {
    console.log(
      formatApiError(error, `WARNING: Failed to delete user ${userId}`)
    );
  }
}

/**
 * Get Admin User.
 *
 * @param   {string} userEmail User email.
 * @returns {object}           User object.
 */
async function fetchAdminUser(userEmail) {
  let response, user;

  try {
    response = await axios.get(
      `${config.apiGatewayUrl}/admin/users?email=${userEmail}`,
      { headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` } }
    );

    user = response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return;
    }

    throw new Error(formatApiError(error, `Failed to fetch user ${userEmail}`));
  }

  return user;
}

/**
 * Get Admin User by userId.
 *
 * @param   {string} id User id.
 * @returns {object}    User object.
 */
async function fetchAdminUserById(id) {
  let response, user;

  try {
    response = await axios.get(`${config.apiGatewayUrl}/admin/users?id=${id}`, {
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
    });

    user = response.data;
  } catch (error) {
    throw new Error(formatApiError(error, `Failed to fetch user ${id}`));
  }

  return user;
}

async function fetchAllUsers() {
  let response;

  try {
    response = await axios.get(`${config.apiGatewayUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
      params: {
        all: true,
      },
    });
  } catch (error) {
    throw new Error(formatApiError(error, 'Unable to fetch all users'));
  }

  return response.data;
}

/**
 * Update tester user.
 *
 * @param {string} userId User ID.
 * @param {string} data   Data to be passed in.
 */
async function updateUser(userId, data) {
  try {
    await axios({
      method: 'patch',
      url: `${config.apiGatewayUrl}/admin/users/${userId}`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
      data: data,
    });
  } catch (error) {
    throw new Error(formatApiError(error, `Failed to update user ${userId}`));
  }
}

/**
 * Update tester user plan.
 *
 * @param {string} userId User ID.
 * @param {string} planId Plan id to subscribe user to.
 */
async function updateUserPlan(userId, planId) {
  await updateUser(userId, { planId: planId });
}

/**
 * Check if user exists or not.
 *
 * @param   {string}  userEmail User email.
 * @returns {boolean}           True if user exists, else false.
 */
async function userExists(userEmail) {
  const user = await fetchAdminUser(userEmail);

  if (user) {
    return true;
  }

  return false;
}

module.exports = {
  addSupportedScope,
  assertNoUser,
  createTestUser,
  createUser,
  deleteUser,
  deleteUserById,
  fetchAdminUser,
  fetchAdminUserById,
  fetchAllUsers,
  updateUser,
  updateUserPlan,
  userExists,
};
