import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ParticipantPreviewModal } from '@/components/participant/ParticipantPreviewModal';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { ParticipantProfile, CircleLevel } from '@/types/database';

interface CircleStadiumProps {
  participants: ParticipantProfile[];
  currentUserId: string;
  eventId: string;
}

interface PromotionState {
  [participantId: string]: CircleLevel;
}

export function CircleStadium({ participants, currentUserId, eventId }: CircleStadiumProps) {
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantProfile | null>(null);
  const [promotions, setPromotions] = useState<PromotionState>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Load user's promotions on mount
  useMemo(() => {
    const loadPromotions = async () => {
      const { data } = await supabase
        .from('circle_promotions')
        .select('target_participant_id, promoted_to')
        .eq('promoter_id', currentUserId)
        .eq('event_id', eventId);

      if (data) {
        const promotionMap: PromotionState = {};
        data.forEach(p => {
          promotionMap[p.target_participant_id] = p.promoted_to as CircleLevel;
        });
        setPromotions(promotionMap);
      }
    };
    loadPromotions();
  }, [currentUserId, eventId]);

  const getParticipantLevel = (participantId: string): CircleLevel => {
    return promotions[participantId] || 'outer';
  };

  const filteredParticipants = participants.filter(p => 
    p.user_id !== currentUserId &&
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const outerCircle = filteredParticipants.filter(p => getParticipantLevel(p.id) === 'outer');
  const middleCircle = filteredParticipants.filter(p => getParticipantLevel(p.id) === 'middle');
  const innerCircle = filteredParticipants.filter(p => getParticipantLevel(p.id) === 'inner');

  const handlePromote = async (participantId: string, newLevel: CircleLevel) => {
    const currentLevel = getParticipantLevel(participantId);
    
    if (newLevel === 'outer') {
      // Delete promotion
      await supabase
        .from('circle_promotions')
        .delete()
        .eq('promoter_id', currentUserId)
        .eq('target_participant_id', participantId)
        .eq('event_id', eventId);
    } else if (currentLevel === 'outer') {
      // Insert new promotion
      await supabase
        .from('circle_promotions')
        .insert({
          promoter_id: currentUserId,
          target_participant_id: participantId,
          event_id: eventId,
          promoted_to: newLevel,
        });
    } else {
      // Update existing promotion
      await supabase
        .from('circle_promotions')
        .update({ promoted_to: newLevel })
        .eq('promoter_id', currentUserId)
        .eq('target_participant_id', participantId)
        .eq('event_id', eventId);
    }

    setPromotions(prev => ({
      ...prev,
      [participantId]: newLevel,
    }));
  };

  const renderCircle = (level: CircleLevel, participantList: ParticipantProfile[], radius: number) => {
    const count = participantList.length;
    if (count === 0) return null;

    return participantList.map((participant, index) => {
      const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
      const x = 50 + radius * Math.cos(angle);
      const y = 50 + radius * Math.sin(angle);

      return (
        <button
          key={participant.id}
          className={`
            absolute w-10 h-10 md:w-12 md:h-12 rounded-full border-2 overflow-hidden
            transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500
            hover:scale-110 hover:z-10 focus:outline-none focus:ring-2 focus:ring-primary
            ${level === 'inner' ? 'border-accent shadow-glow-accent' : 
              level === 'middle' ? 'border-primary shadow-glow-primary' : 
              'border-border'}
          `}
          style={{ left: `${x}%`, top: `${y}%` }}
          onClick={() => setSelectedParticipant(participant)}
        >
          {participant.selfie_url ? (
            <img 
              src={participant.selfie_url} 
              alt={participant.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
              {participant.full_name.charAt(0)}
            </div>
          )}
        </button>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search participants..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-4 mt-3 text-sm">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-border" /> Outer ({outerCircle.length})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" /> Middle ({middleCircle.length})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-accent" /> Inner ({innerCircle.length})
          </span>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden stadium-container">
        {/* 3D Stadium perspective */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[90vmin] h-[90vmin] max-w-[500px] max-h-[500px] stadium-perspective">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-muted bg-muted/20 circle-outer" />
            
            {/* Middle ring */}
            <div className="absolute inset-[15%] rounded-full border-2 border-primary/30 bg-primary/5 circle-middle" />
            
            {/* Inner ring (elevated) */}
            <div className="absolute inset-[35%] rounded-full border-2 border-accent/50 bg-accent/10 circle-inner shadow-glow-accent" />
            
            {/* Center point - YOU */}
            <div className="absolute inset-[45%] rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-xs font-bold shadow-xl">
              YOU
            </div>

            {/* Participants */}
            {renderCircle('outer', outerCircle, 45)}
            {renderCircle('middle', middleCircle, 32)}
            {renderCircle('inner', innerCircle, 20)}
          </div>
        </div>
      </div>

      {selectedParticipant && (
        <ParticipantPreviewModal
          participant={selectedParticipant}
          currentLevel={getParticipantLevel(selectedParticipant.id)}
          onPromote={(level) => handlePromote(selectedParticipant.id, level)}
          onClose={() => setSelectedParticipant(null)}
          eventId={eventId}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
