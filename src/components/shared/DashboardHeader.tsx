'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { signOutAction } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardHeaderProps {
  user: {
    id: string;
    email?: string;
    fullName?: string;
    role: string;
  };
  title: string;
}

export default function DashboardHeader({ user, title }: DashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const toastId = toast.loading('Signing out...');
    try {
      const response = await signOutAction();
      if (response && response.success && response.redirectTo) {
        toast.success('Signed out successfully', { id: toastId });
        router.push(response.redirectTo);
      } else {
        toast.error('Error signing out', { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error('Error signing out', { id: toastId });
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'department_user':
        return 'Department Staff';
      default:
        return 'Citizen';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'department_user':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-sm shadow-slate-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center border border-indigo-400/20 shadow-sm shrink-0">
            <Shield className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">{title}</h1>
            <span className="text-xs text-slate-500 font-medium">E-Grievance Platform</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-slate-900 leading-tight">
              {user.fullName || 'User'}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider border rounded-full px-2 py-0.5 mt-0.5 ${getRoleBadgeColor(user.role)}`}>
              {getRoleLabel(user.role)}
            </span>
          </div>
          
          <div className="h-8 w-px bg-slate-200" />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
