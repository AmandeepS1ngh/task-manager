import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'Team Task Manager API',
    version: '1.0.0',
    status: 'healthy',
    endpoints: {
      auth: [
        'POST /api/auth/signup',
        'POST /api/auth/login',
        'POST /api/auth/logout',
        'GET  /api/auth/me',
      ],
      projects: [
        'GET    /api/projects',
        'POST   /api/projects',
        'GET    /api/projects/:id',
        'PATCH  /api/projects/:id',
        'DELETE /api/projects/:id',
      ],
      members: [
        'POST   /api/projects/:id/members',
        'PATCH  /api/projects/:id/members/:userId',
        'DELETE /api/projects/:id/members/:userId',
      ],
      tasks: [
        'GET    /api/tasks',
        'POST   /api/tasks',
        'GET    /api/tasks/:id',
        'PATCH  /api/tasks/:id',
        'DELETE /api/tasks/:id',
      ],
      dashboard: [
        'GET /api/dashboard',
      ],
    },
  });
}
