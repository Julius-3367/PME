import { chromium } from 'playwright';

async function run() {
  const baseUrl = process.env.UI_BASE || 'http://localhost:5173/login.html';
  const mockApiBase = process.env.MOCK_API_BASE || 'http://localhost:4000';

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Navigate to login page
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  // Add instance URL
  await page.fill('#api-url', mockApiBase);
  await page.click('#add-instance');

  // wait for roles to load OR for onboarding token container to appear
  // Wait for either roles to be populated or for onboarding token container to appear.
  // Use page.waitForFunction to avoid visibility issues with <option> elements.
  try {
    await Promise.race([
      page.waitForFunction(() => {
        const sel = document.querySelector('#account');
        return sel && sel.options && sel.options.length > 0;
      }, { timeout: 5000 }),
      page.waitForSelector('#onboard-token-container', { state: 'visible', timeout: 5000 }),
    ]);
  } catch (e) {
    // ignore - we'll check below
  }

  // If onboarding token container is visible, set token and save
  const tokenVisible = await page.isVisible('#onboard-token-container').catch(() => false);
  if (tokenVisible) {
    await page.fill('#onboard-token', 'onboard-secret');
    await page.click('#save-onboard');
    // wait for roles to populate after saving token
    await page.waitForFunction(() => {
      const sel = document.querySelector('#account');
      return sel && sel.options && sel.options.length > 0;
    }, { timeout: 5000 });
  }

  // Select role
  await page.selectOption('#account', 'admin');

  // Enter credentials
  await page.fill('#username', 'demoaccount@gmail.com');
  await page.fill('#password', 'R5N2h4t');

  // Click Login and wait for redirect to index.html
  await page.click('#login-btn');
  // wait for navigation away from login page
  await page.waitForFunction(() => location.pathname !== '/login.html' && location.pathname !== '/');
  const newUrl = page.url();
  console.log('navigated to', newUrl);
  if (!newUrl.includes('index.html') && !newUrl.endsWith('/')) {
    console.error('Unexpected URL after login:', newUrl);
    process.exit(1);
  }

  console.log('UI test: login flow succeeded');
  await browser.close();
}

run().catch((e) => {
  console.error('UI test failed:', e);
  process.exit(1);
});
