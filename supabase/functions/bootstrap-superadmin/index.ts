import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role client for admin operations
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const email = 'superadmin@innercircle.app';
    const password = 'Admin123!';

    // Check if super admin already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingAdmin = existingUsers?.users?.find(u => u.email === email);

    if (existingAdmin) {
      console.log('Super admin already exists, checking role...');
      
      // Ensure role exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', existingAdmin.id)
        .eq('role', 'super_admin')
        .maybeSingle();

      if (!existingRole) {
        await supabase.from('user_roles').insert({
          user_id: existingAdmin.id,
          role: 'super_admin'
        });
        console.log('Added super_admin role to existing user');
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Super admin already exists',
          email 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the super admin user
    console.log('Creating super admin user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Super Administrator' }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }

    console.log('User created:', newUser.user?.id);

    // Add super_admin role
    const { error: roleError } = await supabase.from('user_roles').insert({
      user_id: newUser.user!.id,
      role: 'super_admin'
    });

    if (roleError) {
      console.error('Error adding role:', roleError);
      throw roleError;
    }

    console.log('Super admin role assigned');

    // Set force_password_change on profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ force_password_change: true })
      .eq('user_id', newUser.user!.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Non-critical, profile trigger should have created it
    }

    console.log('Super admin bootstrap complete');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Super admin created successfully',
        email,
        note: 'Please change the password on first login'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Bootstrap error:', message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
