const { test, expect } = require('@playwright/test');
const TU = require('../shared/TestUtils');

// routes used in tests
const login = 'login';
const settings = 'settings';

test.describe('Login', () => {

  test.beforeEach(async ({ page }) => {
    TU.registerPage(page);
    await TU.navigate(login);
  });

  test('verify we can log in', async () => {
    await TU.login();

    // Check the project title to verify that we are logged in
    const title = await TU.locator('.title-content');
    expect(await title.innerText()).toBe('Test Project A');

    await TU.logout();

    // Verify that we have logged out
    const heading = await TU.locator('div.panel-heading');
    // ??? expect(await page.innerText('div.panel-heading')).toBe('Login');
    expect(await heading.innerText()).toBe('Login');
  });

  test('rejects an invalid username/password combo with (only) a growl notification', async () => {
    // NOTE: This test should pass even though it generates an 'Unauthorized' console error
    await TU.input('LoginCtrl.credentials.username', 'undefineds');
    await TU.input('LoginCtrl.credentials.password', 'undefined1');
    await TU.buttons.submit();

    // Verify that we get a warning message
    await TU.waitForSelector('[data-notification-type="notification-danger"]');

    // Verify that we have not logged in
    expect(TU.getCurrentPath().endsWith('/login'));
  });

  test('has a default project value', async () => {
    const projectOptions = await TU.waitForSelector('select[name="project"]');
    const defaultProject = (await projectOptions.$('option:checked')).innerText();
    expect(defaultProject.length > 0);
  });

  test('page refresh preserves the user session', async () => {
    await TU.login();
    await TU.navigate(settings);
    await TU.reloadPage();
    const path = TU.getCurrentPath();
    expect(path.endsWith('/settings'));
  });

});
