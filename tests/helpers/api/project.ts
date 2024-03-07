import axios from 'axios';
// import { t as testController } from 'testcafe';

import config from '../../../config';
import { randomEnvironmentName, randomProjectId, sleep } from '../utils';
import { formatApiError, retryApi } from './api-utils';
import { getTeamuserApiToken, getUserToken } from './auth';

/**
 * Sets project's support access. Assumes testController.fixtureCtx.tester.email
 * is the owner of the project.
 *
 * @param {string}  projectId Project id.
 * @param {boolean} allow     Default to true.
 */
export async function allowSupportAccess(projectId, allow = true) {
  const userToken = await getUserToken(testController.fixtureCtx.tester.email);

  try {
    await axios({
      method: 'patch',
      url: `${config.apiGatewayUrl}/projects/${projectId}/support-access`,
      headers: { Authorization: `Bearer ${userToken}` },
      data: { allow },
    });
  } catch (error) {
    throw new Error(formatApiError(error, 'Error setting support access'));
  }
}

/**
 * Asserts that project does not exist. Keeps retrying assert until timeout is reached.
 *
 * @param   {string} projectId        Project ID.
 * @param   {number} [timeoutSeconds] Max number of seconds to keep retrying.
 * @returns
 */
export async function assertNoProject(projectId, { timeoutSeconds = 10 } = {}) {
  const retryInterval = 5;
  const maxTries = Math.floor(timeoutSeconds / retryInterval);
  let exists = true;
  let tries = 0;

  for (;;) {
    tries++;
    if (tries > maxTries) {
      throw new Error(`Project ${projectId} exists`);
    }

    exists = await projectExists(projectId);

    if (!exists) return;

    await sleep(retryInterval * 1000);
  }
}

/**
 * Asserts if project id exists and throws an error if it does not.
 *
 * @param {string} projectId Project id.
 */
export async function assertProjectExists(projectId) {
  if ((await projectExists(projectId)) === false) {
    throw new Error(`Project Id ${projectId} does not exist`);
  }

  console.log(`Confirmed project ${projectId} exists`);
}

export async function createEnvironment({
  rootProjectId,
  envName = randomEnvironmentName(),
  ...options
} = {}) {
  let project;

  await retryApi(3, async () => {
    project = await createProject(`${rootProjectId}-${envName}`, {
      environment: true,
      ownerEmail: options.ownerEmail || config.teamuser.email,
      ...options,
    });
  });

  return project;
}

/**
 * Create a project. If this is for a standard functional test, please use
 * CreateTestProject below.
 *
 * Note: If creating a project in fixture.before, pass in the ownerEmail
 * explicitly, as the `testController` object is only available in `test` context.
 *
 * @param   {string}  projectId             Project id.
 * @param   {object}  options               Options object.
 * @param   {Boolean} [options.environment] Environment flag Default is `false`
 * @param   {object}  [options.metadata]    Metadata flag. Default is setting
 *     type to `production`
 * @param   {string}  [options.ownerEmail]  Project owner's Email. Default is
 *     `config.teamuser.email`
 * @param   {string}  [options.cluster]     The cluster where the project will
 *     be deployed.
 * @returns {Object}                        Project object.
 */
export async function createProject(projectId, options = {}) {
  let response;
  let project;

  const userToken = options.ownerEmail
    ? await getUserToken(options.ownerEmail)
    : await getTeamuserApiToken();

  try {
    response = await axios({
      method: 'post',
      url: `${config.apiGatewayUrl}/projects`,
      headers: { Authorization: `Bearer ${userToken}` },
      data: {
        projectId: projectId,
        cluster: options.cluster || config.projectRegion,
        environment: options.environment || false,
        metadata: options.metadata || { type: 'production' },
      },
    });
    
    project = response.data;
  } catch (error) {
    throw new Error(
      formatApiError(error, `Failed to create project ${projectId}`)
    );
  }

  return project;
}

/**
 * Create a test environment. Will attempt to create a environment 3 times before failing.
 *
 * Note: Do not use this in fixture.before (testController will not resolve).
 * Use createProject method instead.
 *
 * @param {object} options                 Options object.
 * @param {string} [options.rootProjectId] Root Project ID.
 * @param {string} [options.envName]       Name of environment. Default is random
 *     environment name.
 * @param {string} [options.ownerEmail]    Email address of owner. Defaults to
 *     `config.teamuser.email`
 * @param {object} [options.options]       Additional options object.
 */
export async function createTestEnvironment({
  rootProjectId = testController.fixtureCtx.rootProject.projectId,
  envName = randomEnvironmentName(),
  ...options
} = {}) {
  return await createTestProject(`${rootProjectId}-${envName}`, {
    environment: true,
    ownerEmail: options.ownerEmail || config.teamuser.email,
    ...options,
  });
}

/**
 * Create a test project. Will attempt to create a project 3 times before failing.
 *
 * Note: Do not use this in fixture.before (testController will not resolve).
 * Use createProject method instead.
 *
 * @param   {string}  projectId             Project id. Default is to create a
 *     random projectId.
 * @param   {object}  options               Options object.
 * @param   {Boolean} [options.environment] Environment flag Default is `false`
 * @param   {object}  [options.metadata]    Metadata flag. Default is setting
 *     type to `production`
 * @param   {string}  [options.ownerEmail]  Project owner's Email. Default is
 *     `config.teamuser.email`
 * @param   {string}  [options.cluster]     The cluster where the project will
 *     be deployed.
 * @returns {Object}                        Project object.
 */
export async function createTestProject(
  projectId = randomProjectId(),
  options = {}
) {
  let project;

  (testController.fixtureCtx.projectsToDelete ??= new Set()).add(projectId);

  await retryApi(3, async () => {
    project = await createProject(projectId, options);
  });
  return project;
}

/**
 * Delete a project.
 *
 * @param {string} projectId          Project id.
 * @param {Set}    [projectsToDelete] FixtureContext.projectsToDelete.
 */
export async function deleteProject(projectId, projectsToDelete) {
  try {
    await axios({
      method: 'delete',
      url: `${config.apiGatewayUrl}/projects/${projectId}`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
    });
  } catch (error) {
    if (error.response?.status === 404) {
      return;
    }
    console.log('deleteProject ' + projectId)
    console.log('deleteProject ' + JSON.stringify(Array.from(projectsToDelete.values())))
    console.log(
      formatApiError(error, `WARNING: Failed to delete project ${projectId}`)
    );
  }

  if (projectsToDelete) {
    projectsToDelete.delete(projectId);
  } else {
    testController.fixtureCtx.projectsToDelete?.delete(projectId);
  }
}

/**
 * Fetch project by projectId.
 *
 * @param   {string} projectId ProjectId.
 * @returns {Object}           Project object.
 */
export async function fetchAdminProject(projectId) {
  let response;

  try {
    response = await axios({
      method: 'get',
      url: `${config.apiGatewayUrl}/admin/projects/${projectId}`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
    });
  } catch (error) {
    throw new Error(formatApiError(error, 'Failed to fetch project.'));
  }

  return response.data;
}

export async function fetchAllProjects() {
  let projects, response;

  try {
    response = await axios.get(`${config.apiGatewayUrl}/admin/projects`, {
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
    });

    projects = response.data;
  } catch (error) {
    throw new Error(formatApiError(error, 'Unable to fetch all projects'));
  }

  return projects;
}

/**
 * Fetch project master token.
 *
 * @param   {string} projectId Project Id.
 * @returns {string}           Project master token.
 */
export async function fetchProjectMasterToken(projectId) {
  try {
    const response = await axios({
      method: 'get',
      url: `${config.apiGatewayUrl}/projects/${projectId}/masterToken`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
    });

    return response.data.masterToken;
  } catch (error) {
    throw new Error(
      formatApiError(error, 'Failed to fetch project master token.')
    );
  }
}

/**
 * Fetch projectUid.
 *
 * @param   {string}          projectId ProjectId.
 * @returns {Promise<string>}           Project Uid.
 */
export async function fetchProjectUid(projectId) {
  const project = await fetchAdminProject(projectId);

  return project.id;
}

/**
 * Get project owner's email.
 *
 * @param   {string} projectId Project id.
 * @returns {string}           Owner's email.
 */
export async function getProjectOwnerEmail(projectId) {
  const project = await fetchAdminProject(projectId);
  const ownerId = project.ownerId;
  let response;

  try {
    response = await axios({
      method: 'get',
      url: `${config.apiGatewayUrl}/admin/users`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
      params: { id: ownerId },
    });
  } catch (error) {
    throw new Error(formatApiError(error, 'Failed to fetch user.'));
  }

  return response.data.email;
}

/**
 * Check if project exists or not.
 *
 * @param   {string}  projectId Project id.
 * @returns {boolean}           True if project exists, else false.
 */
export async function projectExists(projectId) {
  try {
    await axios.get(`${config.apiGatewayUrl}/admin/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return false;
    }

    throw new Error(
      formatApiError(error, `Could not GET project ${projectId}`)
    );
  }

  return true;
}

/**
 * Fetches Project, but returns undefined if the project does not exist.
 *
 * @param   {string}              projectId Project id.
 * @returns {Project | undefined}           Project if project exists, else undefined.
 */
export async function safeFetchProject(projectId) {
  try {
    const response = await axios.get(
      `${config.apiGatewayUrl}/admin/projects/${projectId}`,
      {
        headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
      }
    );

    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return undefined;
    }

    throw new Error(
      formatApiError(error, `Could not GET project ${projectId}`)
    );
  }
}

/**
 * Teardown any remaining projects during fixture.after.
 *
 * @param {object} set Fixture context object.
 */
export async function teardownProjects(set) {
  // so I would have to take the projectsToDelete objectSet, bring it in here
  // then Hmm what does this do. How does it currently do it. Afaik deleting root should delete the rest... Also I'm not currently deleting users...
  const { projectsToDelete } = set;

  if (!projectsToDelete || projectsToDelete.size === 0) {
    return;
  }

  console.log(`Cleaning up ${projectsToDelete.size} projects`);

  for (const projectId of projectsToDelete) {
    console.log(' running deleteProject function ');
    await deleteProject(projectId, projectsToDelete);

    console.log('deleting from tearDownProjects ' + projectId);
  }
}

export async function updateProject(projectId, data) {
  try {
    await axios({
      method: 'patch',
      url: `${config.apiGatewayUrl}/admin/projects/${projectId}`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
      data,
    });
  } catch (error) {
    throw new Error(
      formatApiError(error, `Unable to update project ${projectId}`)
    );
  }
}

/**
 * Updates a project's metadata.
 *
 * @param {string} projectId Project id.
 * @param {object} metadata  Metadata to be updated.
 */
export async function updateProjectMetadata(projectId, metadata) {
  let currentMetadata = await fetchAdminProject(projectId).metadata;
  let mergedMetadata = { ...currentMetadata, ...metadata };

  try {
    await axios({
      method: 'patch',
      url: `${config.apiGatewayUrl}/projects/${projectId}`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
      data: {
        metadata: mergedMetadata,
      },
    });
  } catch (error) {
    throw new Error(formatApiError(error, 'Error updating project metadata'));
  }
}
