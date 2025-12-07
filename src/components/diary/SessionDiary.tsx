import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { DiaryEntry } from '@/types/database';

interface SessionDiaryProps {
  eventId: string;
}

export function SessionDiary({ eventId }: SessionDiaryProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (user) loadEntries();
  }, [user, eventId]);

  const loadEntries = async () => {
    const { data } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', user?.id)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (data) setEntries(data as DiaryEntry[]);
  };

  const handleAdd = async () => {
    if (!newEntry.trim() || !user) return;

    const { error } = await supabase
      .from('diary_entries')
      .insert({
        user_id: user.id,
        event_id: eventId,
        content: newEntry,
      });

    if (error) {
      toast.error('Failed to save entry');
    } else {
      toast.success('Entry saved');
      setNewEntry('');
      setIsAdding(false);
      loadEntries();
    }
  };

  const handleDelete = async (entryId: string) => {
    if (confirm('Delete this diary entry?')) {
      await supabase
        .from('diary_entries')
        .delete()
        .eq('id', entryId);

      toast.success('Entry deleted');
      loadEntries();
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Session Diary
        </h2>
        {!isAdding && (
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Entry
          </Button>
        )}
      </div>

      {isAdding && (
        <Card>
          <CardContent className="pt-4">
            <Textarea
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              placeholder="What's on your mind? Capture your thoughts, observations, or memorable moments..."
              rows={4}
              autoFocus
            />
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={!newEntry.trim()}>
                <Save className="h-4 w-4 mr-1" /> Save Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {entries.length === 0 && !isAdding && (
        <Card className="py-12">
          <CardContent className="text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No diary entries yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Capture your thoughts and memorable moments from this event.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {entries.map(entry => (
          <Card key={entry.id} className="group">
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                {format(new Date(entry.created_at), 'PPP p')}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                onClick={() => handleDelete(entry.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{entry.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
