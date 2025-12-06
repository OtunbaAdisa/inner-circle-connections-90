import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ParticipantProfile, CirclePromotion, ParticipantWithPromotion, CircleLevel, calculateAge, getAgeBand } from '@/types/database';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export function useParticipants(eventId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['participants', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      // Fetch participants
      const { data: participants, error } = await supabase
        .from('participant_profiles')
        .select('*')
        .eq('event_id', eventId);
      
      if (error) throw error;

      // Fetch my promotions for these participants
      if (user) {
        const { data: promotions } = await supabase
          .from('circle_promotions')
          .select('*')
          .eq('promoter_id', user.id)
          .eq('event_id', eventId);

        // Merge promotions with participants
        const participantsWithPromotions: ParticipantWithPromotion[] = (participants as ParticipantProfile[]).map(p => {
          const promotion = promotions?.find(pr => pr.target_participant_id === p.id);
          return {
            ...p,
            promotion: promotion as CirclePromotion | undefined,
            myPromotedLevel: promotion?.promoted_to as CircleLevel | undefined,
          };
        });

        return participantsWithPromotions;
      }

      return participants as ParticipantWithPromotion[];
    },
    enabled: !!eventId,
  });
}

export function useMyParticipantProfile(eventId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['myParticipantProfile', eventId, user?.id],
    queryFn: async () => {
      if (!eventId || !user) return null;
      
      const { data, error } = await supabase
        .from('participant_profiles')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as ParticipantProfile | null;
    },
    enabled: !!eventId && !!user,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      eventId, 
      fullName, 
      birthday, 
      selfieUrl 
    }: { 
      eventId: string; 
      fullName: string; 
      birthday: string; 
      selfieUrl?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const age = calculateAge(birthday);
      const ageBand = getAgeBand(age);

      // Get next available seat index
      const { data: existingParticipants } = await supabase
        .from('participant_profiles')
        .select('virtual_seat_index')
        .eq('event_id', eventId)
        .order('virtual_seat_index', { ascending: false })
        .limit(1);

      const nextSeatIndex = existingParticipants && existingParticipants.length > 0 
        ? (existingParticipants[0].virtual_seat_index ?? 0) + 1 
        : 0;

      // Auto-assign to a physical table
      const { data: tables } = await supabase
        .from('physical_tables')
        .select('id, number_of_seats')
        .eq('event_id', eventId);

      let physicalTableId: string | null = null;
      let physicalSeatNumber: number | null = null;

      if (tables && tables.length > 0) {
        // Find table with available seats
        for (const table of tables) {
          const { count } = await supabase
            .from('participant_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('physical_table_id', table.id);
          
          if ((count ?? 0) < table.number_of_seats) {
            physicalTableId = table.id;
            physicalSeatNumber = (count ?? 0) + 1;
            break;
          }
        }
      }

      const { data, error } = await supabase
        .from('participant_profiles')
        .insert({
          user_id: user.id,
          event_id: eventId,
          full_name: fullName,
          birthday,
          age,
          age_band: ageBand,
          selfie_url: selfieUrl,
          virtual_seat_index: nextSeatIndex,
          circle_level: 'outer',
          physical_table_id: physicalTableId,
          physical_seat_number: physicalSeatNumber,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as ParticipantProfile;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['participants', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['myParticipantProfile', variables.eventId] });
      toast.success('Successfully checked in!');
    },
    onError: (error) => {
      toast.error('Check-in failed: ' + error.message);
    },
  });
}

export function usePromoteParticipant() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      participantId, 
      eventId, 
      promoteTo 
    }: { 
      participantId: string; 
      eventId: string; 
      promoteTo: CircleLevel;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Upsert promotion
      const { data, error } = await supabase
        .from('circle_promotions')
        .upsert({
          promoter_id: user.id,
          target_participant_id: participantId,
          event_id: eventId,
          promoted_to: promoteTo,
        }, {
          onConflict: 'promoter_id,target_participant_id,event_id'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as CirclePromotion;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['participants', variables.eventId] });
      toast.success(`Moved to ${variables.promoteTo} circle`);
    },
    onError: (error) => {
      toast.error('Failed to promote: ' + error.message);
    },
  });
}

export function useDemoteParticipant() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      participantId, 
      eventId,
      demoteTo
    }: { 
      participantId: string; 
      eventId: string;
      demoteTo: CircleLevel | null;
    }) => {
      if (!user) throw new Error('Not authenticated');

      if (demoteTo === null) {
        // Remove promotion entirely
        const { error } = await supabase
          .from('circle_promotions')
          .delete()
          .eq('promoter_id', user.id)
          .eq('target_participant_id', participantId)
          .eq('event_id', eventId);
        
        if (error) throw error;
        return null;
      } else {
        // Update to lower level
        const { data, error } = await supabase
          .from('circle_promotions')
          .update({ promoted_to: demoteTo })
          .eq('promoter_id', user.id)
          .eq('target_participant_id', participantId)
          .eq('event_id', eventId)
          .select()
          .single();
        
        if (error) throw error;
        return data as CirclePromotion;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['participants', variables.eventId] });
      toast.success(variables.demoteTo ? `Moved to ${variables.demoteTo} circle` : 'Removed from circles');
    },
    onError: (error) => {
      toast.error('Failed to demote: ' + error.message);
    },
  });
}
