import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, full_name } = body;

    // Update auth email if changed
    if (email && email !== user.email) {
      const { error: updateEmailError } = await supabase.auth.updateUser({
        email,
      });

      if (updateEmailError) throw updateEmailError;
    }

    // Update profile
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        full_name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create account deletion request
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 30); // 30 days from now

    const { data, error } = await supabase
      .from('account_deletion_requests')
      .insert({
        user_id: user.id,
        confirmation_token: crypto.randomUUID(),
        confirmed: false,
        scheduled_deletion_date: scheduledDate.toISOString().split('T')[0],
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // In production, send confirmation email here

    return NextResponse.json({
      message: 'Account deletion scheduled. You will receive a confirmation email.',
      scheduled_date: scheduledDate.toISOString(),
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
