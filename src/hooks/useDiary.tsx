import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DiaryEntry, ParticipantNote } from '@/types/database';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export function useDiaryEntries(eventId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['diary', eventId, user?.id],
    queryFn: async () => {
      if (!eventId || !user) return [];
      
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DiaryEntry[];
    },
    enabled: !!eventId && !!user,
  });
}

export function useCreateDiaryEntry() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ eventId, content }: { eventId: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('diary_entries')
        .insert({
          user_id: user.id,
          event_id: eventId,
          content,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as DiaryEntry;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['diary', variables.eventId] });
      toast.success('Diary entry added');
    },
    onError: (error) => {
      toast.error('Failed to save diary entry: ' + error.message);
    },
  });
}

export function useParticipantNotes(eventId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['notes', eventId, user?.id],
    queryFn: async () => {
      if (!eventId || !user) return [];
      
      const { data, error } = await supabase
        .from('participant_notes')
        .select('*')
        .eq('event_id', eventId)
        .eq('author_id', user.id);
      
      if (error) throw error;
      return data as ParticipantNote[];
    },
    enabled: !!eventId && !!user,
  });
}

export function useUpsertNote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      eventId, 
      targetParticipantId, 
      note 
    }: { 
      eventId: string; 
      targetParticipantId: string; 
      note: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('participant_notes')
        .upsert({
          author_id: user.id,
          event_id: eventId,
          target_participant_id: targetParticipantId,
          note,
        }, {
          onConflict: 'author_id,target_participant_id,event_id'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as ParticipantNote;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes', variables.eventId] });
      toast.success('Note saved');
    },
    onError: (error) => {
      toast.error('Failed to save note: ' + error.message);
    },
  });
}
