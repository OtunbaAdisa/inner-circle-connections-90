import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEvents } from '@/hooks/useEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, Image, Check } from 'lucide-react';
import { toast } from 'sonner';
import { AGE_BAND_INFO, type AgeBand } from '@/types/database';

interface AgeBandLogo {
  id: string;
  event_id: string;
  band_name: AgeBand;
  logo_url: string;
}

export default function LogoManagement() {
  const navigate = useNavigate();
  const { data: events } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [logos, setLogos] = useState<AgeBandLogo[]>([]);
  const [uploading, setUploading] = useState<AgeBand | null>(null);

  useEffect(() => {
    if (selectedEvent) fetchLogos();
  }, [selectedEvent]);

  const fetchLogos = async () => {
    const { data, error } = await supabase
      .from('age_band_logos')
      .select('*')
      .eq('event_id', selectedEvent);
    
    if (!error && data) {
      setLogos(data as AgeBandLogo[]);
    }
  };

  const handleUpload = async (band: AgeBand, file: File) => {
    if (!selectedEvent) {
      toast.error('Please select an event first');
      return;
    }

    setUploading(band);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedEvent}/${band}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      // Check if logo exists for this band
      const existingLogo = logos.find(l => l.band_name === band);
      
      if (existingLogo) {
        await supabase
          .from('age_band_logos')
          .update({ logo_url: publicUrl })
          .eq('id', existingLogo.id);
      } else {
        await supabase
          .from('age_band_logos')
          .insert({
            event_id: selectedEvent,
            band_name: band,
            logo_url: publicUrl,
          });
      }

      toast.success(`${AGE_BAND_INFO[band].label} logo uploaded`);
      fetchLogos();
    } catch (error) {
      toast.error('Failed to upload logo');
    } finally {
      setUploading(null);
    }
  };

  const getLogoForBand = (band: AgeBand) => {
    return logos.find(l => l.band_name === band)?.logo_url;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Age Band Logos</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Label>Select Event</Label>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-full md:w-80 mt-2">
              <SelectValue placeholder="Choose an event" />
            </SelectTrigger>
            <SelectContent>
              {events?.map(event => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selectedEvent ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select an event to manage age band logos</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(Object.keys(AGE_BAND_INFO) as AgeBand[]).map(band => {
              const info = AGE_BAND_INFO[band];
              const logoUrl = getLogoForBand(band);
              
              return (
                <Card key={band} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${info.color}`} />
                        {info.label}
                      </span>
                      <span className="text-sm font-normal text-muted-foreground">
                        Ages {info.range}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                      {logoUrl ? (
                        <img src={logoUrl} alt={info.label} className="w-full h-full object-contain" />
                      ) : (
                        <Image className="h-16 w-16 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(band, file);
                        }}
                        disabled={uploading === band}
                      />
                      <Button 
                        variant={logoUrl ? "outline" : "default"} 
                        className="w-full"
                        disabled={uploading === band}
                      >
                        {uploading === band ? (
                          'Uploading...'
                        ) : logoUrl ? (
                          <>
                            <Check className="h-4 w-4 mr-2" /> Replace Logo
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" /> Upload Logo
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
