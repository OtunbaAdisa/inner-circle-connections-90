import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Check, X, Sparkles, User } from 'lucide-react';
import { toast } from 'sonner';
import { AGE_BAND_INFO, type AgeBand } from '@/types/database';

interface ConnectionRevealProps {
  eventId: string;
}

interface ConnectionRequest {
  id: string;
  requester_id: string;
  target_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  requester_profile?: {
    full_name: string;
    selfie_url: string | null;
    age_band: AgeBand;
  };
  target_profile?: {
    full_name: string;
    selfie_url: string | null;
    age_band: AgeBand;
  };
  age_band_logo?: string;
}

export function ConnectionReveal({ eventId }: ConnectionRevealProps) {
  const { user } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState<ConnectionRequest[]>([]);
  const [mutualConnections, setMutualConnections] = useState<ConnectionRequest[]>([]);
  const [ageBandLogos, setAgeBandLogos] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('incoming');

  useEffect(() => {
    if (user) {
      loadConnections();
      loadAgeBandLogos();
    }
  }, [user, eventId]);

  const loadAgeBandLogos = async () => {
    const { data } = await supabase
      .from('age_band_logos')
      .select('band_name, logo_url')
      .eq('event_id', eventId);

    if (data) {
      const logos: Record<string, string> = {};
      data.forEach(logo => {
        logos[logo.band_name] = logo.logo_url;
      });
      setAgeBandLogos(logos);
    }
  };

  const loadConnections = async () => {
    // Get incoming pending requests (where I'm the target)
    const { data: incoming } = await supabase
      .from('connections')
      .select('*')
      .eq('event_id', eventId)
      .eq('target_id', user?.id)
      .eq('status', 'pending');

    // Get accepted connections (both ways)
    const { data: accepted } = await supabase
      .from('connections')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user?.id},target_id.eq.${user?.id}`);

    // Load participant profiles for all connections
    if (incoming) {
      const enriched = await enrichConnections(incoming);
      setIncomingRequests(enriched);
    }

    if (accepted) {
      const enriched = await enrichConnections(accepted);
      setMutualConnections(enriched);
    }
  };

  const enrichConnections = async (connections: any[]): Promise<ConnectionRequest[]> => {
    const userIds = [...new Set(connections.flatMap(c => [c.requester_id, c.target_id]))];
    
    const { data: profiles } = await supabase
      .from('participant_profiles')
      .select('user_id, full_name, selfie_url, age_band')
      .eq('event_id', eventId)
      .in('user_id', userIds);

    return connections.map(conn => ({
      ...conn,
      requester_profile: profiles?.find(p => p.user_id === conn.requester_id),
      target_profile: profiles?.find(p => p.user_id === conn.target_id),
    }));
  };

  const handleAccept = async (connectionId: string) => {
    await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('id', connectionId);

    toast.success('Connection accepted! 🎉');
    loadConnections();
  };

  const handleReject = async (connectionId: string) => {
    await supabase
      .from('connections')
      .update({ status: 'rejected' })
      .eq('id', connectionId);

    toast.success('Connection declined');
    loadConnections();
  };

  const renderConnectionCard = (connection: ConnectionRequest, showActions: boolean) => {
    const otherProfile = connection.requester_id === user?.id 
      ? connection.target_profile 
      : connection.requester_profile;

    if (!otherProfile) return null;

    const logo = ageBandLogos[otherProfile.age_band];
    const bandInfo = AGE_BAND_INFO[otherProfile.age_band];

    return (
      <Card key={connection.id} className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-accent">
                {otherProfile.selfie_url ? (
                  <img 
                    src={otherProfile.selfie_url} 
                    alt={otherProfile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
                    {otherProfile.full_name.charAt(0)}
                  </div>
                )}
              </div>
              {connection.status === 'accepted' && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg">{otherProfile.full_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                {logo ? (
                  <img src={logo} alt={bandInfo.label} className="h-6 w-6 rounded" />
                ) : (
                  <div className={`w-3 h-3 rounded-full ${bandInfo.color}`} />
                )}
                <span className="text-sm text-muted-foreground">{bandInfo.label}</span>
              </div>
            </div>

            {showActions && (
              <div className="flex gap-2">
                <Button size="icon" variant="outline" onClick={() => handleReject(connection.id)}>
                  <X className="h-4 w-4" />
                </Button>
                <Button size="icon" onClick={() => handleAccept(connection.id)}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <Sparkles className="h-8 w-8 text-accent" />
        </div>
        <h2 className="text-2xl font-bold">Event Ended</h2>
        <p className="text-muted-foreground mt-1">Time to reveal your connections!</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="incoming" className="flex-1">
            Incoming ({incomingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="connections" className="flex-1">
            Connected ({mutualConnections.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-3">
          {incomingRequests.length === 0 ? (
            <Card className="py-8">
              <CardContent className="text-center">
                <Heart className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No pending requests</p>
              </CardContent>
            </Card>
          ) : (
            incomingRequests.map(conn => renderConnectionCard(conn, true))
          )}
        </TabsContent>

        <TabsContent value="connections" className="space-y-3">
          {mutualConnections.length === 0 ? (
            <Card className="py-8">
              <CardContent className="text-center">
                <User className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No connections yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Accept incoming requests to make connections
                </p>
              </CardContent>
            </Card>
          ) : (
            mutualConnections.map(conn => renderConnectionCard(conn, false))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
