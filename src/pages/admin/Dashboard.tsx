import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEvents } from '@/hooks/useEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Table2, Image, Plus, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const { user, profile, isAdmin, isLoading } = useAuth();
  const { data: events } = useEvents();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const activeEvents = events?.filter(e => e.status === 'active') || [];
  const upcomingEvents = events?.filter(e => e.status === 'upcoming') || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">Inner Circle</h1>
            <span className="text-sm text-muted-foreground">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{profile?.email}</span>
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              Exit Admin
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Events</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{activeEvents.length}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Events</CardTitle>
              <Calendar className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{upcomingEvents.length}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{events?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Quick Actions</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full" onClick={() => navigate('/admin/events')}>
                <Plus className="h-4 w-4 mr-2" /> New Event
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/admin/events">
            <Card className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  Event Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Create, edit, and manage events. Generate QR codes and monitor attendance.</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/tables">
            <Card className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Table2 className="h-6 w-6 text-accent" />
                  </div>
                  Table Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Configure physical tables for events. Set naming conventions and seat capacity.</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/logos">
            <Card className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/50">
                    <Image className="h-6 w-6 text-foreground" />
                  </div>
                  Age Band Logos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Upload and manage logos for each age band. Customize branding per event.</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {activeEvents.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Active Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeEvents.map(event => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{event.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/admin/events/${event.id}`)}>
                        Manage
                      </Button>
                      <Button size="sm" onClick={() => navigate(`/event/${event.id}`)}>
                        View Live
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
