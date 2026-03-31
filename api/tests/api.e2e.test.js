/**
 * E2E Integration Tests for Lunes Explorer API
 * Tests: Health, Projects CRUD, Social interactions, Verification
 * 
 * Run: cd api && npm test
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

// Set test env before importing app
process.env.NODE_ENV = 'test';

const { default: app } = await import('../server.js');

let server;
let BASE;

// ── Helpers ──────────────────────────────────────────────────────────

async function req(method, path, body) {
  const url = `${BASE}${path}`;
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

const GET    = (path)       => req('GET', path);
const POST   = (path, body) => req('POST', path, body);
const PUT    = (path, body) => req('PUT', path, body);
const DELETE = (path)       => req('DELETE', path);

// ── Setup / Teardown ──────────────────────────────────────────────────

before(async () => {
  await new Promise((resolve) => {
    server = createServer(app);
    server.listen(0, () => {
      const { port } = server.address();
      BASE = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(() => {
  server?.close();
});

// ══════════════════════════════════════════════════════════════════════
//  1. HEALTH
// ══════════════════════════════════════════════════════════════════════

describe('Health', () => {
  it('GET /api/health → 200 with status ok', async () => {
    const { status, json } = await GET('/api/health');
    assert.equal(status, 200);
    assert.equal(json.status, 'ok');
    assert.ok(json.timestamp);
  });
});

// ══════════════════════════════════════════════════════════════════════
//  2. PROJECTS CRUD
// ══════════════════════════════════════════════════════════════════════

describe('Projects CRUD', () => {
  const testProject = {
    name: 'E2E Test Project',
    slug: 'e2e-test-project',
    description: 'Created by E2E test suite',
    category: 'defi',
    ownerAddress: '5TestAddress1234567890abcdefghijklmnopqrst',
    links: { website: 'https://e2e-test.lunes.io' },
  };

  it('GET /api/projects → 200 returns array', async () => {
    const { status, json } = await GET('/api/projects');
    assert.equal(status, 200);
    assert.ok(Array.isArray(json));
  });

  it('POST /api/projects → 201 creates a project', async () => {
    const { status, json } = await POST('/api/projects', testProject);
    assert.equal(status, 201);
    assert.equal(json.slug, testProject.slug);
    assert.equal(json.name, testProject.name);
    assert.equal(json.ownerAddress, testProject.ownerAddress);
  });

  it('POST /api/projects duplicate → 409 conflict', async () => {
    const { status, json } = await POST('/api/projects', testProject);
    assert.equal(status, 409);
    assert.ok(json.error);
  });

  it('GET /api/projects/:slug → 200 fetches created project', async () => {
    const { status, json } = await GET(`/api/projects/${testProject.slug}`);
    assert.equal(status, 200);
    assert.equal(json.slug, testProject.slug);
    assert.equal(json.name, testProject.name);
    assert.ok(json.social); // should have social stats attached
  });

  it('GET /api/projects/:slug → 404 for non-existent', async () => {
    const { status } = await GET('/api/projects/does-not-exist');
    assert.equal(status, 404);
  });

  it('PUT /api/projects/:slug → 200 updates project', async () => {
    const { status, json } = await PUT(`/api/projects/${testProject.slug}`, {
      description: 'Updated by E2E test',
      ownerAddress: testProject.ownerAddress,
    });
    assert.equal(status, 200);
    assert.equal(json.description, 'Updated by E2E test');
  });

  it('PUT /api/projects/:slug → 403 wrong owner', async () => {
    const { status, json } = await PUT(`/api/projects/${testProject.slug}`, {
      description: 'Should fail',
      ownerAddress: '5DifferentAddress999999999999999999999999',
    });
    assert.equal(status, 403);
    assert.ok(json.error.includes('owner'));
  });

  it('DELETE /api/projects/:slug → 200 deletes project', async () => {
    const { status, json } = await DELETE(`/api/projects/${testProject.slug}`);
    assert.equal(status, 200);
    assert.equal(json.ok, true);
  });

  it('GET /api/projects/:slug → 404 after delete', async () => {
    const { status } = await GET(`/api/projects/${testProject.slug}`);
    assert.equal(status, 404);
  });
});

// ══════════════════════════════════════════════════════════════════════
//  3. SOCIAL INTERACTIONS
// ══════════════════════════════════════════════════════════════════════

describe('Social Interactions', () => {
  const slug = 'pidchat';
  const user = '5SocialTestUser000000000000000000000000000';

  it('POST /api/social/like → toggles like ON', async () => {
    const { status, json } = await POST('/api/social/like', {
      projectSlug: slug,
      userAddress: user,
    });
    assert.equal(status, 200);
    assert.equal(json.action, 'added');
  });

  it('POST /api/social/like → toggles like OFF', async () => {
    const { status, json } = await POST('/api/social/like', {
      projectSlug: slug,
      userAddress: user,
    });
    assert.equal(status, 200);
    assert.equal(json.action, 'removed');
  });

  it('POST /api/social/follow → toggles follow ON', async () => {
    const { status, json } = await POST('/api/social/follow', {
      projectSlug: slug,
      userAddress: user,
    });
    assert.equal(status, 200);
    assert.equal(json.action, 'added');
  });

  it('GET /api/social/project/:slug → returns likes and follows', async () => {
    const { status, json } = await GET(`/api/social/project/${slug}`);
    assert.equal(status, 200);
    assert.ok('likes' in json);
    assert.ok('follows' in json);
    assert.ok('stats' in json);
  });

  it('GET /api/social/user/:address → returns user interactions', async () => {
    const { status, json } = await GET(`/api/social/user/${user}`);
    assert.equal(status, 200);
    assert.ok('likes' in json || 'follows' in json || Array.isArray(json));
  });

  it('POST /api/social/like → 400 missing fields', async () => {
    const { status } = await POST('/api/social/like', {});
    assert.equal(status, 400);
  });

  it('POST /api/social/follow → 400 missing fields', async () => {
    const { status } = await POST('/api/social/follow', { projectSlug: slug });
    assert.equal(status, 400);
  });

  // Cleanup: toggle follow back OFF
  after(async () => {
    await POST('/api/social/follow', { projectSlug: slug, userAddress: user });
  });
});

// ══════════════════════════════════════════════════════════════════════
//  4. VERIFICATION FLOW
// ══════════════════════════════════════════════════════════════════════

describe('Verification', () => {
  const slug = 'e2e-verify-project';
  const owner = '5VerifyTestOwner00000000000000000000000000';

  before(async () => {
    await POST('/api/projects', {
      name: 'Verify Test',
      slug,
      description: 'Testing verification flow',
      category: 'infrastructure',
      ownerAddress: owner,
    });
  });

  it('POST /api/projects/:slug/verify → submits verification', async () => {
    const { status, json } = await POST(`/api/projects/${slug}/verify`, {
      txHash: '0xabc123',
      payerAddress: owner,
    });
    assert.equal(status, 200);
    assert.ok(json.verificationStatus || json.slug);
  });

  it('POST /api/projects/:slug/review → approves verification', async () => {
    const { status, json } = await POST(`/api/projects/${slug}/review`, {
      decision: 'verified',
      reviewedBy: 'admin-test',
      notes: 'E2E approved',
    });
    assert.equal(status, 200);
    assert.ok(json.verificationStatus === 'verified' || json.slug);
  });

  it('POST /api/projects/:slug/review → 400 invalid decision', async () => {
    const { status } = await POST(`/api/projects/${slug}/review`, {
      decision: 'invalid',
    });
    assert.equal(status, 400);
  });

  after(async () => {
    await DELETE(`/api/projects/${slug}`);
  });
});

// ══════════════════════════════════════════════════════════════════════
//  5. FULL INTEGRATION: Create → Like → Follow → Read → Delete
// ══════════════════════════════════════════════════════════════════════

describe('Full Integration Flow', () => {
  const slug = 'e2e-full-flow';
  const user = '5FullFlowUser0000000000000000000000000000';

  it('complete project lifecycle', async () => {
    // 0. Cleanup leftover from previous runs
    await DELETE(`/api/projects/${slug}`);

    // 1. Create project
    const { status: createStatus } = await POST('/api/projects', {
      name: 'Full Flow',
      slug,
      description: 'Full lifecycle test',
      category: 'social',
      ownerAddress: user,
    });
    assert.equal(createStatus, 201);

    // 2. Like it (toggle until 'added')
    let likeRes = await POST('/api/social/like', { projectSlug: slug, userAddress: user });
    if (likeRes.json.action === 'removed') {
      likeRes = await POST('/api/social/like', { projectSlug: slug, userAddress: user });
    }
    assert.equal(likeRes.json.action, 'added');

    // 3. Follow it (toggle until 'added')
    let followRes = await POST('/api/social/follow', { projectSlug: slug, userAddress: user });
    if (followRes.json.action === 'removed') {
      followRes = await POST('/api/social/follow', { projectSlug: slug, userAddress: user });
    }
    assert.equal(followRes.json.action, 'added');

    // 4. Read project with social stats
    const { json: project } = await GET(`/api/projects/${slug}`);
    assert.equal(project.slug, slug);
    assert.ok(project.social);
    assert.ok(project.social.likes >= 1);
    assert.ok(project.social.follows >= 1);

    // 5. Check user interactions
    const { json: userInt } = await GET(`/api/social/user/${user}`);
    assert.ok(userInt);

    // 6. Update project
    const { json: updated } = await PUT(`/api/projects/${slug}`, {
      description: 'Updated in full flow',
      ownerAddress: user,
    });
    assert.equal(updated.description, 'Updated in full flow');

    // 7. Verify project
    await POST(`/api/projects/${slug}/verify`, {
      txHash: '0xfullflow',
      payerAddress: user,
    });
    const { json: reviewed } = await POST(`/api/projects/${slug}/review`, {
      decision: 'verified',
      reviewedBy: 'e2e-admin',
    });
    assert.equal(reviewed.verification.status, 'verified');

    // 8. Delete project
    const { status: delStatus } = await DELETE(`/api/projects/${slug}`);
    assert.equal(delStatus, 200);

    // 9. Confirm deleted
    const { status: gone } = await GET(`/api/projects/${slug}`);
    assert.equal(gone, 404);
  });
});
