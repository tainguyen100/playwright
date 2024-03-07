import { test } from '@playwright/test';

import { addTeamMember } from '../../helpers/api/invitation';
import {
  createProject,
  createEnvironment,
  teardownProjects,
} from '../../helpers/api/project';
import { createTestUser, deleteUser } from '../../helpers/api/user';
import { randomProjectId } from '../../helpers/utils';
import { BasePage } from '../../pages/base-page';
import { LoginPage } from '../../pages/login-page';

import config from '../../../config';

test.describe("View services list", () => {
  let testerObj;
  let rootProject; 
  let projectsToDelete = new Set();
  let projectObj;
  let projectEnv;
  let baseUrl = config.consoleUrl;

  test.beforeAll(async () => {
    testerObj = await createTestUser();
    rootProject = await createProject(randomProjectId());

    projectsToDelete = new Set().add(rootProject.projectId);
  });

  test.beforeEach(async () => {
      projectObj = await createEnvironment({
        rootProjectId: rootProject.projectId,
      });

      projectEnv = projectObj.projectId;

      await addTeamMember(
        projectEnv,
        testerObj.email,
        'admin'
      );
    });

  test.afterEach(async () => {
    // Need to fix in LCD-35933
    // await deleteProject(testController.ctx.environment.projectId);
  });

  test.afterAll('Teardown', async () => {
    // Need to fix in Teardowns LCD-35933
    await teardownProjects(projectsToDelete);
    await deleteUser(testerObj.id);
  });


  test('View services page with no services', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const basePage = new BasePage(page);

    const projectUrl = baseUrl + `/projects/${projectEnv}`;
    const testerEmail = testerObj.email;

    await loginPage.login(testerEmail);

    await page.goto(projectUrl + `/services`);

    await basePage.assertPageTitle('Services');
    await basePage.assertPlaceholderText('No services yet');
  });
});