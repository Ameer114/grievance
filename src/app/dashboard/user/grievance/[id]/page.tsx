import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import DashboardHeader from '@/components/shared/DashboardHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, FileText, Download, Sparkles, UserCheck } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GrievanceDetailPage({ params }: PageProps) {
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

  // 2. Fetch user profile using Admin client to bypass RLS select
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'user') {
    redirect('/login');
  }

  // 3. Fetch single grievance using Admin client to bypass RLS select
  const { data: grievanceData } = await adminSupabase
    .from('grievances')
    .select(`
      *,
      departments (
        name,
        desc
      ),
      resolver:profiles!grievances_resolved_by_fkey (
        full_name
      )
    `)
    .eq('id', id)
    .eq('created_by', user.id)
    .single();

  if (!grievanceData) {
    notFound();
  }

  const grievance = grievanceData as any;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Resolved
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="h-3.5 w-3.5" />
            In Progress
          </span>
        );
      case 'Needs Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="h-3.5 w-3.5" />
            Needs Review
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="h-3.5 w-3.5" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="h-3.5 w-3.5" />
            Pending
          </span>
        );
    }
  };

  const isImage = (url: string) => {
    return url.match(/\.(jpeg|jpg|gif|png|webp)/i) != null;
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50/50">
      <DashboardHeader
        user={{ id: user.id, email: user.email, fullName: profile.full_name, role: profile.role }}
        title="Citizen Dashboard"
      />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back Link */}
        <div>
          <Link href="/dashboard/user/history">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 gap-1.5 px-3">
              <ArrowLeft className="h-4 w-4" />
              Back to History
            </Button>
          </Link>
        </div>

        {/* Resolution Banner */}
        {grievance.status === 'Resolved' && (
          <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-start gap-4 shadow-sm shadow-emerald-100/30">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-emerald-900 text-base">Grievance Redressed</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                This grievance was officially marked as <span className="font-semibold text-emerald-800">Resolved</span> on{' '}
                <strong>{new Date(grievance.resolved_at!).toLocaleString('en-US')}</strong> by{' '}
                <strong>{grievance.resolver?.full_name || 'Department Officer'}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Grievance Details Card */}
        <Card className="border-slate-200/80 shadow-md shadow-slate-100 bg-white">
          <CardHeader className="border-b border-slate-100 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Case #GR-{grievance.id}</span>
                <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                  {grievance.title}
                </CardTitle>
              </div>
              <div className="shrink-0">{getStatusBadge(grievance.status)}</div>
            </div>
          </CardHeader>
          <CardContent className="py-6 space-y-6">
            {/* Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-sm">
              <div className="space-y-1">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Assigned Department</span>
                <p className="font-bold text-slate-800">{grievance.departments?.name || 'Unassigned'}</p>
                <p className="text-slate-500 text-xs mt-0.5">{grievance.departments?.desc}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Date Raised</span>
                <p className="font-bold text-slate-800">
                  {new Date(grievance.created_at).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            </div>

            {/* AI Classification Info Banner */}
            {grievance.assigned_by_ai && (
              <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between gap-3 text-xs text-indigo-900">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
                  <span>
                    Auto-categorized by AI Router with confidence level: <strong>{grievance.ai_confidance}%</strong>
                  </span>
                </div>
                <span className="font-semibold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                  AI Classified
                </span>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Grievance Description</h3>
              <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50/20 border border-slate-100 p-4 rounded-xl">
                {grievance.description}
              </p>
            </div>

            {/* Attachment */}
            {grievance.attachment && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Evidence Attachment</h3>
                {isImage(grievance.attachment) ? (
                  <div className="space-y-2">
                    <div className="relative max-w-md border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={grievance.attachment}
                        alt="Evidence image uploaded by citizen"
                        className="object-contain w-full h-auto max-h-[320px]"
                      />
                    </div>
                    <a
                      href={grievance.attachment}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline gap-1 mt-1"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download Evidence File
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 max-w-md">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileText className="h-5 w-5 text-indigo-500 shrink-0" />
                      <span className="text-sm font-semibold text-slate-800 truncate">Evidence Document (PDF)</span>
                    </div>
                    <a href={grievance.attachment} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 font-semibold gap-1 text-xs">
                        <Download className="h-3 w-3" />
                        Download
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
