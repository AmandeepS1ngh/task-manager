import { createClient } from '@/lib/supabase/server';
import { success, failure } from '@/lib/api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, full_name } = body;

    // Validate required fields
    if (!email || !password || !full_name) {
      return failure('Missing required fields: email, password, full_name', 400);
    }

    if (password.length < 6) {
      return failure('Password must be at least 6 characters', 400);
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
        },
      },
    });

    if (error) {
      return failure(error.message, 400);
    }

    return success(
      {
        user: data.user,
        session: data.session,
      },
      201
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return failure(message, 500);
  }
}
