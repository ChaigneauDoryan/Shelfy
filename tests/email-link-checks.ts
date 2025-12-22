import assert from 'node:assert';
import { buildActionLink, buildLoginLink, setEmailLinkBaseUrl } from '../src/lib/email-link';
import { actionLinkStore, actionLinkStoreTestUtils } from '../src/lib/action-link-store';

function runEmailLinkBuilderChecks() {
  setEmailLinkBaseUrl('https://app.test');
  assert.strictEqual(
    buildActionLink('/groups/123?tab=settings'),
    'https://app.test/groups/123?tab=settings'
  );
  const loginLink = buildLoginLink('/groups/456');
  assert(loginLink.includes('https://app.test/auth/login'));
  assert(loginLink.includes('next=%2Fgroups%2F456'));

  setEmailLinkBaseUrl('https://app.test/base');
  assert.strictEqual(
    buildActionLink('/base/dashboard'),
    'https://app.test/base/dashboard'
  );
  const loginWithBase = buildLoginLink('/base/dashboard');
  assert(loginWithBase.includes('next=%2Fbase%2Fdashboard'));

  assert.throws(() => buildActionLink('https://malicious.com/steal'));
}

function runActionLinkStoreChecks() {
  actionLinkStoreTestUtils.reset();
  assert.strictEqual(actionLinkStore.getPendingLink(), null);
  actionLinkStore.setPendingLink('/groups/1');
  assert.strictEqual(actionLinkStore.getPendingLink(), '/groups/1');
  const consumed = actionLinkStore.consumePendingLink();
  assert.strictEqual(consumed, '/groups/1');
  assert.strictEqual(actionLinkStore.getPendingLink(), null);
  actionLinkStore.setPendingLink('');
  assert.strictEqual(actionLinkStore.getPendingLink(), null);
}

function runAllChecks() {
  runEmailLinkBuilderChecks();
  runActionLinkStoreChecks();
  console.log('Email link helpers validated successfully.');
}

runAllChecks();
