'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function updateGrievanceStatusAction(grievanceId: number, status: string) {
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

    // 2. Fetch department user's profile using Admin client to bypass RLS select
    const adminSupabase = createAdminClient();
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('role, department_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'department_user') {
      return { success: false, message: 'Access denied. Department users only.' };
    }

    if (!profile.department_id) {
      return { success: false, message: 'No department assigned to this user profile.' };
    }

    // 3. Fetch the grievance to check ownership using Admin client to bypass RLS select
    const { data: grievance, error: fetchError } = await adminSupabase
      .from('grievances')
      .select('dep_id')
      .eq('id', grievanceId)
      .single();

    if (fetchError || !grievance) {
      return { success: false, message: 'Grievance not found.' };
    }

    // Security check: Check if grievance department matches user department
    if (BigInt(grievance.dep_id) !== BigInt(profile.department_id)) {
      return { success: false, message: 'Access denied. You cannot modify grievances belonging to other departments.' };
    }

    // 4. Update grievance parameters
    const updateData: any = {
      status,
    };

    if (status === 'Resolved') {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = user.id;
    } else {
      // If moving back from Resolved, clear those fields
      updateData.resolved_at = null;
      updateData.resolved_by = null;
    }

    const { error: updateError } = await adminSupabase
      .from('grievances')
      .update(updateData)
      .eq('id', grievanceId);

    if (updateError) {
      console.error('Failed to update grievance status:', updateError);
      return { success: false, message: `Status update failed: ${updateError.message}` };
    }

    revalidatePath('/dashboard/department', 'layout');

    return {
      success: true,
      message: `Grievance status updated to ${status} successfully.`,
    };
  } catch (error: any) {
    console.error('updateGrievanceStatusAction error:', error);
    return { success: false, message: error.message || 'An unexpected error occurred.' };
  }
}
