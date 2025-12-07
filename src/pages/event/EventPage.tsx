import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useParticipants, useMyParticipantProfile } from '@/hooks/useParticipants';
import { CircleStadium } from '@/components/circle/CircleStadium';
import { SessionDiary } from '@/components/diary/SessionDiary';
import { MyCircles } from '@/components/connections/MyCircles';
import { ConnectionReveal } from '@/components/connections/ConnectionReveal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, BookOpen, Heart, LogOut } from 'lucide-react';
import type { Event, ParticipantProfile } from '@/types/database';

export default function EventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: participants, isLoading: participantsLoading } = useParticipants(eventId);
  const { data: myParticipantProfile, isLoading: profileLoading } = useMyParticipantProfile(eventId);
  const [event, setEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState('circle');

  const isLoading = participantsLoading || profileLoading;

  useEffect(() => {
    if (eventId) fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();
    
    if (data) setEvent(data as Event);
  };

  // Redirect to check-in if not registered
  useEffect(() => {
    if (!isLoading && user && !myParticipantProfile && eventId) {
      navigate(`/event/${eventId}/checkin`);
    }
  }, [isLoading, user, myParticipantProfile, eventId, navigate]);

  if (!user) {
    navigate(`/event/${eventId}/checkin`);
    return null;
  }

  if (isLoading || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading event...</div>
      </div>
    );
  }

  const isEventEnded = event.status === 'ended' || new Date(event.end_time) < new Date();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">{event.name}</h1>
            <p className="text-xs text-muted-foreground">
              {myParticipantProfile?.full_name} • Table {myParticipantProfile?.physical_table_id ? 'Assigned' : 'Pending'}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="flex-1 overflow-hidden">
          <TabsContent value="circle" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
            {isEventEnded ? (
              <ConnectionReveal eventId={eventId!} />
            ) : (
              <CircleStadium 
                participants={participants || []} 
                currentUserId={user.id}
                eventId={eventId!}
              />
            )}
          </TabsContent>
          <TabsContent value="diary" className="h-full m-0 overflow-auto">
            <SessionDiary eventId={eventId!} />
          </TabsContent>
          <TabsContent value="circles" className="h-full m-0 overflow-auto">
            <MyCircles eventId={eventId!} />
          </TabsContent>
        </div>

        <TabsList className="w-full rounded-none border-t border-border h-16 bg-card">
          <TabsTrigger value="circle" className="flex-1 flex flex-col gap-1 h-full data-[state=active]:bg-primary/10">
            <Users className="h-5 w-5" />
            <span className="text-xs">Stadium</span>
          </TabsTrigger>
          <TabsTrigger value="diary" className="flex-1 flex flex-col gap-1 h-full data-[state=active]:bg-primary/10">
            <BookOpen className="h-5 w-5" />
            <span className="text-xs">Diary</span>
          </TabsTrigger>
          <TabsTrigger value="circles" className="flex-1 flex flex-col gap-1 h-full data-[state=active]:bg-primary/10">
            <Heart className="h-5 w-5" />
            <span className="text-xs">My Circles</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
