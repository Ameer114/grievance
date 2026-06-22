'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendCredentialsEmail } from '@/lib/email/nodemailer';
import { revalidatePath } from 'next/cache';

// Check if user is Admin
async function verifyAdminRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    throw new Error('Access denied. Administrator privileges required.');
  }
}

/* ==========================================================================
   DEPARTMENT CRUD ACTIONS
   ========================================================================== */

export async function createDepartmentAction(name: string, desc: string) {
  try {
    await verifyAdminRole();
    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
      .from('departments')
      .insert([{ name, desc }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/admin/departments', 'page');
    revalidatePath('/dashboard/user', 'layout'); // In case submission forms have cached departments

    return { success: true, message: `Department "${name}" created successfully.`, data };
  } catch (error: any) {
    console.error('createDepartmentAction error:', error);
    return { success: false, message: error.message || 'Failed to create department.' };
  }
}

export async function editDepartmentAction(id: number, name: string, desc: string) {
  try {
    await verifyAdminRole();
    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
      .from('departments')
      .update({ name, desc })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/admin/departments', 'page');
    revalidatePath('/dashboard/user', 'layout');

    return { success: true, message: `Department details updated successfully.`, data };
  } catch (error: any) {
    console.error('editDepartmentAction error:', error);
    return { success: false, message: error.message || 'Failed to update department.' };
  }
}

export async function deleteDepartmentAction(id: number) {
  try {
    await verifyAdminRole();
    const adminSupabase = createAdminClient();

    // Note: Due to foreign key constraints, we might want to check if grievances exist
    // For this academic project, we will run the delete. Supabase will return error if constraints violate.
    const { error } = await adminSupabase
      .from('departments')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        throw new Error('Cannot delete department because it has associated grievances. Reassign grievances first.');
      }
      throw new Error(error.message);
    }

    revalidatePath('/dashboard/admin/departments', 'page');
    revalidatePath('/dashboard/user', 'layout');

    return { success: true, message: 'Department deleted successfully.' };
  } catch (error: any) {
    console.error('deleteDepartmentAction error:', error);
    return { success: false, message: error.message || 'Failed to delete department.' };
  }
}

/* ==========================================================================
   DEPARTMENT USER MANAGEMENT ACTIONS
   ========================================================================== */

export async function createDepartmentUserAction(
  fullName: string,
  email: string,
  password: string,
  departmentId: number
) {
  try {
    await verifyAdminRole();
    
    // We must use the Admin client because createAdminClient utilizes SUPABASE_SERVICE_ROLE_KEY.
    // This allows bypass of standard user auth context (otherwise the admin session gets signed out!).
    const adminSupabase = createAdminClient();

    // 1. Fetch department name first for the email template
    const { data: dept, error: deptError } = await adminSupabase
      .from('departments')
      .select('name')
      .eq('id', departmentId)
      .single();

    if (deptError || !dept) {
      throw new Error('Assigned department not found.');
    }

    // 2. Create Supabase Auth user
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email so they can sign in immediately
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Failed to create auth user.');
    }

    const newUser = authData.user;

    // 3. Insert into profiles with role = 'department_user'
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .insert([
        {
          id: newUser.id,
          full_name: fullName,
          role: 'department_user',
          department_id: departmentId,
        },
      ]);

    if (profileError) {
      // Rollback auth user creation if profile setup fails
      await adminSupabase.auth.admin.deleteUser(newUser.id);
      throw new Error(`Profile initialization failed: ${profileError.message}. Auth creation rolled back.`);
    }

    // 4. Send email with Nodemailer
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`;
    const emailSent = await sendCredentialsEmail({
      fullName,
      email,
      tempPassword: password,
      deptName: dept.name,
      loginUrl,
    });

    revalidatePath(`/dashboard/admin/departments/${departmentId}`, 'page');

    return {
      success: true,
      message: `Department user "${fullName}" created successfully.${
        emailSent ? ' Login credentials emailed.' : ' However, credential email failed to transmit.'
      }`,
    };
  } catch (error: any) {
    console.error('createDepartmentUserAction error:', error);
    return { success: false, message: error.message || 'Failed to create department user.' };
  }
}
