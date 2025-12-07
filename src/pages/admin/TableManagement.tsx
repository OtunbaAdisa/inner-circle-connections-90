import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Table2, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { PhysicalTable } from '@/types/database';

const TABLE_NAMES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa', 'Quebec', 'Romeo', 'Sierra', 'Tango'];

export default function TableManagement() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [tables, setTables] = useState<PhysicalTable[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAutoGenerateOpen, setIsAutoGenerateOpen] = useState(false);
  const [newTable, setNewTable] = useState({ table_name: '', number_of_seats: 8 });
  const [participantCount, setParticipantCount] = useState(100);
  const [seatsPerTable, setSeatsPerTable] = useState(8);

  useEffect(() => {
    if (eventId) fetchTables();
  }, [eventId]);

  const fetchTables = async () => {
    const { data, error } = await supabase
      .from('physical_tables')
      .select('*')
      .eq('event_id', eventId)
      .order('table_name');
    
    if (!error && data) {
      setTables(data as PhysicalTable[]);
    }
  };

  const handleCreate = async () => {
    if (!newTable.table_name || !eventId) {
      toast.error('Please enter a table name');
      return;
    }

    const { error } = await supabase
      .from('physical_tables')
      .insert({
        event_id: eventId,
        table_name: newTable.table_name,
        number_of_seats: newTable.number_of_seats,
      });

    if (error) {
      toast.error('Failed to create table');
    } else {
      toast.success('Table created');
      setIsCreateOpen(false);
      setNewTable({ table_name: '', number_of_seats: 8 });
      fetchTables();
    }
  };

  const handleAutoGenerate = async () => {
    if (!eventId) return;
    
    const tableCount = Math.ceil(participantCount / seatsPerTable);
    const tablesToCreate = TABLE_NAMES.slice(0, tableCount).map(name => ({
      event_id: eventId,
      table_name: name,
      number_of_seats: seatsPerTable,
    }));

    const { error } = await supabase
      .from('physical_tables')
      .insert(tablesToCreate);

    if (error) {
      toast.error('Failed to generate tables');
    } else {
      toast.success(`Generated ${tableCount} tables`);
      setIsAutoGenerateOpen(false);
      fetchTables();
    }
  };

  const handleDelete = async (tableId: string) => {
    if (confirm('Are you sure you want to delete this table?')) {
      const { error } = await supabase
        .from('physical_tables')
        .delete()
        .eq('id', tableId);

      if (error) {
        toast.error('Failed to delete table');
      } else {
        toast.success('Table deleted');
        fetchTables();
      }
    }
  };

  const handleDeleteAll = async () => {
    if (confirm('Are you sure you want to delete ALL tables for this event?')) {
      const { error } = await supabase
        .from('physical_tables')
        .delete()
        .eq('event_id', eventId);

      if (error) {
        toast.error('Failed to delete tables');
      } else {
        toast.success('All tables deleted');
        fetchTables();
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Table Management</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <p className="text-muted-foreground">Configure physical seating tables for your event</p>
          <div className="flex gap-2">
            <Dialog open={isAutoGenerateOpen} onOpenChange={setIsAutoGenerateOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" /> Auto-Generate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Auto-Generate Tables</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Expected Participants</Label>
                    <Input
                      type="number"
                      value={participantCount}
                      onChange={(e) => setParticipantCount(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Seats per Table</Label>
                    <Input
                      type="number"
                      value={seatsPerTable}
                      onChange={(e) => setSeatsPerTable(parseInt(e.target.value) || 8)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This will create {Math.ceil(participantCount / seatsPerTable)} tables with names: Alpha, Bravo, Charlie...
                  </p>
                  <Button onClick={handleAutoGenerate} className="w-full">Generate Tables</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Add Table
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Table</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Table Name</Label>
                    <Input
                      value={newTable.table_name}
                      onChange={(e) => setNewTable({ ...newTable, table_name: e.target.value })}
                      placeholder="e.g., Alpha, VIP, etc."
                    />
                  </div>
                  <div>
                    <Label>Number of Seats</Label>
                    <Input
                      type="number"
                      value={newTable.number_of_seats}
                      onChange={(e) => setNewTable({ ...newTable, number_of_seats: parseInt(e.target.value) || 8 })}
                    />
                  </div>
                  <Button onClick={handleCreate} className="w-full">Add Table</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {tables.length > 0 && (
          <div className="flex justify-end mb-4">
            <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
              Delete All Tables
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.length === 0 && (
            <Card className="col-span-full py-12">
              <CardContent className="text-center">
                <Table2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No tables configured. Add tables manually or auto-generate based on expected attendance.</p>
              </CardContent>
            </Card>
          )}

          {tables.map(table => (
            <Card key={table.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Table2 className="h-5 w-5 text-primary" />
                  {table.table_name}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(table.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{table.number_of_seats} seats</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
