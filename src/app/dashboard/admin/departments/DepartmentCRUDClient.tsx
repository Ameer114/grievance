'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createDepartmentAction, editDepartmentAction, deleteDepartmentAction } from '../actions';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, ArrowRight, Building, Loader2 } from 'lucide-react';

interface Department {
  id: number;
  created_at: string;
  name: string;
  desc: string;
}

interface DepartmentCRUDClientProps {
  initialDepartments: Department[];
}

export default function DepartmentCRUDClient({ initialDepartments }: DepartmentCRUDClientProps) {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  
  // Dialog State
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  // Form State
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenCreate = () => {
    setModalMode('create');
    setCurrentId(null);
    setName('');
    setDesc('');
    setOpenModal(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setModalMode('edit');
    setCurrentId(dept.id);
    setName(dept.name);
    setDesc(dept.desc);
    setOpenModal(true);
  };

  const handleOpenDelete = (dept: Department) => {
    setCurrentId(dept.id);
    setName(dept.name);
    setOpenDeleteModal(true);
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !desc) {
      toast.error('Both department name and description are required.');
      return;
    }

    setLoading(true);
    const toastId = toast.loading(modalMode === 'create' ? 'Creating department...' : 'Saving updates...');

    try {
      if (modalMode === 'create') {
        const result = await createDepartmentAction(name, desc);
        if (result.success && result.data) {
          toast.success(result.message, { id: toastId });
          setDepartments((prev) => [...prev, result.data as Department]);
          setOpenModal(false);
        } else {
          toast.error(result.message || 'Action failed', { id: toastId });
        }
      } else if (modalMode === 'edit' && currentId !== null) {
        const result = await editDepartmentAction(currentId, name, desc);
        if (result.success && result.data) {
          toast.success(result.message, { id: toastId });
          setDepartments((prev) =>
            prev.map((d) => (d.id === currentId ? (result.data as Department) : d))
          );
          setOpenModal(false);
        } else {
          toast.error(result.message || 'Action failed', { id: toastId });
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('An unexpected error occurred.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (currentId === null) return;
    setLoading(true);
    const toastId = toast.loading('Deleting department...');

    try {
      const result = await deleteDepartmentAction(currentId);
      if (result.success) {
        toast.success(result.message, { id: toastId });
        setDepartments((prev) => prev.filter((d) => d.id !== currentId));
        setOpenDeleteModal(false);
      } else {
        toast.error(result.message || 'Failed to delete department', { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error('An unexpected error occurred.', { id: toastId });
    } finally {
      setLoading(false);
      setCurrentId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Department Registers</h2>
          <p className="text-sm text-slate-500">Configure divisions and assign officer registries.</p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-5 px-4 shadow-sm shadow-indigo-500/10"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Department
        </Button>
      </div>

      {/* Grid List Card */}
      <Card className="border-slate-200/80 shadow-sm bg-white">
        <CardContent className="p-0 sm:px-6">
          {departments.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 px-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Building className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">No departments configured</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Click 'Create Department' to set up your first organizational unit.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-200">
                    <TableHead className="w-[80px] font-semibold text-slate-500">ID</TableHead>
                    <TableHead className="font-semibold text-slate-500">Department Name</TableHead>
                    <TableHead className="font-semibold text-slate-500">Description</TableHead>
                    <TableHead className="w-[180px] font-semibold text-slate-500">User Management</TableHead>
                    <TableHead className="w-[120px] text-right font-semibold text-slate-500">Operations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dept) => (
                    <TableRow key={dept.id} className="border-slate-100 hover:bg-slate-50/50">
                      <TableCell className="font-semibold text-slate-500">#{dept.id}</TableCell>
                      <TableCell className="font-bold text-slate-800">{dept.name}</TableCell>
                      <TableCell className="text-slate-500 text-sm max-w-[320px] truncate">
                        {dept.desc}
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/admin/departments/${dept.id}`}>
                          <Button size="sm" variant="outline" className="border-slate-200 text-indigo-600 hover:bg-indigo-50 font-semibold text-xs flex items-center gap-1">
                            Manage Staff
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenEdit(dept)}
                            className="h-8 w-8 text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenDelete(dept)}
                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-md bg-white border border-slate-200 text-slate-900 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {modalMode === 'create' ? 'Add New Department' : 'Edit Department Settings'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Fill in the division details. Users and AI will route complaints based on these properties.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveDepartment}>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="dept-name" className="text-slate-700 text-sm font-semibold">Department Name</Label>
                <Input
                  id="dept-name"
                  placeholder="e.g. Water Works, Public Health"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dept-desc" className="text-slate-700 text-sm font-semibold">Service Scope Description</Label>
                <Textarea
                  id="dept-desc"
                  placeholder="Summarize what this department resolves. AI matches grievances by referencing this scope."
                  rows={4}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  disabled={loading}
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 resize-none"
                />
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
                    Saving...
                  </>
                ) : (
                  'Save Division'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
        <DialogContent className="max-w-md bg-white border border-slate-200 text-slate-900 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Confirm Division Deletion
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 pt-2">
              Are you sure you want to permanently delete the department <strong>"{name}"</strong>? 
              <br />
              <span className="text-rose-500 font-semibold mt-2 block">
                Warning: This action will fail if the department contains assigned grievances or active department staff.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpenDeleteModal(false)}
              className="font-semibold text-slate-500 hover:text-slate-800"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteDepartment}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Department'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
