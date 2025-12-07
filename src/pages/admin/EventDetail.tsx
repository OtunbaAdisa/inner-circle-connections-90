import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEvent, useUpdateEvent } from '@/hooks/useEvents';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, QrCode, Calendar, Users, Table2, Image, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { data: event, isLoading } = useEvent(eventId);
  const updateEventMutation = useUpdateEvent();
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_date: '',
    end_time: '',
    status: 'upcoming',
  });

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        description: event.description || '',
        event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '',
        end_time: event.end_time ? new Date(event.end_time).toISOString().slice(0, 16) : '',
        status: event.status || 'upcoming',
      });
    }
  }, [event]);

  const handleUpdate = async () => {
    if (!eventId || !formData.name || !formData.event_date || !formData.end_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await updateEventMutation.mutateAsync({
        id: eventId,
        name: formData.name,
        description: formData.description,
        event_date: new Date(formData.event_date).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        status: formData.status as 'active' | 'upcoming' | 'ended',
      });
      toast.success('Event updated successfully');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const generateQRCode = async () => {
    if (!eventId) return;
    setIsGeneratingQR(true);
    
    try {
      // Generate QR code URL for check-in
      const checkInUrl = `${window.location.origin}/event/${eventId}/checkin`;
      
      // Use a QR code API to generate the image
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(checkInUrl)}`;
      
      // Fetch the QR code image
      const response = await fetch(qrApiUrl);
      const blob = await response.blob();
      
      // Upload to Supabase storage
      const fileName = `event-${eventId}-qr.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('qrcodes')
        .upload(fileName, blob, { upsert: true, contentType: 'image/png' });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from('qrcodes').getPublicUrl(fileName);
      
      // Update event with QR code URL
      await updateEventMutation.mutateAsync({
        id: eventId,
        qr_code_url: urlData.publicUrl,
      });

      toast.success('QR code generated successfully!');
    } catch (error) {
      console.error('QR generation error:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setIsGeneratingQR(false);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Event not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/events')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{event.name}</h1>
            <p className="text-sm text-muted-foreground">Event Details</p>
          </div>
          <Badge variant="outline" className={getStatusColor(event.status || 'upcoming')}>
            {event.status}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Event Details Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Event Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="ended">Ended</option>
                  </select>
                </div>
                <Button onClick={handleUpdate} disabled={updateEventMutation.isPending}>
                  {updateEventMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => navigate(`/admin/events/${eventId}/tables`)}>
                  <Table2 className="h-4 w-4 mr-2" /> Manage Tables
                </Button>
                <Button variant="outline" onClick={() => navigate(`/admin/events/${eventId}/logos`)}>
                  <Image className="h-4 w-4 mr-2" /> Age Band Logos
                </Button>
                <Button variant="outline" onClick={() => navigate(`/event/${eventId}`)}>
                  <Users className="h-4 w-4 mr-2" /> View Event Page
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* QR Code Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Check-In QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.qr_code_url ? (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg flex items-center justify-center">
                      <img 
                        src={event.qr_code_url} 
                        alt="Event QR Code" 
                        className="w-full max-w-[200px] h-auto"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Participants scan this code to check in
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => window.open(event.qr_code_url!, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" /> Download
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={generateQRCode}
                        disabled={isGeneratingQR}
                      >
                        {isGeneratingQR ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Regenerate'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No QR code generated yet</p>
                    <Button onClick={generateQRCode} disabled={isGeneratingQR}>
                      {isGeneratingQR ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <QrCode className="h-4 w-4 mr-2" />
                          Generate QR Code
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Event Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Starts:</span>
                  <span>{format(new Date(event.event_date), 'PPP p')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ends:</span>
                  <span>{format(new Date(event.end_time), 'PPP p')}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
