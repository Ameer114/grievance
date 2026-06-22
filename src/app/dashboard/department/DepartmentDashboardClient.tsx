'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { updateGrievanceStatusAction } from './actions';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Clock, AlertCircle, FileText, ExternalLink, Search, Sparkles, User, Settings, ArrowRight } from 'lucide-react';

interface DepartmentDashboardClientProps {
  initialGrievances: any[];
  department: { id: number; name: string; desc: string };
  user: { id: string; fullName: string; role: string };
}

export default function DepartmentDashboardClient({
  initialGrievances,
  department,
  user,
}: DepartmentDashboardClientProps) {
  const [grievances, setGrievances] = useState<any[]>(initialGrievances);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState('all');
  const [selectedGrievance, setSelectedGrievance] = useState<any | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [tempStatus, setTempStatus] = useState<string>('');

  // 1. Filtering logic
  const filteredGrievances = grievances.filter((grievance) => {
    const matchesSearch =
      grievance.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grievance.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (grievance.creator?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatusTab === 'all' ||
      grievance.status.toLowerCase() === selectedStatusTab.toLowerCase();

    return matchesSearch && matchesStatus;
  });

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

  const handleOpenGrievance = (g: any) => {
    setSelectedGrievance(g);
    setTempStatus(g.status);
  };

  const handleUpdateStatus = async () => {
    if (!selectedGrievance) return;
    setUpdatingStatus(true);
    const toastId = toast.loading('Updating grievance status...');

    try {
      const result = await updateGrievanceStatusAction(selectedGrievance.id, tempStatus);
      if (result.success) {
        toast.success(result.message, { id: toastId });
        
        // Update local state
        setGrievances((prev) =>
          prev.map((g) =>
            g.id === selectedGrievance.id
              ? {
                  ...g,
                  status: tempStatus,
                  resolved_at: tempStatus === 'Resolved' ? new Date().toISOString() : null,
                  resolver: tempStatus === 'Resolved' ? { full_name: user.fullName } : null,
                }
              : g
          )
        );

        setSelectedGrievance((prev: any) =>
          prev
            ? {
                ...prev,
                status: tempStatus,
                resolved_at: tempStatus === 'Resolved' ? new Date().toISOString() : null,
                resolver: tempStatus === 'Resolved' ? { full_name: user.fullName } : null,
              }
            : null
        );
      } else {
        toast.error(result.message || 'Failed to update status', { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error('An unexpected error occurred.', { id: toastId });
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">
            {department.name} Department
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Redress Portal Dashboard
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
            Review complaints allocated to your department, modify processing status, and resolve issues within the designated timeframe.
          </p>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:max-w-xs shrink-0">
          <Search className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search grievances..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20"
          />
        </div>

        {/* Tabs */}
        <Tabs
          defaultValue="all"
          value={selectedStatusTab}
          onValueChange={setSelectedStatusTab}
          className="w-full md:w-auto"
        >
          <TabsList className="bg-slate-100 p-1 rounded-xl text-slate-600 border border-slate-200">
            <TabsTrigger value="all" className="rounded-lg text-xs font-semibold">All</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg text-xs font-semibold">Pending</TabsTrigger>
            <TabsTrigger value="needs review" className="rounded-lg text-xs font-semibold">Review</TabsTrigger>
            <TabsTrigger value="in progress" className="rounded-lg text-xs font-semibold">Active</TabsTrigger>
            <TabsTrigger value="resolved" className="rounded-lg text-xs font-semibold">Resolved</TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-lg text-xs font-semibold">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200/80 shadow-md shadow-slate-100 bg-white">
        <CardContent className="p-0 sm:px-6">
          {filteredGrievances.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 px-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">No matching grievances</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  There are no grievances in your department matching the selected filters.
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
                    <TableHead className="font-semibold text-slate-500">Raised By</TableHead>
                    <TableHead className="font-semibold text-slate-500">Date Raised</TableHead>
                    <TableHead className="font-semibold text-slate-500">Routing Mode</TableHead>
                    <TableHead className="font-semibold text-slate-500">Status</TableHead>
                    <TableHead className="w-[100px] text-right font-semibold text-slate-500">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrievances.map((g) => (
                    <TableRow key={g.id} className="border-slate-100 hover:bg-slate-50/50">
                      <TableCell className="font-semibold text-slate-500">#GR-{g.id}</TableCell>
                      <TableCell className="font-bold text-slate-800 max-w-[220px] truncate">
                        {g.title}
                      </TableCell>
                      <TableCell className="text-slate-700 font-medium flex items-center gap-1.5 py-4">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {g.creator?.full_name || 'Citizen'}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {new Date(g.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        {g.assigned_by_ai ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            <Sparkles className="h-2.5 w-2.5" />
                            AI (Conf: {g.ai_confidance}%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200">
                            Manual
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(g.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenGrievance(g)}
                          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold text-xs px-2.5"
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog / Modal */}
      <Dialog open={!!selectedGrievance} onOpenChange={() => setSelectedGrievance(null)}>
        <DialogContent className="max-w-2xl bg-white border border-slate-200 text-slate-900 shadow-xl max-h-[90vh] overflow-y-auto rounded-2xl">
          {selectedGrievance && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between pr-4 mt-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Case #GR-{selectedGrievance.id}
                  </span>
                  <div>{getStatusBadge(selectedGrievance.status)}</div>
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 leading-tight">
                  {selectedGrievance.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Raised by <strong>{selectedGrievance.creator?.full_name || 'Citizen'}</strong> on{' '}
                  {new Date(selectedGrievance.created_at).toLocaleString('en-US')}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-5">
                {/* Description */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</h4>
                  <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {selectedGrievance.description}
                  </p>
                </div>

                {/* Evidence Link */}
                {selectedGrievance.attachment && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Citizen Evidence</h4>
                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50/50 max-w-md">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                        <span className="text-sm font-semibold text-slate-800 truncate">
                          Evidence File Attachment
                        </span>
                      </div>
                      <a
                        href={selectedGrievance.attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 shrink-0"
                      >
                        Open File
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Resolution Audit Trail */}
                {selectedGrievance.status === 'Resolved' && (
                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 text-emerald-900 rounded-xl text-sm space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Resolved Status
                    </p>
                    <p className="text-slate-600 text-xs">
                      Closed on {new Date(selectedGrievance.resolved_at!).toLocaleString('en-US')} by{' '}
                      <strong>{selectedGrievance.resolver?.full_name || 'Department Officer'}</strong>
                    </p>
                  </div>
                )}

                {/* AI Confidence Info */}
                {selectedGrievance.assigned_by_ai && (
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span>
                      Routed dynamically by NLP model with confidence score: <strong>{selectedGrievance.ai_confidance}%</strong>
                    </span>
                  </div>
                )}

                {/* Actions Status Update */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Update Redress Status</h4>
                    <p className="text-[11px] text-slate-400">Select a workflow stage to update progress</p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Select value={tempStatus} onValueChange={(val) => setTempStatus(val || '')} disabled={updatingStatus}>
                      <SelectTrigger className="w-full sm:w-[160px] bg-slate-50 border-slate-200">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Needs Review">Needs Review</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      disabled={updatingStatus || tempStatus === selectedGrievance.status}
                      onClick={handleUpdateStatus}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shrink-0"
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter className="border-t border-slate-100 pt-3">
                <Button variant="ghost" onClick={() => setSelectedGrievance(null)} className="font-semibold text-slate-500 hover:text-slate-800">
                  Close Detail Panel
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
