import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/useEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Calendar, QrCode, Users, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function EventManagement() {
  const { user } = useAuth();
  const { data: events } = useEvents();
  const createEventMutation = useCreateEvent();
  const deleteEventMutation = useDeleteEvent();
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_date: '',
    end_time: '',
  });

  const handleCreate = async () => {
    if (!formData.name || !formData.event_date || !formData.end_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createEventMutation.mutateAsync({
        name: formData.name,
        description: formData.description,
        event_date: new Date(formData.event_date).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        created_by: user?.id || null,
        status: 'upcoming',
      });
      setIsCreateOpen(false);
      setFormData({ name: '', description: '', event_date: '', end_time: '' });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      await deleteEventMutation.mutateAsync(eventId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'upcoming': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ended': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Event Management</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">Create and manage networking events</p>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Event Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Annual Networking Gala"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your event..."
                  />
                </div>
                <div>
                  <Label htmlFor="event_date">Start Date & Time *</Label>
                  <Input
                    id="event_date"
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Date & Time *</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={createEventMutation.isPending}>
                  {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {events?.length === 0 && (
            <Card className="py-12">
              <CardContent className="text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No events yet. Create your first event to get started.</p>
              </CardContent>
            </Card>
          )}

          {events?.map(event => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    {event.name}
                    <Badge variant="outline" className={getStatusColor(event.status || 'upcoming')}>
                      {event.status}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/events/${event.id}`)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(event.event_date), 'PPP p')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    <span>{event.qr_code_url ? 'QR Generated' : 'No QR Code'}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/admin/events/${event.id}/tables`)}>
                    <Users className="h-4 w-4 mr-2" /> Manage Tables
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/event/${event.id}`)}>
                    View Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
