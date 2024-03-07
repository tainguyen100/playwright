import { type Page, expect} from '@playwright/test';

import config from '../../config';
import { navigateToConsolePage } from '../helpers/navigator';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = this.page.locator('#email');
    this.emailHelp = this.page.locator('#emailHelp');
    this.passwordInput = this.page.locator('#password');
    this.passwordHelp = this.page.locator('#passwordHelp');
    this.termsOfServiceMessage = this.page.locator('.login-terms-service');
    this.termsOfServiceLink = this.termsOfServiceMessage.locator('a');
    this.submitButton = this.page.locator('button').filter({ hasText: 'Log In' });
    this.button = this.page.locator('button, .btn').isVisible();
  }

  /**
   * User log in.
   *
   * @param {string}  email                    User email address.
   * @param {string}  password                 User password.
   * @param {Object}  options                  Additional options for logging in.
   * @param {boolean} [options.assertSuccess]  Assert successful log in; defaults
   *     to true. Default is `true`
   * @param {boolean} [options.stayLoggedIn]   Flag checkbox for an extended
   *     session when logging in; defaults to true. Default is `true`
   * @param {boolean} [options.skipNavigation] Skip navigation to `/login`
   */
  async login(
    email,
    password = config.tester.pw,
    { assertSuccess = true, stayLoggedIn = true, skipNavigation = false } = {}
  ) {

    if (!skipNavigation) {
      await this.page.goto(config.consoleUrl + '/login');
    }

      await this.emailInput.fill(email);
      await this.passwordInput.fill(password);

      if (stayLoggedIn) {
        await this.page.getByText('Stay logged in on this computer').click();
      }

      await this.page.locator('button').click();

      if (assertSuccess) {
        await expect(this.page.locator('h1')).toContainText('Projects', { timeout: 15000});
      }
  }

  async logout() {
    await navigateToConsolePage('/logout');
  }
}
