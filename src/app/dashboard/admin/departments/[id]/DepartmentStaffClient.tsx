'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createDepartmentUserAction } from '../../actions';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, UserPlus, Shield, User, Loader2, Mail, Lock } from 'lucide-react';

interface StaffUser {
  id: string;
  created_at: string;
  full_name: string;
  role: string;
}

interface Department {
  id: number;
  name: string;
  desc: string;
}

interface DepartmentStaffClientProps {
  department: Department;
  initialStaff: StaffUser[];
}

export default function DepartmentStaffClient({
  department,
  initialStaff,
}: DepartmentStaffClientProps) {
  const [staff, setStaff] = useState<StaffUser[]>(initialStaff);
  const [openModal, setOpenModal] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenCreate = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setOpenModal(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast.error('All fields are required.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Creating user and emailing credentials...');

    try {
      const result = await createDepartmentUserAction(fullName, email, password, department.id);

      if (result.success) {
        toast.success(result.message, { id: toastId });
        
        // Add to local list (mocking created_at for immediate display)
        const newStaffMember: StaffUser = {
          id: Math.random().toString(), // Will be updated on re-query, fine for local state
          created_at: new Date().toISOString(),
          full_name: fullName,
          role: 'department_user',
        };
        setStaff((prev) => [...prev, newStaffMember]);
        setOpenModal(false);
      } else {
        toast.error(result.message || 'Failed to create department user.', { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error('An unexpected error occurred.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="space-y-2">
        <Link href="/dashboard/admin/departments">
          <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 gap-1.5 px-3">
            <ArrowLeft className="h-4 w-4" />
            Back to Departments
          </Button>
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Department Details
            </span>
            <h2 className="text-2xl font-bold text-slate-900">{department.name}</h2>
            <p className="text-sm text-slate-500 max-w-xl">{department.desc}</p>
          </div>
          <Button
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-5 px-4 shadow-sm shadow-indigo-500/10"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Staff List Table Card */}
      <Card className="border-slate-200/80 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900">Assigned Officers</CardTitle>
          <CardDescription>Accounts authorized to process grievances for this department</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:px-6">
          {staff.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3 px-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">No staff members assigned</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Click 'Add Staff Member' to authorize a department officer account.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-200">
                    <TableHead className="font-semibold text-slate-500">Full Name</TableHead>
                    <TableHead className="font-semibold text-slate-500">System Role</TableHead>
                    <TableHead className="font-semibold text-slate-500">Account Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow key={member.id} className="border-slate-100 hover:bg-slate-50/50">
                      <TableCell className="font-bold text-slate-800 py-4 flex items-center gap-2">
                        <User className="h-4.5 w-4.5 text-slate-400" />
                        {member.full_name}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Shield className="h-3 w-3" />
                          Department User
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {new Date(member.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-md bg-white border border-slate-200 text-slate-900 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-indigo-600" />
              Register Department User
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Create an official account. The user will be automatically assigned to <strong>"{department.name}"</strong>, and credentials will be sent to their email.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateStaff}>
            <div className="space-y-4 py-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="staff-name" className="text-slate-700 text-sm font-semibold">Full Name</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </span>
                  <Input
                    id="staff-name"
                    placeholder="Jane Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                    className="pl-10 bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="staff-email" className="text-slate-700 text-sm font-semibold">Email Address</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <Input
                    id="staff-email"
                    type="email"
                    placeholder="jane.smith@municipality.gov"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="pl-10 bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="staff-password" className="text-slate-700 text-sm font-semibold">Temporary Password</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <Input
                    id="staff-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="pl-10 bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Must be at least 6 characters long.</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpenModal(false)}
                className="font-semibold text-slate-500 hover:text-slate-800"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
