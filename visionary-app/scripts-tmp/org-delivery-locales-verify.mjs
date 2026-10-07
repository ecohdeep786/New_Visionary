import { primaryWorkspaceCopy } from '../src/lib/primaryWorkspaceCopy.js';
import { organizationAuthorCopy } from '../src/lib/organizationAuthorCopy.js';
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
const base = process.env.VISIONARY_BASE || 'http://127.0.0.1:4191';
for (const locale of ['en', 'hi', 'bn']) {
  const t = organizationAuthorCopy(locale);
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-proxy-server']
  });
  const context = await browser.newContext({
    viewport: {
      width: 390,
      height: 844
    }
  });
  await context.addInitScript(() => {
    if (localStorage.getItem('visionary_workspace_v2')) return;
    const users = ['owner', 'admin', 'teacher'].map(name => {
      const role = name === 'teacher' ? 'teacher' : 'organization';
      return {
        id: `delivery-${name}`,
        email: `${name}@delivery.test`,
        full_name: name,
        identity: role,
        roles: [role],
        age_band: 'adult',
        onboarding_complete: true
      };
    });
    const empty = () => ({
      conversations: [],
      sessions: [],
      artifacts: [],
      resources: [],
      notifications: [],
      audit: [],
      preferences: {
        locale: 'en',
        interfaceLocale: 'en',
        voice: false,
        memory: true
      },
      subscription: {
        plan: 'Free',
        state: 'active',
        invoices: [],
        usage: 0,
        usageDay: new Date().toISOString().slice(0, 10)
      },
      legacyImported: false
    });
    localStorage.setItem('visionary_entity_Classroom', JSON.stringify([{
      id: 'delivery-class',
      name: 'Equal parts class',
      subject: 'Mathematics',
      teacher_id: 'delivery-teacher',
      teacher_email: 'teacher@delivery.test',
      organization_email: 'owner@delivery.test',
      join_code: 'DELIVERY'
    }]));
    localStorage.setItem('visionary_users', JSON.stringify(users));
    localStorage.setItem('visionary_sessions', JSON.stringify(users.map(user => ({
      token: user.id,
      userId: user.id,
      email: user.email,
      expiresAt: Date.now() + 86400000
    }))));
    localStorage.setItem('visionary_session_token', users[0].id);
    localStorage.setItem('visionary_workspace_v2', JSON.stringify({
      version: 2,
      people: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.full_name,
        ageBand: 'adult',
        roles: [user.identity]
      })),
      workspaces: users.map(user => ({
        id: `${user.id}:${user.identity}`,
        personId: user.id,
        role: user.identity,
        name: 'Personal',
        lastPath: '/dashboard/home'
      })),
      active: Object.fromEntries(users.map(user => [user.id, `${user.id}:${user.identity}`])),
      relationships: [],
      data: Object.fromEntries(users.map(user => [`${user.id}:${user.identity}`, empty()]))
    }));
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(60000);
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  async function enter(name, path) {
    await page.evaluate(name => localStorage.setItem('visionary_session_token', `delivery-${name}`), name);
    await page.goto(`${base}${path}`, {
      waitUntil: 'networkidle'
    });
  }
  async function work(name) {
    await page.evaluate(name => {
      const db = JSON.parse(localStorage.getItem('visionary_workspace_v2'));
      const role = name === 'teacher' ? 'teacher' : 'organization';
      db.active[`delivery-${name}`] = `delivery-${name}:${role}:org:owner@delivery.test`;
      localStorage.setItem('visionary_workspace_v2', JSON.stringify(db));
    }, name);
  }
  async function invite(name, role) {
    await enter('owner', '/dashboard/people');
    await page.getByLabel('Visionary account email').fill(`${name}@delivery.test`);
    await page.getByLabel('Workspace role').selectOption(role);
    if (role === 'organization') await page.getByLabel('Administrative permission', {
      exact: true
    }).selectOption('academic-admin');
    await page.getByRole('button', {
      name: 'Request connection',
      exact: true
    }).click();
    await page.getByText(/Request saved locally/).waitFor();
    await enter(name, '/dashboard/connections');
    await page.getByRole('button', {
      name: 'Accept',
      exact: true
    }).click();
    await page.getByText('Connection accepted.', {
      exact: true
    }).waitFor();
    await work(name);
  }
  try {
    await page.goto(`${base}/dashboard/people`, {
      waitUntil: 'networkidle'
    });
    await invite('admin', 'organization');
    await invite('teacher', 'teacher');
    await page.evaluate(locale => {
      const db = JSON.parse(localStorage.getItem('visionary_workspace_v2'));
      for (const data of Object.values(db.data)) data.preferences.interfaceLocale = locale;
      localStorage.setItem('visionary_workspace_v2', JSON.stringify(db));
    }, locale);
    await enter('admin', '/dashboard/library');
    await page.getByRole('button', {
      name: t("New content draft")
    }).click();
    await page.getByLabel(t("Content title"), {
      exact: true
    }).fill('Equal parts teaching resource');
    await page.getByLabel(t("Content and learning objective")).fill('Identify equal parts of a whole.');
    await page.getByLabel(t("Source and exact version")).fill('Fictional delivery fixture v1');
    await page.getByRole('button', {
      name: t("Save content draft"),
      exact: true
    }).click();
    await page.getByRole('button', {
      name: t("Submit saved revision")
    }).click();
    await enter('owner', '/dashboard/library');
    await page.getByRole('button', {
      name: /^Equal parts teaching resource/
    }).click();
    await page.getByLabel(t("Review note"), {
      exact: true
    }).fill('Reviewed only for this fictional workflow.');
    for (const label of ['Source and version checked', 'Accuracy and objective checked', 'Language and accessibility checked']) await page.getByLabel(t(label), {
      exact: true
    }).check();
    await page.getByRole('button', {
      name: t("Approve saved revision")
    }).click();
    await page.getByLabel(t("Accepted teacher")).selectOption('teacher@delivery.test');
    await page.getByRole('button', {
      name: t("Confirm approved copy delivery")
    }).click();
    await page.getByRole('status').getByText(t('Approved copy is available in this teacher’s Work preparation inbox on this browser. No email sent.'), {
      exact: true
    }).waitFor();
    await enter('teacher', '/dashboard/prepare');
    await page.getByRole('heading', {
      name: 'Equal parts teaching resource · '+t('Source revision {revision}',{revision:1})
    }).waitFor();
    await page.getByText(t("Preview delivered content"), {
      exact: true
    }).click();
    await page.getByText('Identify equal parts of a whole.', {
      exact: true
    }).waitFor();
    await page.getByRole('button', {
      name: t("Copy to my preparation drafts")
    }).click();
    await page.getByLabel(t("Outline and notes")).fill('Teacher adaptation: explain equal parts with a paper model.');
    await page.getByLabel(t("Status"), {
      exact: true
    }).selectOption('reviewed');
    await page.getByRole('button', {
      name: t("Save draft"),
      exact: true
    }).click();
    await page.reload({
      waitUntil: 'networkidle'
    });
    await page.getByRole('button', {
      name: t("Open my preparation copy")
    }).waitFor();
    await page.screenshot({
      path: `scripts-tmp/org-delivery-inbox-${locale}.png`,
      fullPage: true
    });
    await page.getByRole('button', {
      name: t("Open my preparation copy")
    }).click();
    await page.getByRole('button', {
      name: t("Assign reviewed lesson")
    }).click();
    await page.getByLabel(t("Class"), {
      exact: true
    }).selectOption('delivery-class');
    await page.getByRole('button', {
      name: t("Confirm assignment"),
      exact: true
    }).click();
    await page.getByText(t('Assigned. A reviewed copy is now available to this class. Later lesson edits do not change this copy.'), {
      exact: true
    }).first().waitFor();
    const assignment = await page.evaluate(() => JSON.parse(localStorage.getItem('visionary_entity_Assignment')).find(row => row.class_id === 'delivery-class'));
    assert.equal(assignment.description, 'Teacher adaptation: explain equal parts with a paper model.');
    assert.equal(assignment.source_provenance.revision, 1);
    assert.equal(assignment.source_provenance.source, 'Fictional delivery fixture v1');
    await page.getByLabel(t("Outline and notes")).fill('Unsaved teacher resource edits');
    await page.waitForFunction(() => localStorage.getItem('visionary_resource_editor_v1')?.includes('Unsaved teacher resource edits'));
    await page.reload({
      waitUntil: 'networkidle'
    });
    await page.getByRole('button', {
      name: t("Open my preparation copy")
    }).click();
    await page.getByText(t("Unsaved resource edits were recovered from this device. Save to keep them."), {
      exact: true
    }).waitFor();
    assert.equal(await page.getByLabel(t("Outline and notes")).inputValue(), 'Unsaved teacher resource edits');
    await page.screenshot({
      path: `scripts-tmp/org-delivery-recovery-${locale}.png`,
      fullPage: true
    });
    await page.getByLabel(t("Outline and notes")).fill('Teacher adaptation: explain equal parts with a paper model.');
    await page.getByRole('button', {
      name: t("Save draft"),
      exact: true
    }).click();
    await enter('owner', '/dashboard/library');
    await page.getByRole('button', {
      name: /^Equal parts teaching resource/
    }).click();
    await page.getByRole('button', {
      name: t("Open new draft revision")
    }).click();
    await page.getByLabel(t("Content and learning objective")).fill('Later organization version, still a draft.');
    await page.getByRole('button', {
      name: t("Save content draft"),
      exact: true
    }).click();
    await enter('teacher', '/dashboard/prepare');
    await page.getByRole('button', {
      name: t("Open my preparation copy")
    }).click();
    assert.equal(await page.getByLabel(t("Outline and notes")).inputValue(), 'Teacher adaptation: explain equal parts with a paper model.');
    await page.keyboard.press('Escape');
    await page.getByText(t("Preview delivered content"), {
      exact: true
    }).click();
    await page.getByText('Identify equal parts of a whole.', {
      exact: true
    }).waitFor();
    assert.equal(await page.getByText('Later organization version, still a draft.', {
      exact: true
    }).count(), 0);
    await enter('owner', '/dashboard/people');
    const row = page.locator('article').filter({
      has: page.getByRole('heading', {
        name: 'teacher@delivery.test',
        exact: true
      })
    });
    await row.getByRole('button', {
      name: primaryWorkspaceCopy(locale)('Disconnect'),
      exact: true
    }).click();
    await page.getByText(primaryWorkspaceCopy(locale)('Connection updated.'), {
      exact: true
    }).waitFor();
    await enter('teacher', '/dashboard/prepare');
    assert.equal(await page.getByRole('heading', {
      name: 'Equal parts teaching resource · '+t('Source revision {revision}',{revision:1})
    }).count(), 0);
    assert.deepEqual(errors, []);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    console.log('390px reviewed organization delivery → accepted teacher Work inbox → private reviewed adaptation → source/edit isolation → revocation passed.');
  } catch (error) {
    console.log(await page.locator('body').innerText());
    console.log(errors);
    throw error;
  } finally {
    await browser.close();
  }
}


