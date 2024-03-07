import { expect } from '@playwright/test'

export class BasePage {

  constructor(page) {
    this.page = page;
    this.page.getByTestId('page-title');
    this.button = this.page.locator('button, .btn').isVisible();
    this.infoIcon = this.page.locator('svg.more-info-icon');
    this.antDButton = this.page.locator('button.ant-btn, .ant-btn').isVisible();
    this.antDCardTitle = this.page.locator('.lfr-basic-info-card h4');
    this.antDCell = this.page.locator('.ant-table-cell').isVisible();
    this.antDCheckbox = this.page.locator(
      '.ant-checkbox-wrapper.ant-checkbox-group-item'
    ).isVisible();
    this.antDPageTitle = this.page.locator('h1').getAttribute(
      'data-testid',
      'page-title'
    );
    this.antDCardMetaTitle = this.page.locator(
      '.ant-card-meta-detail .ant-card-meta-title'
    );
    this.antDCardMetaDescription = this.page.locator(
      '.ant-card-meta-detail .ant-card-meta-description'
    );
    this.btnSquaredDropdown = this.page.locator('button.btn-squared');
    this.codeSnippetBoard = this.page.locator('.code-snippet .code-board');
    this.copySnippetBtn = this.page.locator('button.copy-snipped-btn');
    this.errorMessage = this.page.locator('.form-alert');
    this.label = this.page.locator('label');
    this.link = this.page.locator('a');
    this.pageTitle = this.page.locator('.header-title, [data-testid="page-title"]');
    this.pageSubtitle = this.page.locator('.header-subtitle');
    this.placeHolder = this.page.locator('.content-placeholder');
    this.antDPlaceHolder = this.page.locator('.lfr-placeholder__title');
    this.sennaLoadingBar = this.page.locator('.senna-loading');
    this.successMessage = this.page.locator('.form-alert-success');
    this.selectedTab = this.page.locator('.content-tab-selected');
    this.antDSelectedTab = this.page.locator('.ant-tabs-tab-active');
    this.tab = this.page.locator('.content-tab');
    this.antDTab = this.page.locator('.ant-tabs-tab-btn');
    this.toast = this.page.locator('.alert-body');
    this.antDToast = this.page.locator('.ant-notification .ant-notification-notice');
    this.validationMessage = this.page.locator('.help-block span, .help-block');
    this.menuSelect = this.page.locator('.select');
    this.openDropdown = this.page.locator(
      '.dropdown.open, .ant-dropdown-open, .ant-select-dropdown:not(.ant-select-dropdown-hidden)'
    );
    this.dropdownMenuOption = this.menuSelect.locator('li');
    this.selectedOption = this.menuSelect.locator('li.selected');
    this.antDTooltipBody = this.page.locator('.ant-tooltip-inner');
    this.skeleton = this.page.locator('[class*="lfr-skeleton"]');
    this.tooltipTitle = this.page.locator('.tooltip-title');
    this.tooltipBody = this.page.locator('.tt-body');
  }

  async waitForLoadingBar() {
    await expect(this.sennaLoadingBar).not.toBeVisible();
  }

  async _waitForSkeleton(selector) {
    await expect(selector).not.toBeVisible();
  }

  async waitForSkeletons({ timeout = 10000 } = {}) {
    const nextDiv = this.page.locator('div').filter('id', '__next');

    if (!(await expect(nextDiv)).toBeVisible()) {
      return;
    }

    const count = await this.page.locator(this.skeleton).count();

    const promises = [];

    for (let i = 0; i < count; i++) {
      promises.push(this._waitForSkeleton(this.skeleton.nth(i), timeout));
    }

    await Promise.all(promises);
  }
  
  /**
   * @param {string}  text              Text to be asserted in the page title.
   * @param {object}  [options]         Optional parameters.
   * @param {number}  [options.timeout] Time to wait before failing the page title
   *     assertion; Default is `3000`
   * @param {boolean} [options.isAntD]  If is a new-console page.
   */
    async assertPageTitle(text, { timeout = 3000 } = {}) {
      const pageTitle = this.page.getByTestId('page-title');
      
      await expect(pageTitle).toContainText(text, { timeout });
    }

  /**
   * @param {string}  text              Text to be asserted in the button.
   * @param {object}  [options]         Optional parameters.
   * @param {number}  [options.timeout] Time to wait before failing the button
   *     assertion; Default is `3000`
   * @param {boolean} [options.isAntD]  If is a new-console page.
   */
    async clickBtn(text, { isAntD, timeout = 3000 } = {}) {
      const button = isAntD ? this.antDButton : this.button;
  
      const buttonWithText = button.toContainText(text);
  
      await this.page.expect(buttonWithText).click(buttonWithText, { timeout });
    }

    async assertTooltip(tooltipText, { isAntD, isEscaped = false } = {}) {
      const tooltip = isAntD
        ? this.antDTooltipBody
        : isEscaped
        ? this.tooltipTitle
        : this.tooltipBody;
  
      await this.page.expect(tooltip.toContainText(tooltipText));
    }

  /**
   * @param {string}  text             Placeholder text to be asserted.
   * @param {object}  [options]        Optional parameters.
   * @param {boolean} [options.isAntD] If element is on a React page.
   */
  async assertPlaceholderText(text, { timeout = 5000 } = {}) {
    const placeHolder = this.page.locator('.lfr-placeholder__title');
    await expect(placeHolder).toContainText(text, { timeout });
  }
}