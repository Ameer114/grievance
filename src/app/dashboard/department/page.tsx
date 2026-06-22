import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import DashboardHeader from '@/components/shared/DashboardHeader';
import DepartmentDashboardClient from './DepartmentDashboardClient';

export default async function DepartmentDashboard() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. Fetch department user profile using Admin client to bypass RLS select
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'department_user') {
    // If not a department user, redirect accordingly
    if (!profile) redirect('/login');
    if (profile.role === 'admin') redirect('/dashboard/admin');
    if (profile.role === 'user') redirect('/dashboard/user');
    redirect('/login');
  }

  if (!profile.department_id) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
        <div className="max-w-md p-6 bg-white border border-slate-200 rounded-2xl shadow-md text-center space-y-4">
          <h3 className="text-lg font-bold text-rose-600">No Department Assigned</h3>
          <p className="text-sm text-slate-500">
            Your profile does not have an assigned department. Please contact a system administrator to resolve this setup.
          </p>
        </div>
      </div>
    );
  }

  // 3. Fetch department details using Admin client to bypass RLS select
  const { data: department } = await adminSupabase
    .from('departments')
    .select('*')
    .eq('id', profile.department_id)
    .single();

  if (!department) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
        <div className="max-w-md p-6 bg-white border border-slate-200 rounded-2xl shadow-md text-center space-y-4">
          <h3 className="text-lg font-bold text-rose-600">Department Misconfigured</h3>
          <p className="text-sm text-slate-500">
            The department assigned to your account (ID: {profile.department_id}) does not exist in our database.
          </p>
        </div>
      </div>
    );
  }

  // 4. Fetch department grievances using Admin client to bypass RLS select
  const { data: grievancesData } = await adminSupabase
    .from('grievances')
    .select(`
      *,
      creator:profiles!grievances_created_by_fkey (
        full_name
      ),
      resolver:profiles!grievances_resolved_by_fkey (
        full_name
      )
    `)
    .eq('dep_id', profile.department_id)
    .order('created_at', { ascending: false });

  const grievances = grievancesData || [];

  return (
    <div className="flex-1 flex flex-col bg-slate-50/50">
      <DashboardHeader
        user={{ id: user.id, email: user.email, fullName: profile.full_name, role: profile.role }}
        title="Department Control Board"
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <DepartmentDashboardClient
          initialGrievances={grievances}
          department={department}
          user={{ id: user.id, fullName: profile.full_name, role: profile.role }}
        />
      </main>
    </div>
  );
}
