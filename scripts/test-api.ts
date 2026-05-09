/**
 * Team Task Manager — API Test Suite
 *
 * This script tests all API endpoints end-to-end.
 * It uses the Supabase admin API to create test users (bypasses email validation),
 * then tests every endpoint with Bearer token auth.
 *
 * Usage: npx tsx scripts/test-api.ts
 */

import { createClient } from '@supabase/supabase-js';

// ─── Config ───────────────────────────────────────────────────
const API_BASE = 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables. Run with:');
  console.error('   npx tsx --env-file=.env.local scripts/test-api.ts');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Test state ───────────────────────────────────────────────
let aliceToken = '';
let bobToken = '';
let aliceId = '';
let bobId = '';
let projectId = '';
let taskId = '';
let passed = 0;
let failed = 0;

// ─── Helpers ──────────────────────────────────────────────────
async function api(
  method: string,
  path: string,
  token?: string,
  body?: object
): Promise<{ status: number; json: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();
  return { status: res.status, json };
}

function test(name: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

// ─── Setup: Create test users via admin API ───────────────────
async function setup() {
  console.log('\n🔧 SETUP — Creating test users via Supabase Admin API...\n');

  // Create Alice
  const { data: aliceData, error: aliceErr } =
    await admin.auth.admin.createUser({
      email: 'alice-test@taskmanager.local',
      password: 'password123',
      email_confirm: true,
      user_metadata: { full_name: 'Alice Smith' },
    });

  if (aliceErr) {
    // User might already exist from a previous test run
    if (aliceErr.message.includes('already been registered')) {
      console.log('  ℹ️  Alice already exists, fetching...');
      const { data: users } = await admin.auth.admin.listUsers();
      const alice = users?.users.find(
        (u) => u.email === 'alice-test@taskmanager.local'
      );
      if (!alice) throw new Error('Cannot find Alice');
      aliceId = alice.id;
    } else {
      throw new Error(`Failed to create Alice: ${aliceErr.message}`);
    }
  } else {
    aliceId = aliceData.user.id;
  }
  console.log(`  👤 Alice ID: ${aliceId}`);

  // Create Bob
  const { data: bobData, error: bobErr } =
    await admin.auth.admin.createUser({
      email: 'bob-test@taskmanager.local',
      password: 'password123',
      email_confirm: true,
      user_metadata: { full_name: 'Bob Jones' },
    });

  if (bobErr) {
    if (bobErr.message.includes('already been registered')) {
      console.log('  ℹ️  Bob already exists, fetching...');
      const { data: users } = await admin.auth.admin.listUsers();
      const bob = users?.users.find(
        (u) => u.email === 'bob-test@taskmanager.local'
      );
      if (!bob) throw new Error('Cannot find Bob');
      bobId = bob.id;
    } else {
      throw new Error(`Failed to create Bob: ${bobErr.message}`);
    }
  } else {
    bobId = bobData.user.id;
  }
  console.log(`  👤 Bob ID:   ${bobId}`);

  // Generate access tokens by signing in
  const aliceSignIn = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: 'alice-test@taskmanager.local',
  });

  // Use direct password sign-in to get tokens
  const aliceClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: aliceSession, error: aliceSignInErr } =
    await aliceClient.auth.signInWithPassword({
      email: 'alice-test@taskmanager.local',
      password: 'password123',
    });

  if (aliceSignInErr) throw new Error(`Alice sign-in failed: ${aliceSignInErr.message}`);
  aliceToken = aliceSession.session!.access_token;
  console.log(`  🔑 Alice token: ${aliceToken.substring(0, 30)}...`);

  const bobClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: bobSession, error: bobSignInErr } =
    await bobClient.auth.signInWithPassword({
      email: 'bob-test@taskmanager.local',
      password: 'password123',
    });

  if (bobSignInErr) throw new Error(`Bob sign-in failed: ${bobSignInErr.message}`);
  bobToken = bobSession.session!.access_token;
  console.log(`  🔑 Bob token:   ${bobToken.substring(0, 30)}...`);

  console.log('\n  ✅ Setup complete!\n');
}

// ─── Test Suites ──────────────────────────────────────────────

async function testHealthCheck() {
  console.log('📋 Health Check');
  const { status, json } = await api('GET', '/');
  test('GET / returns 200', status === 200);
  test('Response has API name', json.name === 'Team Task Manager API');
  test('Response has endpoints', !!json.endpoints);
}

async function testAuth() {
  console.log('\n🔐 AUTH ROUTES');

  // POST /api/auth/signup — test validation
  const { status: s1, json: j1 } = await api('POST', '/api/auth/signup', undefined, {
    email: '',
    password: '',
    full_name: '',
  });
  test('Signup rejects empty fields', s1 === 400 && j1.error !== null);

  // POST /api/auth/login
  const { status: s2, json: j2 } = await api('POST', '/api/auth/login', undefined, {
    email: 'alice-test@taskmanager.local',
    password: 'password123',
  });
  test('Login returns 200', s2 === 200);
  test('Login returns access_token', !!j2.data?.access_token);
  test('Login returns user object', !!j2.data?.user);

  // POST /api/auth/login — wrong password
  const { status: s3, json: j3 } = await api('POST', '/api/auth/login', undefined, {
    email: 'alice-test@taskmanager.local',
    password: 'wrongpassword',
  });
  test('Login rejects wrong password', s3 === 401 && j3.error !== null);

  // GET /api/auth/me — with valid token
  const { status: s4, json: j4 } = await api('GET', '/api/auth/me', aliceToken);
  test('GET /me returns 200', s4 === 200);
  test('GET /me returns profile', j4.data?.email === 'alice-test@taskmanager.local');
  test('GET /me has full_name', j4.data?.full_name === 'Alice Smith');

  // GET /api/auth/me — no token
  const { status: s5 } = await api('GET', '/api/auth/me');
  test('GET /me without token returns 401', s5 === 401);
}

async function testProjects() {
  console.log('\n📁 PROJECT ROUTES');

  // POST /api/projects — create project
  const { status: s1, json: j1 } = await api('POST', '/api/projects', aliceToken, {
    name: 'Test Project Alpha',
    description: 'A project for testing',
  });
  test('Create project returns 201', s1 === 201);
  test('Project has name', j1.data?.name === 'Test Project Alpha');
  test('Project has owner_id', j1.data?.owner_id === aliceId);
  projectId = j1.data?.id;
  console.log(`    📌 Project ID: ${projectId}`);

  // POST /api/projects — validation
  const { status: s2 } = await api('POST', '/api/projects', aliceToken, {
    name: '',
  });
  test('Create project rejects empty name', s2 === 400);

  // POST /api/projects — no auth
  const { status: s3 } = await api('POST', '/api/projects', undefined, {
    name: 'Unauthorized Project',
  });
  test('Create project without token returns 401', s3 === 401);

  // GET /api/projects
  const { status: s4, json: j4 } = await api('GET', '/api/projects', aliceToken);
  test('List projects returns 200', s4 === 200);
  test('Project list is array', Array.isArray(j4.data));
  test('Project list has our project', j4.data?.some((p: any) => p.id === projectId));
  test('Project has member_count', j4.data?.[0]?.member_count === 1);
  test('Project has role=admin', j4.data?.[0]?.role === 'admin');

  // GET /api/projects/[id]
  const { status: s5, json: j5 } = await api(
    'GET',
    `/api/projects/${projectId}`,
    aliceToken
  );
  test('Get project detail returns 200', s5 === 200);
  test('Detail has project object', !!j5.data?.project);
  test('Detail has members array', Array.isArray(j5.data?.members));
  test('Detail has task_counts', j5.data?.task_counts !== undefined);

  // PATCH /api/projects/[id]
  const { status: s6, json: j6 } = await api(
    'PATCH',
    `/api/projects/${projectId}`,
    aliceToken,
    { name: 'Renamed Project Alpha' }
  );
  test('Update project returns 200', s6 === 200);
  test('Project name updated', j6.data?.name === 'Renamed Project Alpha');

  // GET /api/projects — Bob has no projects
  const { status: s7, json: j7 } = await api('GET', '/api/projects', bobToken);
  test('Bob sees empty project list', s7 === 200 && j7.data?.length === 0);

  // GET /api/projects/[id] — Bob forbidden
  const { status: s8 } = await api(
    'GET',
    `/api/projects/${projectId}`,
    bobToken
  );
  test('Bob cannot access project (403)', s8 === 403);
}

async function testMembers() {
  console.log('\n👥 MEMBER ROUTES');

  // POST /api/projects/[id]/members — add Bob
  const { status: s1, json: j1 } = await api(
    'POST',
    `/api/projects/${projectId}/members`,
    aliceToken,
    { email: 'bob-test@taskmanager.local', role: 'member' }
  );
  test('Add member returns 201', s1 === 201);
  test('Member has correct role', j1.data?.role === 'member');
  test('Member has correct user_id', j1.data?.user_id === bobId);

  // POST — duplicate member
  const { status: s2 } = await api(
    'POST',
    `/api/projects/${projectId}/members`,
    aliceToken,
    { email: 'bob-test@taskmanager.local', role: 'member' }
  );
  test('Duplicate member returns 409', s2 === 409);

  // POST — Bob (member) tries to add someone
  const { status: s3 } = await api(
    'POST',
    `/api/projects/${projectId}/members`,
    bobToken,
    { email: 'nonexistent@test.com', role: 'member' }
  );
  test('Member cannot add members (403)', s3 === 403);

  // Now Bob should be able to access the project
  const { status: s4 } = await api(
    'GET',
    `/api/projects/${projectId}`,
    bobToken
  );
  test('Bob can now access project (200)', s4 === 200);

  // PATCH — change Bob's role to admin then back
  const { status: s5, json: j5 } = await api(
    'PATCH',
    `/api/projects/${projectId}/members/${bobId}`,
    aliceToken,
    { role: 'admin' }
  );
  test('Update member role returns 200', s5 === 200);
  test('Bob role changed to admin', j5.data?.role === 'admin');

  // Change back to member for task RBAC tests
  await api(
    'PATCH',
    `/api/projects/${projectId}/members/${bobId}`,
    aliceToken,
    { role: 'member' }
  );
}

async function testTasks() {
  console.log('\n📝 TASK ROUTES');

  // POST /api/tasks — Alice (admin) creates task
  const { status: s1, json: j1 } = await api('POST', '/api/tasks', aliceToken, {
    project_id: projectId,
    title: 'Build login page',
    description: 'Create the login form',
    priority: 'high',
    assigned_to: bobId,
    due_date: '2025-01-01', // overdue on purpose for dashboard test
  });
  test('Create task returns 201', s1 === 201);
  test('Task has correct title', j1.data?.title === 'Build login page');
  test('Task has status=todo', j1.data?.status === 'todo');
  test('Task has priority=high', j1.data?.priority === 'high');
  test('Task assigned to Bob', j1.data?.assigned_to === bobId);
  taskId = j1.data?.id;
  console.log(`    📌 Task ID: ${taskId}`);

  // Create a second task for count tests
  await api('POST', '/api/tasks', aliceToken, {
    project_id: projectId,
    title: 'Write tests',
    status: 'done',
    priority: 'medium',
    assigned_to: aliceId,
  });

  // POST — Bob (member) tries to create task
  const { status: s2 } = await api('POST', '/api/tasks', bobToken, {
    project_id: projectId,
    title: 'Unauthorized task',
  });
  test('Member cannot create tasks (403)', s2 === 403);

  // POST — validation
  const { status: s3 } = await api('POST', '/api/tasks', aliceToken, {
    project_id: projectId,
    title: '',
  });
  test('Create task rejects empty title', s3 === 400);

  // GET /api/tasks?projectId=...
  const { status: s4, json: j4 } = await api(
    'GET',
    `/api/tasks?projectId=${projectId}`,
    aliceToken
  );
  test('List tasks returns 200', s4 === 200);
  test('Task list is array', Array.isArray(j4.data));
  test('Has 2 tasks', j4.data?.length === 2);

  // GET /api/tasks?projectId=...&status=todo
  const { status: s5, json: j5 } = await api(
    'GET',
    `/api/tasks?projectId=${projectId}&status=todo`,
    aliceToken
  );
  test('Filter by status=todo works', j5.data?.length === 1);

  // GET /api/tasks?projectId=...&assignedTo=bobId
  const { status: s6, json: j6 } = await api(
    'GET',
    `/api/tasks?projectId=${projectId}&assignedTo=${bobId}`,
    aliceToken
  );
  test('Filter by assignedTo works', j6.data?.length === 1);

  // GET /api/tasks/[id]
  const { status: s7, json: j7 } = await api(
    'GET',
    `/api/tasks/${taskId}`,
    aliceToken
  );
  test('Get task detail returns 200', s7 === 200);
  test('Task has assignee profile', j7.data?.assignee !== null);
  test('Assignee has full_name', j7.data?.assignee?.full_name === 'Bob Jones');

  // PATCH — Bob (member) updates status only
  const { status: s8, json: j8 } = await api(
    'PATCH',
    `/api/tasks/${taskId}`,
    bobToken,
    { title: 'Hacked title', status: 'in_progress' }
  );
  test('Member can update status', s8 === 200 && j8.data?.status === 'in_progress');
  test('Member cannot change title', j8.data?.title === 'Build login page');

  // PATCH — Alice (admin) updates all fields
  const { status: s9, json: j9 } = await api(
    'PATCH',
    `/api/tasks/${taskId}`,
    aliceToken,
    { title: 'Build signup page', priority: 'low' }
  );
  test('Admin can update title', s9 === 200 && j9.data?.title === 'Build signup page');
  test('Admin can update priority', j9.data?.priority === 'low');
}

async function testDashboard() {
  console.log('\n📊 DASHBOARD ROUTE');

  const { status, json } = await api('GET', '/api/dashboard', aliceToken);
  test('Dashboard returns 200', status === 200);
  test('Has total_tasks', json.data?.total_tasks === 2);
  test('Has completed_tasks', json.data?.completed_tasks === 1);
  test('Has overdue_tasks array', Array.isArray(json.data?.overdue_tasks));
  test('Overdue task detected', json.data?.overdue_tasks?.length >= 1);
  test('Overdue task has project_name', !!json.data?.overdue_tasks?.[0]?.project_name);
  test('Has my_tasks for Alice', Array.isArray(json.data?.my_tasks));
  test('Has projects_count', json.data?.projects_count === 1);

  // Bob's dashboard
  const { status: s2, json: j2 } = await api('GET', '/api/dashboard', bobToken);
  test('Bob dashboard returns 200', s2 === 200);
  test('Bob has my_tasks (assigned)', j2.data?.my_tasks?.length >= 1);
}

async function testDeleteOperations() {
  console.log('\n🗑️  DELETE OPERATIONS');

  // DELETE task — Bob (member) forbidden
  const { status: s1 } = await api(
    'DELETE',
    `/api/tasks/${taskId}`,
    bobToken
  );
  test('Member cannot delete task (403)', s1 === 403);

  // DELETE task — Alice (admin)
  const { status: s2, json: j2 } = await api(
    'DELETE',
    `/api/tasks/${taskId}`,
    aliceToken
  );
  test('Admin can delete task', s2 === 200 && j2.data?.message === 'Task deleted');

  // DELETE member — cannot remove only admin
  const { status: s3, json: j3 } = await api(
    'DELETE',
    `/api/projects/${projectId}/members/${aliceId}`,
    aliceToken
  );
  test('Cannot remove only admin (400)', s3 === 400);

  // DELETE member — remove Bob
  const { status: s4, json: j4 } = await api(
    'DELETE',
    `/api/projects/${projectId}/members/${bobId}`,
    aliceToken
  );
  test('Admin can remove member', s4 === 200 && j4.data?.message === 'Member removed');

  // DELETE project — Bob (non-member now) forbidden
  const { status: s5 } = await api(
    'DELETE',
    `/api/projects/${projectId}`,
    bobToken
  );
  test('Non-member cannot delete project (403)', s5 === 403);

  // DELETE project — Alice (admin)
  const { status: s6, json: j6 } = await api(
    'DELETE',
    `/api/projects/${projectId}`,
    aliceToken
  );
  test('Admin can delete project', s6 === 200 && j6.data?.message === 'Project deleted');
}

// ─── Cleanup ──────────────────────────────────────────────────
async function cleanup() {
  console.log('\n🧹 CLEANUP — Removing test users...');
  await admin.auth.admin.deleteUser(aliceId);
  await admin.auth.admin.deleteUser(bobId);
  console.log('  ✅ Test users removed');
}

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('   Team Task Manager — API Test Suite');
  console.log('═══════════════════════════════════════════════');

  try {
    await setup();
    await testHealthCheck();
    await testAuth();
    await testProjects();
    await testMembers();
    await testTasks();
    await testDashboard();
    await testDeleteOperations();
  } catch (err) {
    console.error('\n💥 Fatal error:', err);
  } finally {
    await cleanup();
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log(`   Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

main();
