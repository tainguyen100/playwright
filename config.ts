import dotenv from 'dotenv';
import os from 'os';
import path from 'path';

import { getGsmSecret } from './tests/helpers/gsm';

dotenv.config();

const config = {
  apiGatewayUrl: process.env.REMOTE.includes('.liferay')
    ? `https://api.${process.env.REMOTE}`
    : `https://apigateway.${process.env.REMOTE}`,
  apiBaseUrl: `https://api.${process.env.REMOTE}`,
  bladeDownloadUrl:
    'https://repository-cdn.liferay.com/nexus/service/local/artifact/maven/content?r=liferay-public-releases&g=com.liferay.blade&a=com.liferay.blade.cli&v=LATEST',
  ci: {
    customerName: 'customer',
    customerPassword: 'qatestxyz!',
  },
  consoleUrl: `https://console.${process.env.REMOTE}`,
  dependencies: 'tests/helpers/dependencies',
  downloadDir:
    os.platform() === 'win32'
      ? path.join(process.env.USERPROFILE, 'Downloads')
      : path.join(process.env.HOME, 'Downloads'),
  dxpstackTester: {
    email: 'qa.dxpstack.tester@liferay.cloud',
    pw: process.env.TESTER_PW,
  },
  dxpUser: {
    email: 'test@liferay.com',
    pw: process.env.TESTER_PW,
  },
  sreUser: {
    email: 'qa.sre.user@liferay.com',
    pw: process.env.TESTER_PW,
  },
  githubToken: process.env.GITHUB_TOKEN,
  githubUserEmail: process.env.GITHUB_USER_EMAIL,
  googleServiceKey: process.env.GOOGLE_SERVICE_KEY,
  liferayVersion: process.env.LIFERAY_IMAGE
    ? process.env.LIFERAY_IMAGE.substring(0, 3).replace('.', '')
    : '74',
  mailhog: {
    user: 'mailhog',
    pw: `mailhog@${process.env.REMOTE.replace(/(.*liferay\.)/, '')}`,
  },
  marketplaceOauthCredentials: {
    id: process.env.MARKETPLACE_OAUTH_CLIENT_ID,
    secret: process.env.MARKETPLACE_OAUTH_CLIENT_SECRET,
  },
  marketplaceApiUrl: 'https://marketplace.lxc.liferay.com/o',
  marketplaceAppOrderIds: {
    sh: [16143841, 16143856],
    st: [17079344, 16143886],
    coffee: [16144503, 16144518],
  },
  oktaLoginAttempts: 10,
  platformRootProject:
    process.env.ROOT_PROJECT ||
    `qastatic${process.env.REMOTE.replace(/(.*liferay\.)/, '')}`,
  projectRegion: process.env.PROJECT_REGION || 'us-west1-c1',
  projectRoot: __dirname,
  remote: process.env.REMOTE,
  serviceDomain: process.env.SERVICE_DOMAIN,
  statusPage: {
    apiKey: process.env.STATUSPAGE_API_KEY,
    pageId: 'n9qmq1q6bk9y',
  },
  tester: {
    pw: process.env.TESTER_PW,
  },
  teamuser: {
    email: 'qa.team.user@liferay.cloud',
    pw: process.env.TESTER_PW,
  },
  vpnCredentials: process.env.VPNCREDENTIALS
    ? JSON.parse(process.env.VPNCREDENTIALS)
    : '',
};

/**
 * Gets credentials from Google Secret Manager.
 *
 * @returns {Object} Returns credentials.
 */
async function getCredentialsFromSecret() {
  const gsmCreds = await getGsmSecret(
    'lcp_functional_tests_credentials_json',
    '2'
  );
  return gsmCreds;
}

const isLocalRun = process.env.JENKINS_HOME ? false : true;

if (isLocalRun) {
  getCredentialsFromSecret()
    .then((credentials) => {
      Object.assign(config, credentials);
    })
    .catch((error) => {
      console.log('Error on fetching credentials from GSM');
      throw error;
    });
}

module.exports = config;