import axios from 'axios';

import config from '../../../config';
import { sleep } from '../utils';
import { formatApiError } from './api-utils';
import { getTeamuserApiToken } from './auth';

async function getResetCode(userId) {
  await sleep(3000);

  const myResults = await fetchRedis();

  for (let result of myResults) {
    if (result.includes(`liferay-cloud-resetcode-redis:${userId}`))
      return result.split(':')[2];
  }
  throw new Error(`Unable to find the resetcode for ${userId}.`);
}

async function fetchRedis() {
  let response;

  try {
    response = await axios({
      method: 'get',
      url: `${config.apiGatewayUrl}/admin/redis`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
    });
  } catch (error) {
    throw new Error(formatApiError(error, 'Failed to fetch redis.'));
  }
  return response.data;
}

module.exports = {
  getResetCode,
};
