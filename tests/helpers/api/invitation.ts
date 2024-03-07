import axios from 'axios';

import config from '../../../config';
import { formatApiError, retryApi } from './api-utils';
import { getTeamuserApiToken } from './auth';
import { fetchAdminProject } from './project';

/**
 * Add team member.
 *
 * @param {string} projectId ProjectId.
 * @param {string} email     Email of new team member.
 * @param {string} role      Team member's role (admin|contributor|guest)
 */
async function addTeamMember(projectId, email, role) {
  await sendInvitation(projectId, email, role);
  await acceptInvitation(projectId, email);
}

/**
 * Encode email to base64 format.
 *
 * @param   {string} email Email.
 * @returns {string}       Encoded string.
 */
function base64Encode(email) {
  const buffer = Buffer.from(email);
  return buffer.toString('base64');
}

/**
 * Accept invitation.
 *
 * @param {string} projectId ProjectId.
 * @param {string} email     Email of invited team member.
 */
async function acceptInvitation(projectId, email) {
  let token = await getInvitationToken(projectId, email);

  try {
    await axios({
      method: 'get',
      url: `${config.apiGatewayUrl}/projects/${projectId}/invite`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
      params: {
        email,
        invitationToken: token,
      },
    });
  } catch (error) {
    throw new Error(formatApiError(error, 'Failed to accept invitation.'));
  }
}

/**
 * Get invitation taken from Project.
 *
 * @param   {string} projectId ProjectId.
 * @param   {string} email     Email of invited team member.
 * @returns {string}           Invitation token.
 */
async function getInvitationToken(projectId, email) {
  let project;

  await retryApi(3, async () => {
    project = await fetchAdminProject(projectId);
  });

  return project.invitations[base64Encode(email)];
}

/**
 * Send invitation.
 *
 * @param {string} projectId Project id.
 * @param {email}  email     Email of invited user.
 * @param {role}   role      Project role (admin|contributor|guest)
 */
async function sendInvitation(projectId, email, role) {
  try {
    await axios({
      method: 'post',
      url: `${config.apiGatewayUrl}/projects/${projectId}/invite`,
      headers: { Authorization: `Bearer ${await getTeamuserApiToken()}` },
      data: {
        email: email,
        role: role,
      },
    });
  } catch (error) {
    throw new Error(formatApiError(error, 'Failed to invite user.'));
  }
}

module.exports = {
  acceptInvitation,
  addTeamMember,
  sendInvitation,
};
