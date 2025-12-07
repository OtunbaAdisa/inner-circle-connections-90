import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, User } from 'lucide-react';
import type { ParticipantProfile, CircleLevel } from '@/types/database';

interface MyCirclesProps {
  eventId: string;
}

interface PromotionWithParticipant {
  promoted_to: CircleLevel;
  participant: ParticipantProfile;
}

export function MyCircles({ eventId }: MyCirclesProps) {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<PromotionWithParticipant[]>([]);
  const [activeTab, setActiveTab] = useState<CircleLevel>('inner');

  useEffect(() => {
    if (user) loadPromotions();
  }, [user, eventId]);

  const loadPromotions = async () => {
    const { data } = await supabase
      .from('circle_promotions')
      .select(`
        promoted_to,
        target_participant_id
      `)
      .eq('promoter_id', user?.id)
      .eq('event_id', eventId);

    if (data) {
      // Fetch participant profiles
      const participantIds = data.map(d => d.target_participant_id);
      
      const { data: participants } = await supabase
        .from('participant_profiles')
        .select('*')
        .in('id', participantIds);

      if (participants) {
        const promotionsWithParticipants = data.map(promotion => ({
          promoted_to: promotion.promoted_to as CircleLevel,
          participant: participants.find(p => p.id === promotion.target_participant_id) as ParticipantProfile,
        })).filter(p => p.participant);

        setPromotions(promotionsWithParticipants);
      }
    }
  };

  const innerCircle = promotions.filter(p => p.promoted_to === 'inner');
  const middleCircle = promotions.filter(p => p.promoted_to === 'middle');

  const renderParticipantList = (list: PromotionWithParticipant[]) => {
    if (list.length === 0) {
      return (
        <Card className="py-8">
          <CardContent className="text-center">
            <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No one in this circle yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Promote participants from the Stadium view.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3">
        {list.map(({ participant }) => (
          <Card key={participant.id} className="overflow-hidden">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border shrink-0">
                {participant.selfie_url ? (
                  <img 
                    src={participant.selfie_url} 
                    alt={participant.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-lg font-medium text-muted-foreground">
                    {participant.full_name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{participant.full_name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-primary" />
        My Circles
      </h2>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CircleLevel)}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="inner" className="flex-1">
            Inner ({innerCircle.length})
          </TabsTrigger>
          <TabsTrigger value="middle" className="flex-1">
            Middle ({middleCircle.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inner">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Your Inner Circle — these participants will receive connection requests when the event ends.
            </p>
          </div>
          {renderParticipantList(innerCircle)}
        </TabsContent>

        <TabsContent value="middle">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Your Middle Circle — consider promoting them to Inner before the event ends.
            </p>
          </div>
          {renderParticipantList(middleCircle)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
