'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

import { createAdminClient } from '@/lib/supabase/admin';

export async function signUpAction(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const fullName = formData.get('fullName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  const result = signUpSchema.safeParse({ fullName, email, password, confirmPassword });

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  // 1. Sign up user via Supabase Auth
  const { data, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return {
      success: false,
      message: authError.message,
    };
  }

  const user = data.user;
  if (!user) {
    return {
      success: false,
      message: 'Signup failed. Please try again.',
    };
  }

  // 2. Insert profile record with role = 'user' using Admin client to bypass RLS
  const adminSupabase = createAdminClient();
  const { error: profileError } = await adminSupabase.from('profiles').insert([
    {
      id: user.id,
      full_name: fullName,
      role: 'user',
      department_id: null,
    },
  ]);

  if (profileError) {
    console.error('Failed to create user profile:', profileError);
    // Since Auth user was created, we still have the user, but profile insert failed.
    // Try to cleanup or return message
    return {
      success: false,
      message: `Account created, but profile configuration failed: ${profileError.message}`,
    };
  }

  // 3. Revalidate and return redirect path
  revalidatePath('/dashboard/user', 'layout');
  return { success: true, redirectTo: '/dashboard/user' };
}

export async function signInAction(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const result = signInSchema.safeParse({ email, password });
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  // 1. Authenticate with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return {
      success: false,
      message: authError.message,
    };
  }

  const user = authData.user;
  if (!user) {
    return {
      success: false,
      message: 'Authentication failed.',
    };
  }

  // 2. Fetch user profile and determine role using Admin client to bypass RLS select restrictions
  const adminSupabase = createAdminClient();
  let { data: profile, error: profileError } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.warn('Profile not found for user, attempting fallback creation:', profileError);
    
    // Create a fallback profile using the Admin client to heal the orphan account
    const { data: newProfile, error: createError } = await adminSupabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          full_name: user.user_metadata?.full_name || 'Citizen User',
          role: 'user',
          department_id: null,
        },
      ])
      .select('role')
      .single();

    if (createError || !newProfile) {
      console.error('Failed to create fallback user profile:', createError);
      // Sign out to clean up session
      await supabase.auth.signOut();
      return {
        success: false,
        message: 'Profile not found. Please contact support.',
      };
    }
    
    profile = newProfile;
  }

  // 3. Route according to role
  const role = profile.role;
  revalidatePath('/dashboard', 'layout');

  let redirectTo = '/dashboard/user';
  if (role === 'admin') {
    redirectTo = '/dashboard/admin';
  } else if (role === 'department_user') {
    redirectTo = '/dashboard/department';
  }

  return { success: true, redirectTo };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  return { success: true, redirectTo: '/login' };
}
