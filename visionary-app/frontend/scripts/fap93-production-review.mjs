import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

// Run against a production build served by vite preview. All auth responses
// are fictional and no external service is contacted.
const origin = process.env.VISIONARY_REVIEW_ORIGIN || 'http://localhost:5173';
const browser = await puppeteer.launch({ headless: true });
try {
  const context = await browser.createBrowserContext();
  let profile = { id: 'fap93-review', full_name: 'Review Account', identity: 'student', onboarding_complete: true, auth_features: { global_sign_out: true } };
  const learningId = '30ec069b-f5c7-41c1-820d-d487a666d838';
  let learningStatus = 'active';
  let closeAttempts = 0;
  let firstCloseCommand;
  let signOutAllRequests = 0;
  let personalWorkspace = null;
  let provisionCommandId = null;
  let provisionAttempts = 0;
  let privacyAvailable = false;
  let consentState = 'active';
  let withdrawalRequests = 0;
  let sharedWorkspace = null;
  async function open(path, device = context) {
    const page = await device.newPage();
    await page.setViewport({ width: 390, height: 844 });
    const errors = []; page.setDefaultTimeout(8000);
    page.on('pageerror', error => errors.push(error.message));
    await page.evaluateOnNewDocument(() => {
      for (const method of ['setItem', 'getItem', 'removeItem']) {
        Storage.prototype[method] = () => { throw Error('Browser storage accessed'); };
      }
    });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.origin !== origin) return request.abort();
      if (url.pathname === '/api/auth/me') return request.respond({
        status: profile ? 200 : 401, contentType: 'application/json',
        body: JSON.stringify(profile || { message: 'Sign in to continue.' }),
      });
      if (url.pathname === '/api/auth/csrf') return request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'fixture' }) });
      if (url.pathname === '/api/auth/profile') {
        const input = JSON.parse(request.postData());
        assert.equal(request.headers()['x-visionary-account'], profile.id);
        if (input.expectedProfileName !== profile.full_name) return request.respond({ status: 409, contentType: 'application/json', body: '{}' });
        profile = { ...profile, full_name: input.full_name };
        return request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) });
      }
      const learningPath = '/api/account/learning/sessions/' + learningId;
      const learningRecord = () => ({
        version: 1, uid: profile.id, sessionId: learningId, workspaceId: 'fixture-personal',
        concept: { conceptId: 'Measurement uncertainty', sourceVersion: 'source-v1', criteriaVersion: 'criteria-v1' },
        status: learningStatus, phase: 'check_passed', revision: 3, updatedAt: '2026-11-14T12:00:00Z',
      });
      if (url.pathname === learningPath || url.pathname === learningPath + '/cancel') {
        assert.equal(request.headers()['x-visionary-account'], profile.id);
        if (url.pathname.endsWith('/cancel')) {
          assert.equal(request.headers()['x-csrf-token'], 'fixture');
          const body = JSON.parse(request.postData());
          assert.deepEqual(body, { version: 1, commandId: body.commandId, expectedRevision: 3, workspaceId: 'fixture-personal', sourceVersion: 'source-v1', criteriaVersion: 'criteria-v1' });
          if (++closeAttempts === 1) {
            firstCloseCommand = body.commandId;
            return request.respond({ status: 409, contentType: 'application/json', body: '{}' });
          }
          assert.notEqual(body.commandId, firstCloseCommand);
          learningStatus = 'cancelled';
        }
        return request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(learningRecord()) });
      }
      if (url.pathname === '/api/account/learning/sessions') {
        assert.equal(request.headers()['x-visionary-account'], profile.id);
        return request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({
          version: 1, uid: profile.id, nextCursor: null,
          items: [learningRecord()],
        }) });
      }
      if (url.pathname === '/api/overview/workspaces') {
        assert.equal(request.headers()['x-visionary-account'], profile.id);
        if (!personalWorkspace) return request.respond({ status: 403, contentType: 'application/json', body: '{}' });
        return request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({
          items: [personalWorkspace, sharedWorkspace].filter(Boolean), nextCursor: null, hasMore: false,
        }) });
      }
      if (url.pathname === '/api/account/invitations/accept') {
        assert.equal(request.headers()['x-visionary-account'], profile.id);
        assert.equal(request.headers()['x-csrf-token'], 'fixture');
        if (JSON.parse(request.postData()).token !== 'B'.repeat(43)) {
          return request.respond({ status: 410, contentType: 'application/json', body: '{}' });
        }
        sharedWorkspace = { id: 'fixture-shared', name: 'Shared workspace fixture', isPersonal: false, role: 'MEMBER' };
        return request.respond({ status: 201, contentType: 'application/json', body: JSON.stringify({
          invitationId: 'fixture-invite', workspaceId: sharedWorkspace.id, role: 'MEMBER', replay: false,
        }) });
      }
      if (url.pathname === '/api/account/workspace/provision') {
        assert.equal(request.headers()['x-visionary-account'], profile.id);
        assert.equal(request.headers()['x-csrf-token'], 'fixture');
        const body = JSON.parse(request.postData());
        assert.equal(body.payload.source, 'manual');
        provisionCommandId ??= body.commandId;
        assert.equal(body.commandId, provisionCommandId);
        if (++provisionAttempts === 1) return request.respond({ status: 503, contentType: 'application/json', body: '{}' });
        personalWorkspace = { id: 'fixture-personal', name: 'Personal workspace fixture', isPersonal: true, role: 'OWNER' };
        return request.respond({ status: 201, contentType: 'application/json', body: JSON.stringify({ personalWorkspaceId: personalWorkspace.id }) });
      }
      if (url.pathname === '/api/account/privacy/consents' || url.pathname === '/api/account/privacy/consents/revoke') {
        assert.equal(request.headers()['x-visionary-account'], profile.id);
        if (url.pathname.endsWith('/revoke')) {
          ++withdrawalRequests;
          assert.equal(request.headers()['x-csrf-token'], 'fixture');
          assert.deepEqual(JSON.parse(request.postData()), { grantId: 'fixture-grant' });
          consentState = 'revoked';
          return request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({
            version: 1, uid: profile.id, id: 'fixture-grant', revokedAt: '2026-11-14T12:00:00Z',
          }) });
        }
        return request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({
          version: 1, uid: profile.id, available: true, nextCursor: null,
          grants: [{ id: 'fixture-grant', purpose: 'Share progress', state: consentState }],
        }) });
      }
      if (url.pathname === '/api/account/privacy/policy') {
        assert.equal(request.headers()['x-visionary-account'], profile.id);
        if (!privacyAvailable) return request.respond({ status: 503, contentType: 'application/json', body: '{}' });
        const classes = ['auth_device', 'learning_text', 'source_files', 'billing_audit', 'model_artifacts', 'admission_proof', 'voice_transcript', 'offline_pack', 'pilot_feedback'];
        return request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({
          version: 1, uid: profile.id, approvalState: 'approved', policyVersion: 'fixture-policy', policyDigest: 'a'.repeat(64),
          approvedBy: { name: 'Fixture reviewer', role: 'Test owner' },
          preservation: { automaticPurge: false, defaultTraining: false, under18Activation: 'blocked' },
          capabilities: { policyReference: true, cloudErasure: false, guardianVerification: false, automaticTraining: false },
          dataClasses: classes.map(dataClass => ({ dataClass, purpose: 'Fixture purpose', retention: 'owner_controlled', permittedFields: ['uid'] })),
        }) });
      }
      if (url.pathname === '/api/account/devices') {
        assert.equal(request.headers()['x-visionary-account'], profile.id);
        return request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({
          uid: profile.id, nextCursor: null, items: [{ id: 'fixture-session', current: true, status: 'active', lastSeenAt: '2026-11-14T12:00:00Z' }],
        }) });
      }
      if (url.pathname === '/api/auth/logout-all') {
        signOutAllRequests++;
        assert.equal(request.headers()['x-visionary-account'], profile.id);
        assert.equal(request.headers()['x-csrf-token'], 'fixture');
        return request.respond({ status: 503, contentType: 'application/json', body: '{}' });
      }
      if (url.pathname === '/api/auth/logout') {
        profile = null;
        return request.respond({ status: 200, contentType: 'application/json', body: '{}' });
      }
      if (url.pathname.startsWith('/api/')) return request.abort();
      return request.continue();
    });
    await page.goto(origin + path);
    return { page, errors };
  }
  for (const [identity, path, capability] of [
    ['student', 'practice', 'Practice, projects'],
    ['teacher', 'classes', 'Classrooms, assignments'],
    ['parent', 'child', 'Guardian connections'],
    ['professional', 'career', 'Career goals'],
    ['organization', 'cohorts', 'Cohorts, curriculum'],
  ]) {
    profile = { ...profile, identity };
    const role = await open('/dashboard/' + path);
    await role.page.waitForFunction(text => document.body.innerText.includes(text), {}, capability);
    assert.equal(new URL(role.page.url()).pathname, '/dashboard/' + path);
    assert.deepEqual(await role.page.evaluate(() => [localStorage.length, sessionStorage.length]), [0, 0]);
    assert.deepEqual(role.errors, []);
    await role.page.close();
  }
  profile = { ...profile, identity: 'student' };
  const home = await open('/dashboard/home');
  await home.page.waitForFunction(() => document.querySelector('h1')?.textContent === 'Your Visionary account');
  await home.page.reload();
  await home.page.waitForFunction(() => document.querySelector('h1')?.textContent === 'Your Visionary account');
  const workspace = await open('/dashboard/classes');
  await workspace.page.waitForFunction(() => document.querySelector('h1')?.textContent === 'This workspace page is unavailable');
  const learning = await open('/dashboard/learn');
  await learning.page.waitForFunction(() => document.body.innerText.includes('Measurement uncertainty'));
  await learning.page.locator('::-p-aria(Close session)').click();
  assert.equal(closeAttempts, 0);
  await learning.page.locator('::-p-aria(Confirm close)').click();
  await learning.page.waitForFunction(() => document.body.innerText.includes('This session changed on another device.'));
  assert.equal(learningStatus, 'active');
  await learning.page.locator('::-p-aria(Close session)').click();
  await learning.page.locator('::-p-aria(Confirm close)').click();
  await learning.page.waitForFunction(() => document.body.innerText.includes('Learning session closed.'));
  await learning.page.reload();
  await learning.page.waitForFunction(() => document.body.innerText.includes('Closed ·'));
  assert.equal(closeAttempts, 2);
  const edit = await open('/dashboard/profile');
  const secondContext = await browser.createBrowserContext();
  const second = await open('/dashboard/profile', secondContext);
  await second.page.waitForSelector('#connected-display-name');
  await edit.page.bringToFront();
  await edit.page.locator('#connected-display-name').fill('Updated account');
  await edit.page.click('form button');
  await edit.page.waitForFunction(() => document.body.innerText.includes('Display name saved to your account.'));
  await second.page.bringToFront();
  await second.page.locator('::-p-aria(Refresh profile)').click();
  await second.page.waitForFunction(() => document.querySelector('#connected-display-name')?.value === 'Updated account');
  await second.page.reload();
  await second.page.waitForFunction(() => document.querySelector('#connected-display-name')?.value === 'Updated account');
  const spaces = await open('/dashboard/connections');
  const setupButton = spaces.page.locator('::-p-aria(Set up personal workspace)');
  await setupButton.click();
  await spaces.page.waitForFunction(() => document.body.innerText.includes('Workspace setup is unavailable'));
  assert.equal(await spaces.page.evaluate(() => document.body.innerText.includes('Your personal workspace is ready.')), false);
  await setupButton.click();
  await spaces.page.waitForFunction(() => document.body.innerText.includes('Your personal workspace is ready.'));
  assert.equal(provisionAttempts, 2);
  const codeInput = spaces.page.locator('#workspace-invitation');
  await codeInput.fill('A'.repeat(43));
  await spaces.page.locator('::-p-aria(Accept invitation)').click();
  await spaces.page.waitForFunction(() => document.body.innerText.includes('This invitation is no longer active.'));
  await codeInput.fill('B'.repeat(43));
  await spaces.page.locator('::-p-aria(Accept invitation)').click();
  await spaces.page.waitForFunction(() => document.body.innerText.includes('Shared workspace fixture'));
  assert.equal(await spaces.page.$eval('#workspace-invitation', input => input.value), '');
  const spacesOnSecondDevice = await open('/dashboard/connections', secondContext);
  await spacesOnSecondDevice.page.waitForFunction(() => document.body.innerText.includes('Personal workspace fixture'));
  await spacesOnSecondDevice.page.reload();
  await spacesOnSecondDevice.page.waitForFunction(() => document.body.innerText.includes('Shared workspace fixture'));
  await spacesOnSecondDevice.page.waitForFunction(() => document.body.innerText.includes('Personal workspace fixture'));
  const privacy = await open('/dashboard/privacy');
  await privacy.page.waitForFunction(() => document.body.innerText.includes('The approved policy is unavailable'));
  privacyAvailable = true;
  await privacy.page.locator('::-p-aria(Retry policy)').click();
  await privacy.page.waitForFunction(() => document.body.innerText.includes('Approved by Fixture reviewer'));
  await privacy.page.locator('::-p-aria(Withdraw consent)').click();
  assert.equal(withdrawalRequests, 0);
  await privacy.page.locator('::-p-aria(Confirm withdrawal)').click();
  await privacy.page.waitForFunction(() => document.body.innerText.includes('Consent revoked.'));
  await privacy.page.reload();
  await privacy.page.waitForFunction(() => document.body.innerText.includes('Share progress · Revoked'));
  assert.equal(withdrawalRequests, 1);
  const security = await open('/dashboard/settings');
  await security.page.waitForFunction(() => document.body.innerText.includes('This browser'));
  await security.page.locator('::-p-aria(Sign out on all devices)').click();
  assert.equal(signOutAllRequests, 0);
  await security.page.locator('::-p-aria(Confirm sign-out)').click();
  await security.page.waitForFunction(() => document.body.innerText.includes('Could not confirm sign-out'));
  assert.equal(signOutAllRequests, 1);
  await security.page.locator('::-p-aria(Cancel)').click();
  const cookies = await open('/cookies');
  await cookies.page.waitForFunction(() => [...document.querySelectorAll('[role="switch"]')].length === 3);
  assert.equal(await cookies.page.$$eval('[role="switch"]:not(:disabled)', switches => switches.length), 0);
  for (const { page } of [home, workspace, cookies, edit, learning, second, security, spaces, spacesOnSecondDevice, privacy]) {
    assert.deepEqual(await page.evaluate(() => [localStorage.length, sessionStorage.length]), [0, 0]);
  }
  await home.page.bringToFront(); await home.page.click('header button');
  await workspace.page.bringToFront(); await workspace.page.waitForFunction(() => location.pathname === '/login', { polling: 100 }).catch(async error => { throw new Error('Cross-tab logout: ' + workspace.page.url() + ' / ' + await home.page.evaluate(() => document.body.innerText), { cause: error }); });
  await home.page.waitForFunction(() => location.pathname === '/login', { polling: 100 });
  for (const { errors } of [home, workspace, cookies, edit, learning, second, security, spaces, spacesOnSecondDevice, privacy]) assert.deepEqual(errors, []);
  profile = { id: 'new-fap93-review', full_name: 'New Account', onboarding_complete: false };
  const setup = await open('/onboarding');
  await setup.page.waitForFunction(() => document.body.innerText.includes('I am a Learner'));
  assert.deepEqual(await setup.page.evaluate(() => [localStorage.length, sessionStorage.length]), [0, 0]);
  assert.deepEqual(setup.errors, []);
  console.log('Production browser: profile sync and reload, saved learning and session closure, workspace setup and reload, privacy policy recovery and consent withdrawal, account sessions and revocation failure, five role boundaries, cookies, cross-tab logout and first-run setup passed.');
} finally {
  await browser.close();
}
