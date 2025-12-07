import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, UserCog, Trash2, Shield, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: {
    email: string;
    full_name: string;
  };
}

export default function AdminManagement() {
  const navigate = useNavigate();
  const { user, isSuperAdmin, isLoading: authLoading } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
  });

  useEffect(() => {
    if (!authLoading && (!user || !isSuperAdmin)) {
      toast.error('Only super admins can access this page');
      navigate('/admin');
    }
  }, [user, isSuperAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAdmins();
    }
  }, [isSuperAdmin]);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      // Fetch user roles with admin or super_admin role
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['admin', 'super_admin']);

      if (rolesError) throw rolesError;

      // Fetch profiles for these users
      if (roles && roles.length > 0) {
        const userIds = roles.map(r => r.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, email, full_name')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const adminsWithProfiles = roles.map(role => ({
          ...role,
          profile: profiles?.find(p => p.user_id === role.user_id)
        }));

        setAdmins(adminsWithProfiles);
      } else {
        setAdmins([]);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to fetch admin users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!formData.email || !formData.password || !formData.full_name) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsCreating(true);
    try {
      // Create user through Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.full_name }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      // Add admin role
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: authData.user.id,
        role: 'admin'
      });

      if (roleError) throw roleError;

      toast.success('Admin created successfully');
      setIsCreateOpen(false);
      setFormData({ email: '', password: '', full_name: '' });
      fetchAdmins();
    } catch (error: any) {
      console.error('Error creating admin:', error);
      toast.error(error.message || 'Failed to create admin');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRemoveAdmin = async (roleId: string, userId: string) => {
    if (userId === user?.id) {
      toast.error("You cannot remove your own admin access");
      return;
    }

    if (!confirm('Are you sure you want to remove this admin?')) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast.success('Admin removed successfully');
      fetchAdmins();
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error('Failed to remove admin');
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'super_admin') {
      return (
        <Badge className="bg-primary/10 text-primary border-primary/20">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Super Admin
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-accent/10 text-accent-foreground">
        <Shield className="h-3 w-3 mr-1" />
        Admin
      </Badge>
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Admin Management</h1>
            <p className="text-sm text-muted-foreground">Manage administrator accounts</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">
            {admins.length} administrator{admins.length !== 1 ? 's' : ''} total
          </p>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Admin</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                  />
                </div>
                <Button onClick={handleCreateAdmin} className="w-full" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Admin'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {admins.length === 0 && (
            <Card className="py-12">
              <CardContent className="text-center">
                <UserCog className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No administrators found</p>
              </CardContent>
            </Card>
          )}

          {admins.map((admin) => (
            <Card key={admin.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCog className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {admin.profile?.full_name || 'Unknown'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {admin.profile?.email || 'No email'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getRoleBadge(admin.role)}
                  {admin.role !== 'super_admin' && admin.user_id !== user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAdmin(admin.id, admin.user_id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
