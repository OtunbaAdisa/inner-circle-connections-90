
-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'participant');

-- Create enum for age bands
CREATE TYPE public.age_band AS ENUM ('trailblazers', 'creatives', 'luminaries', 'pillars', 'icons');

-- Create enum for circle levels
CREATE TYPE public.circle_level AS ENUM ('outer', 'middle', 'inner');

-- Create enum for connection status
CREATE TYPE public.connection_status AS ENUM ('pending', 'accepted', 'rejected');

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'participant',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    force_password_change BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Events table
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    qr_code_url TEXT,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Age band logos table
CREATE TABLE public.age_band_logos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    band_name age_band NOT NULL,
    logo_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (event_id, band_name)
);

-- Physical tables
CREATE TABLE public.physical_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    table_name TEXT NOT NULL,
    number_of_seats INTEGER DEFAULT 8,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Participant profiles (event-specific)
CREATE TABLE public.participant_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    birthday DATE NOT NULL,
    age INTEGER NOT NULL,
    age_band age_band NOT NULL,
    selfie_url TEXT,
    virtual_seat_index INTEGER,
    circle_level circle_level DEFAULT 'outer',
    physical_table_id UUID REFERENCES public.physical_tables(id) ON DELETE SET NULL,
    physical_seat_number INTEGER,
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, event_id)
);

-- Circle promotions (personal view)
CREATE TABLE public.circle_promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    target_participant_id UUID REFERENCES public.participant_profiles(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    promoted_to circle_level NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (promoter_id, target_participant_id, event_id)
);

-- Connection requests
CREATE TABLE public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    target_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    status connection_status DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (requester_id, target_id, event_id)
);

-- Diary entries
CREATE TABLE public.diary_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Participant notes (private notes about other participants)
CREATE TABLE public.participant_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    target_participant_id UUID REFERENCES public.participant_profiles(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (author_id, target_participant_id, event_id)
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.age_band_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_notes ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Function to check if user is admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role IN ('admin', 'super_admin')
    )
$$;

-- Function to calculate age from birthday
CREATE OR REPLACE FUNCTION public.calculate_age(birthday DATE)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT EXTRACT(YEAR FROM age(CURRENT_DATE, birthday))::INTEGER
$$;

-- Function to determine age band
CREATE OR REPLACE FUNCTION public.get_age_band(age_value INTEGER)
RETURNS age_band
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE
        WHEN age_value BETWEEN 13 AND 24 THEN 'trailblazers'::age_band
        WHEN age_value BETWEEN 25 AND 40 THEN 'creatives'::age_band
        WHEN age_value BETWEEN 41 AND 55 THEN 'luminaries'::age_band
        WHEN age_value BETWEEN 56 AND 65 THEN 'pillars'::age_band
        ELSE 'icons'::age_band
    END
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$;

-- Trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_participant_profiles_updated_at BEFORE UPDATE ON public.participant_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_circle_promotions_updated_at BEFORE UPDATE ON public.circle_promotions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON public.connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_diary_entries_updated_at BEFORE UPDATE ON public.diary_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_participant_notes_updated_at BEFORE UPDATE ON public.participant_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));

-- Events policies
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can create events" ON public.events FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update events" ON public.events FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE USING (public.is_admin(auth.uid()));

-- Age band logos policies
CREATE POLICY "Anyone can view logos" ON public.age_band_logos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage logos" ON public.age_band_logos FOR ALL USING (public.is_admin(auth.uid()));

-- Physical tables policies
CREATE POLICY "Anyone can view tables" ON public.physical_tables FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage tables" ON public.physical_tables FOR ALL USING (public.is_admin(auth.uid()));

-- Participant profiles policies
CREATE POLICY "Participants can view participants in same event" ON public.participant_profiles FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.participant_profiles pp
        WHERE pp.user_id = auth.uid() AND pp.event_id = participant_profiles.event_id
    ) OR public.is_admin(auth.uid())
);
CREATE POLICY "Users can create their own participant profile" ON public.participant_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own participant profile" ON public.participant_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage participant profiles" ON public.participant_profiles FOR ALL USING (public.is_admin(auth.uid()));

-- Circle promotions policies (private to promoter)
CREATE POLICY "Users can view their own promotions" ON public.circle_promotions FOR SELECT USING (auth.uid() = promoter_id);
CREATE POLICY "Users can create their own promotions" ON public.circle_promotions FOR INSERT WITH CHECK (auth.uid() = promoter_id);
CREATE POLICY "Users can update their own promotions" ON public.circle_promotions FOR UPDATE USING (auth.uid() = promoter_id);
CREATE POLICY "Users can delete their own promotions" ON public.circle_promotions FOR DELETE USING (auth.uid() = promoter_id);

-- Connections policies
CREATE POLICY "Users can view their connections" ON public.connections FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = target_id);
CREATE POLICY "Users can create connections" ON public.connections FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update connections they're part of" ON public.connections FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- Diary entries policies (private)
CREATE POLICY "Users can manage their own diary" ON public.diary_entries FOR ALL USING (auth.uid() = user_id);

-- Participant notes policies (private)
CREATE POLICY "Users can manage their own notes" ON public.participant_notes FOR ALL USING (auth.uid() = author_id);

-- Create storage bucket for avatars and logos
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('qrcodes', 'qrcodes', true);

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Logo images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Admins can manage logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND public.is_admin(auth.uid()));
CREATE POLICY "Admins can update logos" ON storage.objects FOR UPDATE USING (bucket_id = 'logos' AND public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete logos" ON storage.objects FOR DELETE USING (bucket_id = 'logos' AND public.is_admin(auth.uid()));

CREATE POLICY "QR codes are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'qrcodes');
CREATE POLICY "Admins can manage QR codes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'qrcodes' AND public.is_admin(auth.uid()));
