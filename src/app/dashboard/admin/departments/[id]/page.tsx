import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import DashboardHeader from '@/components/shared/DashboardHeader';
import DepartmentStaffClient from './DepartmentStaffClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Building } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DepartmentStaffPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. Fetch profile using Admin client to bypass RLS select
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    if (!profile) redirect('/login');
    if (profile.role === 'department_user') redirect('/dashboard/department');
    if (profile.role === 'user') redirect('/dashboard/user');
    redirect('/login');
  }

  // 3. Fetch department details using Admin client to bypass RLS select
  const { data: department } = await adminSupabase
    .from('departments')
    .select('*')
    .eq('id', id)
    .single();

  if (!department) {
    notFound();
  }

  // 4. Fetch department staff using Admin client to bypass RLS select
  const { data: staffData } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('role', 'department_user')
    .eq('department_id', id)
    .order('created_at', { ascending: true });

  const staff = staffData || [];

  return (
    <div className="flex-1 flex flex-col bg-slate-50/50 min-h-screen">
      <DashboardHeader
        user={{ id: user.id, email: user.email, fullName: profile.full_name, role: profile.role }}
        title="Admin Control Center"
      />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 space-y-4">
          <Card className="border-slate-200/80 shadow-sm bg-white p-4">
            <nav className="flex flex-row lg:flex-col gap-2">
              <Link href="/dashboard/admin" className="flex-1">
                <Button variant="ghost" className="w-full justify-start font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                  <FileText className="mr-2 h-4 w-4" />
                  Grievances Overview
                </Button>
              </Link>
              <Link href="/dashboard/admin/departments" className="flex-1">
                <Button variant="secondary" className="w-full justify-start font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                  <Building className="mr-2 h-4 w-4" />
                  Departments CRUD
                </Button>
              </Link>
            </nav>
          </Card>
        </aside>

        {/* Workspace */}
        <div className="flex-1">
          <DepartmentStaffClient department={department} initialStaff={staff} />
        </div>
      </div>
    </div>
  );
}
