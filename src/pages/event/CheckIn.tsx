import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Upload, User, Check, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { calculateAge, getAgeBand, AGE_BAND_INFO } from '@/types/database';

export default function CheckIn() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, signUp, signIn } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<'auth' | 'profile' | 'selfie' | 'complete'>('auth');
  const [isSignUp, setIsSignUp] = useState(true);
  const [authData, setAuthData] = useState({ email: '', password: '', fullName: '' });
  const [profileData, setProfileData] = useState({ full_name: '', birthday: '' });
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    if (!authData.email || !authData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(authData.email, authData.password, authData.fullName || authData.email);
        if (error) throw error;
      } else {
        const { error } = await signIn(authData.email, authData.password);
        if (error) throw error;
      }
      setStep('profile');
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = () => {
    if (!profileData.full_name || !profileData.birthday) {
      toast.error('Please fill in your name and birthday');
      return;
    }
    setStep('selfie');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieFile(file);
      setSelfieUrl(URL.createObjectURL(file));
    }
  };

  const handleComplete = async () => {
    if (!user || !eventId) return;

    setIsLoading(true);
    try {
      let uploadedSelfieUrl = null;

      // Upload selfie if provided
      if (selfieFile) {
        const fileExt = selfieFile.name.split('.').pop();
        const fileName = `${eventId}/${user.id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, selfieFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        uploadedSelfieUrl = publicUrl;
      }

      // Calculate age and age band
      const age = calculateAge(profileData.birthday);
      const ageBand = getAgeBand(age);

      // Get a random physical table for this event
      const { data: tables } = await supabase
        .from('physical_tables')
        .select('id, number_of_seats')
        .eq('event_id', eventId);

      let physicalTableId = null;
      let physicalSeatNumber = null;

      if (tables && tables.length > 0) {
        const randomTable = tables[Math.floor(Math.random() * tables.length)];
        physicalTableId = randomTable.id;
        physicalSeatNumber = Math.floor(Math.random() * (randomTable.number_of_seats || 8)) + 1;
      }

      // Create participant profile
      const { error: profileError } = await supabase
        .from('participant_profiles')
        .insert({
          user_id: user.id,
          event_id: eventId,
          full_name: profileData.full_name,
          birthday: profileData.birthday,
          age,
          age_band: ageBand,
          selfie_url: uploadedSelfieUrl,
          circle_level: 'outer',
          physical_table_id: physicalTableId,
          physical_seat_number: physicalSeatNumber,
          checked_in_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      setStep('complete');
      toast.success('Welcome to the event!');
      
      // Navigate to event page after short delay
      setTimeout(() => {
        navigate(`/event/${eventId}`);
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete check-in');
    } finally {
      setIsLoading(false);
    }
  };

  const age = profileData.birthday ? calculateAge(profileData.birthday) : null;
  const ageBand = age ? getAgeBand(age) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        {step === 'auth' && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome to Inner Circle</CardTitle>
              <CardDescription>
                {isSignUp ? 'Create an account to check in' : 'Sign in to continue'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={authData.email}
                  onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={authData.password}
                  onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              {isSignUp && (
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={authData.fullName}
                    onChange={(e) => setAuthData({ ...authData, fullName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
              )}
              <Button onClick={handleAuth} className="w-full" disabled={isLoading}>
                {isLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary underline">
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </p>
            </CardContent>
          </>
        )}

        {step === 'profile' && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <User className="h-6 w-6 text-primary" />
                Your Profile
              </CardTitle>
              <CardDescription>Tell us about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="birthday">Birthday</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={profileData.birthday}
                  onChange={(e) => setProfileData({ ...profileData, birthday: e.target.value })}
                />
              </div>
              {ageBand && (
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-1">Your Age Band</p>
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${AGE_BAND_INFO[ageBand].color}`} />
                    <span className="font-semibold">{AGE_BAND_INFO[ageBand].label}</span>
                  </div>
                </div>
              )}
              <Button onClick={handleProfileSubmit} className="w-full">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </>
        )}

        {step === 'selfie' && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Camera className="h-6 w-6 text-primary" />
                Add a Photo
              </CardTitle>
              <CardDescription>Help others recognize you at the event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="aspect-square bg-muted rounded-xl flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-border hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {selfieUrl ? (
                  <img src={selfieUrl} alt="Selfie preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-8">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Click to upload a photo</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleComplete()} className="flex-1" disabled={isLoading}>
                  Skip for now
                </Button>
                <Button onClick={handleComplete} className="flex-1" disabled={isLoading || !selfieUrl}>
                  {isLoading ? 'Saving...' : 'Complete'} <Check className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 'complete' && (
          <>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle className="text-2xl">You're In!</CardTitle>
              <CardDescription>Welcome to the event. Redirecting you now...</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {ageBand && (
                <div className="p-4 bg-muted rounded-lg inline-flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${AGE_BAND_INFO[ageBand].color}`} />
                  <span className="font-semibold">{AGE_BAND_INFO[ageBand].label}</span>
                </div>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
