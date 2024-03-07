import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const secretmanagerClient = new SecretManagerServiceClient();

/**
 * Retrieves secret object for credentials stored on Google Secret Manager on
 * liferaycloud-engtools-prd. Expects user to be logged in to gcloud auth using
 * the gcloud CLI.
 *
 * @returns {Object} Returns secret object key.
 */
export async function getGsmSecret(secretName, version) {
  const request = {
    name: `projects/liferaycloud-engtools-prd/secrets/${secretName}/versions/${version}`,
  };

  const [response] = await secretmanagerClient.accessSecretVersion(request);

  const credentials = JSON.parse(response.payload.data);

  return credentials;
}