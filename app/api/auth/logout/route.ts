import { createClient } from '@/lib/supabase/server';
import { success, failure } from '@/lib/api';

export async function POST() {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return failure(error.message, 400);
    }

    return success({ message: 'Logged out' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return failure(message, 500);
  }
}
