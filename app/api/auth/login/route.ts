import { createClient } from '@/lib/supabase/server';
import { success, failure } from '@/lib/api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return failure('Missing required fields: email, password', 400);
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return failure(error.message, 401);
    }

    return success({
      user: data.user,
      session: data.session,
      access_token: data.session?.access_token,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return failure(message, 500);
  }
}
