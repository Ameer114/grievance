import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import DashboardHeader from '@/components/shared/DashboardHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, Inbox, Clock, CheckCircle2, AlertTriangle, Building, Users, Calendar, ArrowRight, Sparkles } from 'lucide-react';

export default async function AdminDashboard() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. Fetch admin profile using Admin client to bypass RLS select
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

  // 3. Fetch all grievances with joins using Admin client to bypass RLS select
  const { data: grievancesData } = await adminSupabase
    .from('grievances')
    .select(`
      *,
      departments (
        name
      ),
      creator:profiles!grievances_created_by_fkey (
        full_name
      )
    `);

  const grievances = grievancesData || [];

  // 4. Calculate Analytics
  const totalCount = grievances.length;
  const pendingCount = grievances.filter((g) => g.status === 'Pending').length;
  const resolvedCount = grievances.filter((g) => g.status === 'Resolved').length;
  const reviewCount = grievances.filter((g) => g.status === 'Needs Review').length;

  // Average resolution time (in days)
  const resolvedGrievances = grievances.filter(
    (g) => g.status === 'Resolved' && g.resolved_at
  );
  let avgResolutionTimeDays = 0;
  if (resolvedGrievances.length > 0) {
    const totalMs = resolvedGrievances.reduce((acc, g) => {
      const start = new Date(g.created_at).getTime();
      const end = new Date(g.resolved_at!).getTime();
      return acc + (end - start);
    }, 0);
    const avgMs = totalMs / resolvedGrievances.length;
    avgResolutionTimeDays = avgMs / (1000 * 60 * 60 * 24);
  }

  // 5. Sorting grievances: Highest days pending (unresolved) first.
  // Then recently resolved ones.
  const sortedGrievances = [...grievances].sort((a, b) => {
    const aResolved = a.status === 'Resolved';
    const bResolved = b.status === 'Resolved';
    
    // Unresolved comes first
    if (!aResolved && bResolved) return -1;
    if (aResolved && !bResolved) return 1;

    // Both are unresolved: sort by oldest first (highest days pending)
    if (!aResolved && !bResolved) {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }

    // Both are resolved: sort by resolved_at descending (recently resolved first)
    return new Date(b.resolved_at!).getTime() - new Date(a.resolved_at!).getTime();
  });

  // Helper: calculate days since raised or time to resolve
  const getDaysPending = (grievance: any) => {
    const created = new Date(grievance.created_at).getTime();
    const end = grievance.status === 'Resolved' && grievance.resolved_at
      ? new Date(grievance.resolved_at).getTime()
      : Date.now();
    
    const diffTime = end - created;
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  };

  const getSLAIndicator = (days: number, isResolved: boolean) => {
    if (isResolved) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          Resolved ({days}d)
        </span>
      );
    }

    if (days <= 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {days} Days (Low)
        </span>
      );
    } else if (days <= 7) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          {days} Days (Medium)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
          {days} Days (Overdue)
        </span>
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Resolved
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            In Progress
          </span>
        );
      case 'Needs Review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Needs Review
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50/50 min-h-screen">
      <DashboardHeader
        user={{ id: user.id, email: user.email, fullName: profile.full_name, role: profile.role }}
        title="Admin Control Center"
      />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 space-y-4">
          <Card className="border-slate-200/80 shadow-sm bg-white p-4">
            <nav className="flex flex-row lg:flex-col gap-2">
              <Link href="/dashboard/admin" className="flex-1">
                <Button variant="secondary" className="w-full justify-start font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                  <FileText className="mr-2 h-4 w-4" />
                  Grievances Overview
                </Button>
              </Link>
              <Link href="/dashboard/admin/departments" className="flex-1">
                <Button variant="ghost" className="w-full justify-start font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                  <Building className="mr-2 h-4 w-4" />
                  Departments CRUD
                </Button>
              </Link>
            </nav>
          </Card>
        </aside>

        {/* Main Workspace */}
        <div className="flex-1 space-y-8">
          {/* Analytics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border-slate-200/80 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Cases</span>
                <FileText className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-slate-900">{totalCount}</div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending</span>
                <Clock className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-slate-900">{pendingCount}</div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Resolved</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-emerald-600">{resolvedCount}</div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Review Required</span>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-amber-600">{reviewCount}</div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-sm bg-white col-span-2 lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg Resolution</span>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-slate-900">
                  {avgResolutionTimeDays.toFixed(1)} Days
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monitoring Table Card */}
          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-2">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Inbox className="h-5 w-5 text-indigo-600" />
                  SLA Monitoring & Audits
                </CardTitle>
                <CardDescription>All portal grievances sorted by highest unresolved days first.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-0 sm:px-6 py-4">
              {sortedGrievances.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 px-4">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">No grievances logged yet</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      There are no grievances registered on this portal.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-slate-200">
                        <TableHead className="w-[120px] font-semibold text-slate-500">Case ID</TableHead>
                        <TableHead className="font-semibold text-slate-500">Title</TableHead>
                        <TableHead className="font-semibold text-slate-500">Department</TableHead>
                        <TableHead className="font-semibold text-slate-500">Raised By</TableHead>
                        <TableHead className="font-semibold text-slate-500">Created Date</TableHead>
                        <TableHead className="font-semibold text-slate-500">Status</TableHead>
                        <TableHead className="font-semibold text-slate-500">SLA Indicator</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedGrievances.map((g) => {
                        const days = getDaysPending(g);
                        const isResolved = g.status === 'Resolved';
                        return (
                          <TableRow key={g.id} className="border-slate-100 hover:bg-slate-50/50">
                            <TableCell className="font-semibold text-slate-500">#GR-{g.id}</TableCell>
                            <TableCell className="font-bold text-slate-800 max-w-[200px] truncate">
                              {g.title}
                            </TableCell>
                            <TableCell className="font-semibold text-slate-600">
                              {g.departments?.name || 'Unassigned'}
                            </TableCell>
                            <TableCell className="text-slate-700 font-medium">
                              {g.creator?.full_name || 'Citizen'}
                            </TableCell>
                            <TableCell className="text-slate-500 text-sm">
                              {new Date(g.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </TableCell>
                            <TableCell>{getStatusBadge(g.status)}</TableCell>
                            <TableCell>{getSLAIndicator(days, isResolved)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
