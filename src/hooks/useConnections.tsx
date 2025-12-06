import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Connection, ConnectionStatus } from '@/types/database';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export function useConnections(eventId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['connections', eventId, user?.id],
    queryFn: async () => {
      if (!eventId || !user) return [];
      
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .eq('event_id', eventId)
        .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`);
      
      if (error) throw error;
      return data as Connection[];
    },
    enabled: !!eventId && !!user,
  });
}

export function useMutualConnections(eventId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['mutualConnections', eventId, user?.id],
    queryFn: async () => {
      if (!eventId || !user) return [];
      
      // Get connections where I sent request AND target accepted
      const { data: myRequests, error: err1 } = await supabase
        .from('connections')
        .select('*')
        .eq('event_id', eventId)
        .eq('requester_id', user.id)
        .eq('status', 'accepted');
      
      if (err1) throw err1;

      // Get connections where someone requested me AND I accepted
      const { data: requestsToMe, error: err2 } = await supabase
        .from('connections')
        .select('*')
        .eq('event_id', eventId)
        .eq('target_id', user.id)
        .eq('status', 'accepted');
      
      if (err2) throw err2;

      // Find mutual (both sides accepted)
      const mutualUserIds = new Set<string>();
      
      myRequests?.forEach(req => {
        // Check if they also sent me a request that I accepted
        const theirRequest = requestsToMe?.find(r => r.requester_id === req.target_id);
        if (theirRequest) {
          mutualUserIds.add(req.target_id);
        }
      });

      return Array.from(mutualUserIds);
    },
    enabled: !!eventId && !!user,
  });
}

export function useCreateConnections() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      eventId, 
      targetUserIds 
    }: { 
      eventId: string; 
      targetUserIds: string[];
    }) => {
      if (!user) throw new Error('Not authenticated');

      const connections = targetUserIds.map(targetId => ({
        requester_id: user.id,
        target_id: targetId,
        event_id: eventId,
        status: 'pending' as ConnectionStatus,
      }));

      const { data, error } = await supabase
        .from('connections')
        .upsert(connections, {
          onConflict: 'requester_id,target_id,event_id'
        })
        .select();
      
      if (error) throw error;
      return data as Connection[];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['connections', variables.eventId] });
      toast.success('Connection requests sent!');
    },
    onError: (error) => {
      toast.error('Failed to send connections: ' + error.message);
    },
  });
}

export function useRespondToConnection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      connectionId, 
      eventId,
      status,
      message
    }: { 
      connectionId: string;
      eventId: string;
      status: 'accepted' | 'rejected';
      message?: string;
    }) => {
      const { data, error } = await supabase
        .from('connections')
        .update({ status, message })
        .eq('id', connectionId)
        .select()
        .single();
      
      if (error) throw error;
      return data as Connection;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['connections', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['mutualConnections', variables.eventId] });
      toast.success(variables.status === 'accepted' ? 'Connection accepted!' : 'Connection declined');
    },
    onError: (error) => {
      toast.error('Failed to respond: ' + error.message);
    },
  });
}
