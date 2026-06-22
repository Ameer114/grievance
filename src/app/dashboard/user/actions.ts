'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { classifyGrievance } from '@/lib/groq/client';
import { revalidatePath } from 'next/cache';
import { sendGrievanceNotificationEmail } from '@/lib/email/nodemailer';
import { Department } from '@/types';

export async function submitGrievanceAction(formData: FormData) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: 'Unauthorized. Please log in.' };
    }

    const adminSupabase = createAdminClient();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const file = formData.get('attachment') as File | null;

    if (!title || !description) {
      return { success: false, message: 'Title and description are required.' };
    }

    // 2. Upload attachment if present
    let attachmentUrl = '';
    if (file && file.size > 0) {
      // Validate file type (Images or PDFs)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        return { success: false, message: 'Only images (JPEG, PNG, GIF) and PDF files are allowed.' };
      }

      // Validate file size (under 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return { success: false, message: 'Evidence file size must be under 5MB.' };
      }

      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `grievances/${fileName}`;

      // Convert File to ArrayBuffer and upload using Admin client to bypass RLS storage policies
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = new Uint8Array(arrayBuffer);

      const { data: uploadData, error: uploadError } = await adminSupabase.storage
        .from('grievance-evidence')
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('File upload error:', uploadError);
        return { success: false, message: `Attachment upload failed: ${uploadError.message}` };
      }

      // Fetch public URL using Admin client
      const { data: publicUrlData } = adminSupabase.storage
        .from('grievance-evidence')
        .getPublicUrl(filePath);

      attachmentUrl = publicUrlData.publicUrl;
    }

    // 3. Fetch departments for AI context using Admin client to bypass RLS select
    const { data: departments, error: deptError } = await adminSupabase
      .from('departments')
      .select('*')
      .order('name', { ascending: true });

    if (deptError || !departments || departments.length === 0) {
      console.error('Failed to fetch departments:', deptError);
      return { success: false, message: 'Database misconfiguration: No departments found.' };
    }

    // 4. Run AI Classification via Groq
    const classification = await classifyGrievance(
      title,
      description,
      departments as Department[]
    );

    // 5. Determine initial status based on AI confidence
    // If confidence is less than 80%, status = "Needs Review". Else status = "Pending".
    const initialStatus = classification.confidence < 80 ? 'Needs Review' : 'Pending';

    // 6. Insert grievance into database using Admin client to bypass RLS
    const { data: grievance, error: insertError } = await adminSupabase
      .from('grievances')
      .insert([
        {
          title,
          description,
          dep_id: classification.department_id,
          status: initialStatus,
          ai_confidance: classification.confidence,
          assigned_by_ai: true,
          attachment: attachmentUrl,
          created_by: user.id,
          resolved_at: null,
          resolved_by: null,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert grievance:', insertError);
      return { success: false, message: `Failed to save grievance: ${insertError.message}` };
    }

    // 7. Send notification email to assigned department staff
    try {
      const assignedDept = departments.find((d) => d.id === classification.department_id);
      const deptName = assignedDept ? assignedDept.name : 'Unknown';

      // Fetch profiles of staff in this department
      const { data: staffProfiles } = await adminSupabase
        .from('profiles')
        .select('id')
        .eq('role', 'department_user')
        .eq('department_id', classification.department_id);

      if (staffProfiles && staffProfiles.length > 0) {
        // Fetch all auth users to match emails
        const { data: authUsersData } = await adminSupabase.auth.admin.listUsers();
        const users = authUsersData?.users || [];

        const staffEmails = staffProfiles
          .map((sp) => users.find((u) => u.id === sp.id)?.email)
          .filter((email): email is string => !!email);

        if (staffEmails.length > 0) {
          // Fetch citizen's profile to get their name
          const { data: citizenProfile } = await adminSupabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

          const citizenName = citizenProfile?.full_name || 'Citizen';
          const detailsUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`;

          // Send the notification email
          await sendGrievanceNotificationEmail({
            emails: staffEmails,
            grievanceId: grievance.id,
            title,
            description,
            citizenName,
            deptName,
            detailsUrl,
          });
        }
      }
    } catch (emailErr) {
      // Log error but do not fail the submission response (so user gets a success toast)
      console.error('Failed to dispatch staff alert email:', emailErr);
    }

    revalidatePath('/dashboard/user', 'layout');

    return {
      success: true,
      message: 'Your grievance has been successfully submitted and routed by AI.',
      data: grievance,
    };
  } catch (error: any) {
    console.error('Grievance submission action error:', error);
    return { success: false, message: error.message || 'An unexpected error occurred.' };
  }
}
