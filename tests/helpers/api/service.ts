import axios from 'axios';

import config from '../../../config';
import { sleep } from '../utils';
import { formatApiError } from './api-utils';
import { getTeamuserApiToken, getUserToken } from './auth';

const qaExampleRepo = 'https://github.com/LiferayCloud/qa-examples/tree/master';

/**
 * Deploy services from the LiferayCloud/qa-examples Github repo.
 *
 * @param {String}  projectId           Project id.
 * @param {String}  repo                Subfolder from qa-examples repo.
 * @param {Object}  options
 * @param {Boolean} [options.deploy]    If false, build only Default is `true`
 * @param {Boolean} [options.throws]    If false, return error Default is `true`
 * @param {String}  [options.userEmail] Used to authenticate route, defaults to
 *     team user email.
 * @param {String}  [options.userPw]    Used to to authenticate route, defaults
 *     to team user password.
 */
async function deployFromRepo(
  projectId,
  repo,
  { deploy = true, throws = true, userEmail, userPw } = {}
) {
  let response;
  const userToken = userEmail
    ? await getUserToken(userEmail, userPw)
    : await getTeamuserApiToken();

  try {
    response = await axios({
      method: 'post',
      url: `${config.apiGatewayUrl}/projects/${projectId}/build`,
      headers: { Authorization: `Bearer ${userToken}}` },
      data: {
        provider: 'github',
        repository: `${qaExampleRepo}/${repo}`,
        deploy,
      },
    });
  } catch (error) {
    if (throws) {
      throw new Error(
        formatApiError(error, `Failed to build/deploy from repo ${repo}`)
      );
    }

    return error;
  }

  return response.data;
}

/**
 * Deploy a hosting service with the provided serviceId.
 *
 * @param   {String} projectId Project to deploy service to.
 * @param   {string} serviceId Service id.
 * @returns {object}           Returns an array of services.
 */
async function deployHosting(projectId, serviceId, { deploy = true } = {}) {
  let response;

  try {
    response = await axios({
      method: 'post',
      url: `${config.apiGatewayUrl}/projects/${projectId}/build`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
      data: {
        provider: 'github',
        repository: 'https://github.com/LiferayCloud/qa-examples/tree/hosting',
        deploy,
        lcpJsons: {
          ui: {
            id: serviceId,
          },
        },
      },
    });
  } catch (error) {
    throw new Error(
      formatApiError(error, `Failed to deploy service ${serviceId}`)
    );
  }

  return response.data;
}

/**
 * Deploy a hosting service with the provided custom specs.
 *
 * @param   {String} projectId    Project to deploy service to.
 * @param   {string} serviceSpecs Service specs.
 * @returns {object}              Returns an array of services.
 */
async function deployHostingWithCustomSpecs(
  projectId,
  serviceSpecs,
  { deploy = true } = {}
) {
  let response;

  try {
    response = await axios({
      method: 'post',
      url: `${config.apiGatewayUrl}/projects/${projectId}/build`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
      data: {
        provider: 'github',
        repository: 'https://github.com/LiferayCloud/qa-examples/tree/hosting',
        deploy,
        lcpJsons: {
          ui: serviceSpecs,
        },
      },
    });
  } catch (error) {
    throw new Error(
      formatApiError(
        error,
        `Failed to deploy service ${serviceSpecs.serviceId}`
      )
    );
  }

  return response.data;
}

/**
 * Safely deletes service such that when the service does not exist, it simply
 * returns undefined instead of throwing an error.
 *
 * @param   {string} projectId Project id.
 * @param   {string} serviceId Service id.
 * @returns
 */
async function deleteService(projectId, serviceId) {
  try {
    const response = await axios({
      method: 'delete',
      url: `${config.apiGatewayUrl}/projects/${projectId}/services/${serviceId}`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
    });

    console.log(
      `Successfully deleted service ${serviceId} from ${projectId}.`,
      response.response
    );
  } catch (error) {
    if (error.response.status == 404) {
      console.log(
        `Could not delete because service ${serviceId} already does not exist in project ${projectId}.`
      );
      return;
    }

    throw new Error(
      formatApiError(
        error,
        `Failed to delete service ${serviceId} from ${projectId}`
      )
    );
  }
}

/**
 * Fetches a service.
 *
 * @param   {string} projectId The Id of the project.
 * @param   {string} serviceId The Id of the service.
 * @returns {object}           Returns the fetched service.
 */
async function fetchService(projectId, serviceId) {
  const response = await axios({
    method: 'get',
    url: `${config.apiGatewayUrl}/projects/${projectId}/services/${serviceId}`,
    headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
  });

  return response.data;
}

/**
 * Fetches a service's instances.
 *
 * @param   {string} projectId The Id of the project.
 * @param   {string} serviceId The Id of the service.
 * @returns {Array}            Returns list of instances.
 */
async function fetchServiceInstances(projectId, serviceId) {
  let response;

  try {
    response = await axios({
      method: 'get',
      url: `${config.apiGatewayUrl}/projects/${projectId}/services/${serviceId}/instances`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
    });
  } catch (error) {
    throw new Error(
      formatApiError(error, 'Fetching service instances failed.')
    );
  }
  return response.data;
}

/**
 * Get the container id of the current instance. Only use for services with scale = 1.
 *
 * @param   {string} projectId Project id.
 * @param   {string} serviceId Service id.
 * @returns {string}           Container id of service instance.
 */
async function getCurrentInstance(projectId, serviceId) {
  const instances = await fetchServiceInstances(projectId, serviceId);
  return instances[0].containerId;
}

/**
 * Replace custom domain for a service.
 *
 * @param {string}   projectId Project Id.
 * @param {string}   serviceId Service Id.
 * @param {string[]} domains   Array of domain name(s).
 */
async function replaceCustomDomains(projectId, serviceId, domains) {
  try {
    await axios({
      method: 'put',
      url: `${config.apiGatewayUrl}/projects/${projectId}/services/${serviceId}/custom-domains`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
      data: { value: domains },
    });
  } catch (error) {
    throw new Error(
      formatApiError(error, 'Error replacing service custom domain')
    );
  }
}

/**
 * Get an environment variable for a service.
 *
 * @param {string} projectId  Project Id.
 * @param {string} serviceId  Service Id.
 * @param {string} envVarName Environment variable name.
 */
async function fetchServiceEnvVar(projectId, serviceId, envVarName) {
  let response;

  try {
    response = await axios({
      method: 'get',
      url: `${config.apiGatewayUrl}/projects/${projectId}/services/${serviceId}/environment-variables/${envVarName}`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
    });
  } catch (error) {
    throw new Error(formatApiError(error, 'Error getting service env var'));
  }

  return response.data;
}

/**
 * Get project service environment variables.
 *
 * @param   {string} projectId Project Id.
 * @param   {string} serviceId Service Id.
 * @returns {Array}            Returns list of environment variable.
 */
async function fetchServiceEnvVars(projectId, serviceId) {
  let response;

  try {
    response = await axios({
      method: 'get',
      url: `${config.apiGatewayUrl}/projects/${projectId}/services/${serviceId}/environment-variables`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
    });
  } catch (error) {
    throw new Error(formatApiError(error, 'Error getting service env vars'));
  }

  return response.data;
}

/**
 * Replace all environment variables for a service.
 *
 * @param {string} projectId Project Id.
 * @param {string} serviceId Service Id.
 * @param {object} envVars   Env vars object {var1: value1, var2: value2, etc}
 */
async function replaceServiceEnvVars(projectId, serviceId, envVars) {
  try {
    await axios({
      method: 'put',
      url: `${config.apiGatewayUrl}/projects/${projectId}/services/${serviceId}/environment-variables`,
      data: { env: envVars },
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
    });
  } catch (error) {
    throw new Error(formatApiError(error, 'Error replacing service env vars'));
  }
}

/**
 * Restart a service.
 *
 * @param {string} projectId Project id.
 * @param {string} serviceId Service id.
 */
async function restartService(projectId, serviceId) {
  try {
    await axios({
      method: 'post',
      url: `${config.apiGatewayUrl}/projects/${projectId}/services/${serviceId}/restart`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
    });
  } catch (error) {
    throw new Error(
      formatApiError(error, `Error restarting service ${serviceId}`)
    );
  }
}
/**
 * Set a service's scale.
 *
 * @param {string} projectId  Project id.
 * @param {string} serviceId  Service id.
 * @param {number} scaleValue New scale value for service.
 */
async function scaleService(projectId, serviceId, scaleValue) {
  try {
    await axios({
      method: 'patch',
      url: `${config.apiGatewayUrl}/projects/${projectId}/services/${serviceId}/scale`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
      data: { value: scaleValue },
    });
  } catch (error) {
    throw new Error(
      formatApiError(error, `Error updating scale for service ${serviceId}`)
    );
  }
}

/**
 * Set the autoscale parameters of a service.
 *
 * @param {string} projectId           Project id.
 * @param {string} serviceId           Service id.
 * @param {object} options             Options object containing autoscale params.
 * @param {number} [options.threshold] Autoscale threshold for cpu and
 *     memory. Default = 20.
 */
async function setAutoscaleParams(projectId, serviceId, options = {}) {
  const data = {
    autoscale: {
      memory: options.threshold || 20,
      cpu: options.threshold || 20,
    },
  };

  await updateService(projectId, serviceId, data);
}

/**
 * Set the scaleData parameters of a service.
 *
 * @param {string} projectId                    Project id.
 * @param {string} serviceId                    Service id.
 * @param {object} options                      Options object containing scale
 *     data params.
 * @param {number} [options.autoscaleEnabled]   Enable or disable autoscale.
 * @param {number} [options.manualScaleEnabled] Enable or disable manual scale.
 * @param {number} [options.maxAutoInstances]   Max number of instances for autoscale.
 * @param {number} [options.targetManual]       Target value for manual scale.
 */
async function setScaleDataParams(projectId, serviceId, options = {}) {
  const optionEntries = Object.entries(options);

  if (optionEntries.length == 0) {
    return;
  }

  const data = optionEntries.reduce((acc, curr) => {
    const [key, value] = curr;
    acc[key] = value;

    return acc;
  }, {});

  try {
    await axios({
      method: 'patch',
      url: `${config.apiGatewayUrl}/projects/${projectId}/services/${serviceId}/scale-data`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
      data,
    });
  } catch (error) {
    throw new Error(
      formatApiError(error, `Error updating scaleData for service ${serviceId}`)
    );
  }
}

/**
 * Stop a service.
 *
 * @param {string} projectId Project id.
 * @param {string} serviceId Service id.
 */
async function stopService(projectId, serviceId) {
  try {
    await axios({
      method: 'patch',
      url: `${config.apiGatewayUrl}/projects/${projectId}/services/${serviceId}/stop`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
    });
  } catch (error) {
    throw new Error(
      formatApiError(error, `Error stopping service ${serviceId}`)
    );
  }
}

/**
 * Patch a service.
 *
 * @param {string} projectId Project id.
 * @param {string} serviceId Service id.
 * @param {object} data      Data to patch.
 */
async function updateService(projectId, serviceId, data) {
  const service = await fetchService(projectId, serviceId);

  try {
    await axios({
      method: 'patch',
      url: `${config.apiGatewayUrl}/admin/services/${service.id}`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
      data,
    });
  } catch (error) {
    throw new Error(
      formatApiError(error, `Error updating service ${serviceId}`)
    );
  }
}

/**
 * Updates a single environment variable for a service.
 *
 * @param {string} projectId    Project ID.
 * @param {string} serviceId    Service ID.
 * @param {object} envVar       Environment variable object.
 * @param {string} envVar.name  Environment variable name.
 * @param {string} envVar.value Environment variable value.
 */
async function updateServiceEnvVar(projectId, serviceId, envVar) {
  try {
    await axios({
      method: 'put',
      url: `${config.apiGatewayUrl}/projects/${projectId}/services/${serviceId}/environment-variables/${envVar.name}`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
      data: {
        value: envVar.value,
      },
    });
  } catch (error) {
    throw new Error(
      formatApiError(
        error,
        `Error updating env var ${envVar.name} for service ${serviceId} on project ${projectId}`
      )
    );
  }
}

/**
 * Wait until new instance is available.
 *
 * @param   {string} projectId   Project id.
 * @param   {string} serviceId   Service id.
 * @param   {string} oldInstance Old container id.
 * @returns {string}             Container id of new instance.
 */
async function waitForNewInstance(projectId, serviceId, oldInstance) {
  let currentInstance = oldInstance;
  let tries = 0;

  while (oldInstance === currentInstance) {
    if (tries > 20) {
      throw new Error('Timed out while waiting for new instance');
    }
    await sleep(10000);
    currentInstance = await getCurrentInstance(projectId, serviceId);
    tries++;
  }

  return currentInstance;
}

/**
 * Waits until service reaches expected status.
 *
 * @param {string} projectId Project ID.
 * @param {string} serviceId Service ID.
 * @param {string} status    Service status.
 */
async function waitForStatus(projectId, serviceId, status) {
  let tries = 0;
  let service;

  for (;;) {
    await sleep(10000);

    if (tries === 60) {
      throw new Error(
        `Timed out while waiting for ${serviceId} service to have status ${status}.`
      );
    }

    tries++;

    try {
      service = await fetchService(projectId, serviceId);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        continue;
      }
      throw error;
    }

    if (service.status === status) {
      return;
    }
  }
}

/**
 * Waits until a project service gets ready.
 *
 * @param {string} projectId        The Id of the project.
 * @param {string} serviceId        The Id of the service.
 * @param {number} [timeoutSeconds] Max number of seconds to wait before timing out.
 */
async function waitUntilReady(
  projectId,
  serviceId,
  { timeoutSeconds = 180 } = {}
) {
  const maxTries = Math.floor(timeoutSeconds / 10);
  let service;
  let tries = 0;

  for (;;) {
    tries++;
    if (tries > maxTries) {
      throw new Error(
        `Timed out while waiting for ${serviceId} service to be ready.`
      );
    }

    try {
      service = await fetchService(projectId, serviceId);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        await sleep(10000);
        continue;
      }
      throw error;
    }

    if (service.ready === true) {
      return;
    }

    await sleep(10000);
  }
}

module.exports = {
  deleteService,
  deployFromRepo,
  deployHosting,
  deployHostingWithCustomSpecs,
  fetchService,
  fetchServiceInstances,
  getCurrentInstance,
  fetchServiceEnvVar,
  fetchServiceEnvVars,
  replaceCustomDomains,
  replaceServiceEnvVars,
  restartService,
  scaleService,
  setAutoscaleParams,
  setScaleDataParams,
  stopService,
  updateService,
  updateServiceEnvVar,
  waitForStatus,
  waitForNewInstance,
  waitUntilReady,
};
