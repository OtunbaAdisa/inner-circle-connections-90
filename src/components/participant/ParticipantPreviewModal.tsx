import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowUp, ArrowDown, StickyNote, User } from 'lucide-react';
import { toast } from 'sonner';
import type { ParticipantProfile, CircleLevel } from '@/types/database';

interface ParticipantPreviewModalProps {
  participant: ParticipantProfile;
  currentLevel: CircleLevel;
  onPromote: (level: CircleLevel) => void;
  onClose: () => void;
  eventId: string;
  currentUserId: string;
}

const CIRCLE_ORDER: CircleLevel[] = ['outer', 'middle', 'inner'];

export function ParticipantPreviewModal({
  participant,
  currentLevel,
  onPromote,
  onClose,
  eventId,
  currentUserId,
}: ParticipantPreviewModalProps) {
  const [note, setNote] = useState('');
  const [existingNote, setExistingNote] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    loadNote();
  }, [participant.id]);

  const loadNote = async () => {
    const { data } = await supabase
      .from('participant_notes')
      .select('note')
      .eq('author_id', currentUserId)
      .eq('target_participant_id', participant.id)
      .eq('event_id', eventId)
      .single();

    if (data) {
      setExistingNote(data.note);
      setNote(data.note);
    }
  };

  const saveNote = async () => {
    if (existingNote !== null) {
      await supabase
        .from('participant_notes')
        .update({ note })
        .eq('author_id', currentUserId)
        .eq('target_participant_id', participant.id)
        .eq('event_id', eventId);
    } else {
      await supabase
        .from('participant_notes')
        .insert({
          author_id: currentUserId,
          target_participant_id: participant.id,
          event_id: eventId,
          note,
        });
    }
    toast.success('Note saved');
    setExistingNote(note);
    setShowNotes(false);
  };

  const currentIndex = CIRCLE_ORDER.indexOf(currentLevel);
  const canPromote = currentIndex < CIRCLE_ORDER.length - 1;
  const canDemote = currentIndex > 0;

  const handlePromote = () => {
    if (canPromote) {
      onPromote(CIRCLE_ORDER[currentIndex + 1]);
      toast.success(`Moved to ${CIRCLE_ORDER[currentIndex + 1]} circle`);
    }
  };

  const handleDemote = () => {
    if (canDemote) {
      onPromote(CIRCLE_ORDER[currentIndex - 1]);
      toast.success(`Moved to ${CIRCLE_ORDER[currentIndex - 1]} circle`);
    }
  };

  const getLevelColor = (level: CircleLevel) => {
    switch (level) {
      case 'inner': return 'text-accent';
      case 'middle': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Participant
          </DialogTitle>
        </DialogHeader>

        <div className="text-center py-4">
          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-border mb-4">
            {participant.selfie_url ? (
              <img 
                src={participant.selfie_url} 
                alt={participant.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                {participant.full_name.charAt(0)}
              </div>
            )}
          </div>
          
          <h3 className="text-xl font-semibold">{participant.full_name}</h3>
          
          <p className={`text-sm mt-1 capitalize ${getLevelColor(currentLevel)}`}>
            {currentLevel} Circle
          </p>
        </div>

        {!showNotes ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button 
                onClick={handlePromote} 
                disabled={!canPromote}
                className="flex-1"
                variant={currentLevel === 'middle' ? 'default' : 'outline'}
              >
                <ArrowUp className="h-4 w-4 mr-2" />
                {currentLevel === 'outer' ? 'Move to Middle' : 'Move to Inner'}
              </Button>
              <Button 
                onClick={handleDemote} 
                disabled={!canDemote}
                variant="outline"
                className="flex-1"
              >
                <ArrowDown className="h-4 w-4 mr-2" />
                Demote
              </Button>
            </div>

            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => setShowNotes(true)}
            >
              <StickyNote className="h-4 w-4 mr-2" />
              {existingNote ? 'Edit Note' : 'Add Note'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label>Your Private Note</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write a note about this participant..."
                className="mt-2"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowNotes(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={saveNote} className="flex-1">
                Save Note
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
