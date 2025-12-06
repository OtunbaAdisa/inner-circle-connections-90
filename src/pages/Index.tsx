import { useAuth } from '@/hooks/useAuth';
import { useEvents } from '@/hooks/useEvents';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleDot, Calendar, Users, LogOut, Shield, QrCode } from 'lucide-react';
import { format } from 'date-fns';

export default function Index() {
  const { user, isLoading, isAdmin, signOut } = useAuth();
  const { data: events, isLoading: eventsLoading } = useEvents();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <CircleDot className="h-16 w-16 text-primary" />
              <div className="absolute inset-0 animate-pulse-glow rounded-full" />
            </div>
          </div>
          <h1 className="font-display text-5xl font-bold text-foreground">Inner Circle</h1>
          <p className="text-xl text-muted-foreground max-w-md">
            Form meaningful connections through our unique reverse-stadium networking experience
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const upcomingEvents = events?.filter(e => e.status !== 'ended') || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CircleDot className="h-8 w-8 text-primary" />
            <h1 className="font-display text-2xl font-bold">Inner Circle</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Button variant="outline" asChild>
                <Link to="/admin">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Link>
              </Button>
            )}
            <Button variant="ghost" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="font-display text-3xl font-bold mb-2">Welcome Back</h2>
          <p className="text-muted-foreground">Join an event or view your connections</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {eventsLoading ? (
            <div className="col-span-full text-center text-muted-foreground py-12">
              Loading events...
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Events Yet</h3>
              <p className="text-muted-foreground">
                {isAdmin ? 'Create your first event from the admin dashboard.' : 'Check back later for upcoming events.'}
              </p>
            </div>
          ) : (
            upcomingEvents.map(event => (
              <Card key={event.id} className="glass-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="font-display">{event.name}</CardTitle>
                      <CardDescription>{event.description}</CardDescription>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      event.status === 'active' ? 'bg-success text-success-foreground' : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-muted-foreground mb-4">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(event.event_date), 'PPP p')}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <Link to={`/event/${event.id}`}>
                        <Users className="h-4 w-4 mr-2" />
                        Enter Event
                      </Link>
                    </Button>
                    {event.qr_code_url && (
                      <Button variant="outline" size="icon">
                        <QrCode className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
