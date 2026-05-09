import { createAdminClient } from './supabase/server';
import type { Role } from './types';

/**
 * Get the user's role in a specific project.
 * Returns 'admin' | 'member' | null (if user is not a member).
 */
export async function getProjectRole(
  userId: string,
  projectId: string
): Promise<Role | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('project_members')
    .select('role')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .single();

  if (error || !data) return null;

  return data.role as Role;
}

/**
 * Require the user to be an admin of the project.
 * Throws Error('FORBIDDEN') if user is not an admin.
 */
export async function requireAdmin(
  userId: string,
  projectId: string
): Promise<void> {
  const role = await getProjectRole(userId, projectId);

  if (role !== 'admin') {
    throw new Error('FORBIDDEN');
  }
}

/**
 * Require the user to be a member (any role) of the project.
 * Throws Error('FORBIDDEN') if user is not a member at all.
 */
export async function requireMember(
  userId: string,
  projectId: string
): Promise<void> {
  const role = await getProjectRole(userId, projectId);

  if (role === null) {
    throw new Error('FORBIDDEN');
  }
}
