import { getSessionUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { success, failure } from '@/lib/api';

export async function GET() {
  try {
    const user = await getSessionUser();

    // Fetch profile from profiles table
    const supabase = createAdminClient();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      return failure(error.message, 400);
    }

    return success(profile);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'UNAUTHORIZED') {
      return failure('Unauthorized', 401);
    }
    return failure(message, 500);
  }
}
