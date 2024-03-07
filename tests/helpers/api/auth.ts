import axios from 'axios';

import config from '../../../config';
import { formatApiError } from './api-utils';

let teamuserApiToken;

/**
 * Get qa teamuser's token (qa.team.user@liferay.cloud)
 *
 * @returns {string} Token.
 */
export async function getTeamuserApiToken() {
  if (!teamuserApiToken) {
    teamuserApiToken = await getUserToken(
      config.teamuser.email,
      config.teamuser.pw
    );
  }

  return teamuserApiToken;
}

/**
 * Logs in user and returns token.
 *
 * @param   {string} email User email.
 * @returns {string}       Token.
 */
export async function getUserToken(email, password = config.tester.pw) {
  const userData = await loginUser(email, password);
  return userData.token;
}

/**
 * Login a user.
 *
 * @param   {string} email User email.
 * @returns {Object}       User object.
 */
export async function loginUser(email, password = config.tester.pw) {
  try {
    const response = await axios({
      method: 'post',
      url: `${config.apiGatewayUrl}/login`,
      data: {
        email: email,
        password,
        extend: true,
      },
    });

    return response.data;
  } catch (error) {
    console.log(
      formatApiError(error, `WARNING: Failed to login user ${email}`)
    );
  }
}
