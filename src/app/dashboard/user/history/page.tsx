import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import DashboardHeader from '@/components/shared/DashboardHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default async function GrievanceHistoryPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. Fetch user profile using Admin client to bypass RLS select
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'user') {
    redirect('/login');
  }

  // 3. Fetch all user grievances using Admin client to bypass RLS select
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

  const grievances = grievancesData || [];

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

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back Link */}
        <div>
          <Link href="/dashboard/user">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 gap-1.5 px-3">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* History Table Card */}
        <Card className="border-slate-200/80 shadow-md shadow-slate-100 bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">Grievance History</CardTitle>
            <CardDescription>All concerns you have filed on the platform</CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {grievances.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">No grievances logged</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    You have not submitted any grievances yet. Return to the dashboard to lodge your first case.
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
                      <TableHead className="font-semibold text-slate-500">Created At</TableHead>
                      <TableHead className="font-semibold text-slate-500">Status</TableHead>
                      <TableHead className="font-semibold text-slate-500">Evidence</TableHead>
                      <TableHead className="w-[100px] text-right font-semibold text-slate-500">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grievances.map((grievance) => (
                      <TableRow key={grievance.id} className="border-slate-100 hover:bg-slate-50/50">
                        <TableCell className="font-semibold text-slate-500">#GR-{grievance.id}</TableCell>
                        <TableCell className="font-bold text-slate-800 max-w-[240px] truncate">
                          {grievance.title}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-600">
                          {grievance.departments?.name || 'Unassigned'}
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {new Date(grievance.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                        <TableCell>{getStatusBadge(grievance.status)}</TableCell>
                        <TableCell>
                          {grievance.attachment ? (
                            <a
                              href={grievance.attachment}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
                            >
                              View File
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/user/grievance/${grievance.id}`}>
                            <Button size="sm" variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold text-xs px-2.5">
                              View Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
