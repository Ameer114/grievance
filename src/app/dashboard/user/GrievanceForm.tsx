'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { submitGrievanceAction } from './actions';
import { Loader2, FileText, Upload, AlertCircle, Trash2 } from 'lucide-react';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

const grievanceSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters long to help AI classification'),
});

type FormValues = z.infer<typeof grievanceSchema>;

export default function GrievanceForm() {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(grievanceSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 5MB');
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only images (JPEG, PNG, GIF) and PDF files are allowed');
      return;
    }

    setSelectedFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    const toastId = toast.loading('Submitting grievance to AI router...');

    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description);
      if (selectedFile) {
        formData.append('attachment', selectedFile);
      }

      const response = await submitGrievanceAction(formData);

      if (response && response.success) {
        toast.success(response.message || 'Grievance submitted successfully!', { id: toastId });
        reset();
        removeFile();
      } else {
        toast.error(response.message || 'Submission failed.', { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error('An unexpected error occurred during submission.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200/80 shadow-md shadow-slate-100 bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-600" />
          Submit a New Grievance
        </CardTitle>
        <CardDescription>
          Detail your complaint. Our AI will automatically categorize it and route it to the appropriate department.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-slate-700 text-sm font-semibold">Grievance Title</Label>
            <Input
              id="title"
              placeholder="Provide a clear, concise title for the issue"
              className="bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20"
              {...register('title')}
              disabled={loading}
            />
            {errors.title && (
              <p className="text-xs text-rose-500 font-semibold">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-slate-700 text-sm font-semibold">Detailed Description</Label>
            <Textarea
              id="description"
              placeholder="Explain the problem in detail (what, where, when). This text is processed by our AI classifier to route your grievance."
              rows={5}
              className="bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20 resize-none"
              {...register('description')}
              disabled={loading}
            />
            {errors.description && (
              <p className="text-xs text-rose-500 font-semibold">{errors.description.message}</p>
            )}
          </div>

          {/* Attachment */}
          <div className="space-y-2">
            <Label className="text-slate-700 text-sm font-semibold">Evidence Attachment (Optional)</Label>
            
            <div className="flex items-center gap-3">
              <input
                type="file"
                id="file-upload"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,.pdf"
                className="hidden"
                disabled={loading}
              />
              <Button
                type="button"
                variant="outline"
                className="border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/30 text-slate-600 hover:text-indigo-600 transition-all font-medium py-5"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Image or PDF
              </Button>
              <span className="text-xs text-slate-400">Max size: 5MB</span>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 mt-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                  <span className="text-sm truncate font-medium">{selectedFile.name}</span>
                  <span className="text-xs text-slate-400">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-rose-600 h-8 w-8 rounded-md hover:bg-rose-50"
                  onClick={removeFile}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-start gap-3 mt-4 text-xs text-indigo-800">
            <AlertCircle className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">AI Routing Note:</span> E-Grievance uses state-of-the-art NLP models to dynamically route grievances to the proper municipality department. Ensure your description has sufficient detail for accurate assignment.
            </div>
          </div>
        </CardContent>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end rounded-b-xl">
          <Button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 shadow-sm shadow-indigo-500/10"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Grievance...
              </>
            ) : (
              'Submit Complaint'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
