import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Initialize Supabase Client & Response
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 2. Fetch authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is not logged in and is trying to access a dashboard route, redirect to login
  if (!user) {
    if (pathname.startsWith('/dashboard')) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      // Save original URL to redirect back after login
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  // 3. User is logged in. Fetch role from database using Admin client to bypass RLS select restrictions
  const adminSupabase = createAdminClient();
  const { data: profile, error } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    // If user exists in auth but no profile row, sign out and redirect to login
    console.error('User profile not found in proxy:', error);
    await supabase.auth.signOut();
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  const role = profile.role;

  // 4. Handle Redirection for Authenticated Users accessing Auth Pages
  if (pathname === '/login' || pathname === '/register') {
    const redirectUrl = request.nextUrl.clone();
    if (role === 'admin') {
      redirectUrl.pathname = '/dashboard/admin';
    } else if (role === 'department_user') {
      redirectUrl.pathname = '/dashboard/department';
    } else {
      redirectUrl.pathname = '/dashboard/user';
    }
    return NextResponse.redirect(redirectUrl);
  }

  // 5. Enforce Dashboard Route Permissions
  if (pathname.startsWith('/dashboard/user') && role !== 'user') {
    return redirectToDashboard(role, request);
  }

  if (pathname.startsWith('/dashboard/department') && role !== 'department_user') {
    return redirectToDashboard(role, request);
  }

  if (pathname.startsWith('/dashboard/admin') && role !== 'admin') {
    return redirectToDashboard(role, request);
  }

  return supabaseResponse;
}

function redirectToDashboard(role: string, request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  if (role === 'admin') {
    redirectUrl.pathname = '/dashboard/admin';
  } else if (role === 'department_user') {
    redirectUrl.pathname = '/dashboard/department';
  } else {
    redirectUrl.pathname = '/dashboard/user';
  }
  return NextResponse.redirect(redirectUrl);
}

// Limit proxy to run only on dashboard and authentication routes
export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
