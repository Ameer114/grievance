import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import DashboardHeader from '@/components/shared/DashboardHeader';
import GrievanceForm from './GrievanceForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, Inbox, Clock, CheckCircle2, ChevronRight, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Grievance } from '@/types';

export default async function UserDashboard() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // 1. Authenticate & fetch user auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. Fetch user profile from database using Admin client to bypass RLS select
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Double check role protection
  if (profile.role !== 'user') {
    if (profile.role === 'admin') redirect('/dashboard/admin');
    if (profile.role === 'department_user') redirect('/dashboard/department');
  }

  // 3. Fetch grievances list (joined with departments name) using Admin client to bypass RLS select
  const { data: grievancesData } = await adminSupabase
    .from('grievances')
    .select(`
      *,
      departments (
        name
      )
    `)
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  const grievances = (grievancesData || []) as any[];

  // 4. Calculate dashboard statistics
  const totalCount = grievances.length;
  const pendingCount = grievances.filter(
    (g) => g.status === 'Pending' || g.status === 'Needs Review'
  ).length;
  const inProgressCount = grievances.filter((g) => g.status === 'In Progress').length;
  const resolvedCount = grievances.filter((g) => g.status === 'Resolved').length;

  const recentGrievances = grievances.slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            Resolved
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="h-3 w-3" />
            In Progress
          </span>
        );
      case 'Needs Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="h-3 w-3" />
            Needs Review
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="h-3 w-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50/50">
      <DashboardHeader 
        user={{ id: user.id, email: user.email, fullName: profile.full_name, role: profile.role }} 
        title="Citizen Dashboard" 
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Message banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {profile.full_name || 'Citizen'}
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
              File complaints directly to municipality services. Our NLP AI classifies and assigns grievances to relevant divisions for fast Redressal.
            </p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="border-slate-200/80 shadow-sm shadow-slate-100 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Filed</CardTitle>
              <FileText className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalCount}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm shadow-slate-100 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending / Review</CardTitle>
              <Inbox className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{pendingCount}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm shadow-slate-100 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{inProgressCount}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm shadow-slate-100 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Resolved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{resolvedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Form and Recent Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Submission Form */}
          <div className="lg:col-span-7">
            <GrievanceForm />
          </div>

          {/* Recent Grievances List */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-slate-200/80 shadow-sm shadow-slate-100 bg-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">Recent Submissions</CardTitle>
                  <CardDescription>Status tracker of your latest cases</CardDescription>
                </div>
                {totalCount > 5 && (
                  <Link href="/dashboard/user/history">
                    <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 font-semibold gap-1 text-xs px-2.5">
                      All History
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                {recentGrievances.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center px-4 space-y-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-950">No grievances logged yet</p>
                      <p className="text-xs text-slate-400 max-w-[240px]">Fill out the form to file your first official concern.</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentGrievances.map((grievance) => (
                      <Link 
                        key={grievance.id} 
                        href={`/dashboard/user/grievance/${grievance.id}`}
                        className="flex items-center justify-between p-4 hover:bg-slate-50/80 rounded-xl transition-colors group"
                      >
                        <div className="space-y-1 overflow-hidden pr-4">
                          <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                            {grievance.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-semibold text-slate-600 truncate max-w-[120px]">
                              {grievance.departments?.name || 'Unassigned'}
                            </span>
                            <span>•</span>
                            <span>{new Date(grievance.created_at).toLocaleDateString('en-US')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {getStatusBadge(grievance.status)}
                          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
