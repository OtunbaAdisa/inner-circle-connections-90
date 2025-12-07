CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: age_band; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.age_band AS ENUM (
    'trailblazers',
    'creatives',
    'luminaries',
    'pillars',
    'icons'
);


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'super_admin',
    'admin',
    'participant'
);


--
-- Name: circle_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.circle_level AS ENUM (
    'outer',
    'middle',
    'inner'
);


--
-- Name: connection_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.connection_status AS ENUM (
    'pending',
    'accepted',
    'rejected'
);


--
-- Name: calculate_age(date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_age(birthday date) RETURNS integer
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
    SELECT EXTRACT(YEAR FROM age(CURRENT_DATE, birthday))::INTEGER
$$;


--
-- Name: get_age_band(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_age_band(age_value integer) RETURNS public.age_band
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
    SELECT CASE
        WHEN age_value BETWEEN 13 AND 24 THEN 'trailblazers'::age_band
        WHEN age_value BETWEEN 25 AND 40 THEN 'creatives'::age_band
        WHEN age_value BETWEEN 41 AND 55 THEN 'luminaries'::age_band
        WHEN age_value BETWEEN 56 AND 65 THEN 'pillars'::age_band
        ELSE 'icons'::age_band
    END
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;


--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role IN ('admin', 'super_admin')
    )
$$;


--
-- Name: is_participant_in_event(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_participant_in_event(_user_id uuid, _event_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.participant_profiles
    WHERE user_id = _user_id
      AND event_id = _event_id
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: age_band_logos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.age_band_logos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    band_name public.age_band NOT NULL,
    logo_url text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: circle_promotions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.circle_promotions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    promoter_id uuid NOT NULL,
    target_participant_id uuid NOT NULL,
    event_id uuid NOT NULL,
    promoted_to public.circle_level NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    requester_id uuid NOT NULL,
    target_id uuid NOT NULL,
    event_id uuid NOT NULL,
    status public.connection_status DEFAULT 'pending'::public.connection_status,
    message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: diary_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diary_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    event_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    event_date timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    qr_code_url text,
    status text DEFAULT 'upcoming'::text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT events_status_check CHECK ((status = ANY (ARRAY['upcoming'::text, 'active'::text, 'ended'::text])))
);


--
-- Name: participant_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.participant_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    author_id uuid NOT NULL,
    target_participant_id uuid NOT NULL,
    event_id uuid NOT NULL,
    note text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: participant_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.participant_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    event_id uuid NOT NULL,
    full_name text NOT NULL,
    birthday date NOT NULL,
    age integer NOT NULL,
    age_band public.age_band NOT NULL,
    selfie_url text,
    virtual_seat_index integer,
    circle_level public.circle_level DEFAULT 'outer'::public.circle_level,
    physical_table_id uuid,
    physical_seat_number integer,
    checked_in_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: physical_tables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.physical_tables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    table_name text NOT NULL,
    number_of_seats integer DEFAULT 8,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email text,
    full_name text,
    avatar_url text,
    force_password_change boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'participant'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: age_band_logos age_band_logos_event_id_band_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.age_band_logos
    ADD CONSTRAINT age_band_logos_event_id_band_name_key UNIQUE (event_id, band_name);


--
-- Name: age_band_logos age_band_logos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.age_band_logos
    ADD CONSTRAINT age_band_logos_pkey PRIMARY KEY (id);


--
-- Name: circle_promotions circle_promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.circle_promotions
    ADD CONSTRAINT circle_promotions_pkey PRIMARY KEY (id);


--
-- Name: circle_promotions circle_promotions_promoter_id_target_participant_id_event_i_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.circle_promotions
    ADD CONSTRAINT circle_promotions_promoter_id_target_participant_id_event_i_key UNIQUE (promoter_id, target_participant_id, event_id);


--
-- Name: connections connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT connections_pkey PRIMARY KEY (id);


--
-- Name: connections connections_requester_id_target_id_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT connections_requester_id_target_id_event_id_key UNIQUE (requester_id, target_id, event_id);


--
-- Name: diary_entries diary_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diary_entries
    ADD CONSTRAINT diary_entries_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: participant_notes participant_notes_author_id_target_participant_id_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_notes
    ADD CONSTRAINT participant_notes_author_id_target_participant_id_event_id_key UNIQUE (author_id, target_participant_id, event_id);


--
-- Name: participant_notes participant_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_notes
    ADD CONSTRAINT participant_notes_pkey PRIMARY KEY (id);


--
-- Name: participant_profiles participant_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_profiles
    ADD CONSTRAINT participant_profiles_pkey PRIMARY KEY (id);


--
-- Name: participant_profiles participant_profiles_user_id_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_profiles
    ADD CONSTRAINT participant_profiles_user_id_event_id_key UNIQUE (user_id, event_id);


--
-- Name: physical_tables physical_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.physical_tables
    ADD CONSTRAINT physical_tables_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: circle_promotions update_circle_promotions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_circle_promotions_updated_at BEFORE UPDATE ON public.circle_promotions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: connections update_connections_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON public.connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: diary_entries update_diary_entries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_diary_entries_updated_at BEFORE UPDATE ON public.diary_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: events update_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: participant_notes update_participant_notes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_participant_notes_updated_at BEFORE UPDATE ON public.participant_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: participant_profiles update_participant_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_participant_profiles_updated_at BEFORE UPDATE ON public.participant_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: age_band_logos age_band_logos_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.age_band_logos
    ADD CONSTRAINT age_band_logos_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: circle_promotions circle_promotions_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.circle_promotions
    ADD CONSTRAINT circle_promotions_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: circle_promotions circle_promotions_promoter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.circle_promotions
    ADD CONSTRAINT circle_promotions_promoter_id_fkey FOREIGN KEY (promoter_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: circle_promotions circle_promotions_target_participant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.circle_promotions
    ADD CONSTRAINT circle_promotions_target_participant_id_fkey FOREIGN KEY (target_participant_id) REFERENCES public.participant_profiles(id) ON DELETE CASCADE;


--
-- Name: connections connections_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT connections_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: connections connections_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT connections_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: connections connections_target_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT connections_target_id_fkey FOREIGN KEY (target_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: diary_entries diary_entries_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diary_entries
    ADD CONSTRAINT diary_entries_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: diary_entries diary_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diary_entries
    ADD CONSTRAINT diary_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: participant_notes participant_notes_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_notes
    ADD CONSTRAINT participant_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: participant_notes participant_notes_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_notes
    ADD CONSTRAINT participant_notes_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: participant_notes participant_notes_target_participant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_notes
    ADD CONSTRAINT participant_notes_target_participant_id_fkey FOREIGN KEY (target_participant_id) REFERENCES public.participant_profiles(id) ON DELETE CASCADE;


--
-- Name: participant_profiles participant_profiles_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_profiles
    ADD CONSTRAINT participant_profiles_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: participant_profiles participant_profiles_physical_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_profiles
    ADD CONSTRAINT participant_profiles_physical_table_id_fkey FOREIGN KEY (physical_table_id) REFERENCES public.physical_tables(id) ON DELETE SET NULL;


--
-- Name: participant_profiles participant_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_profiles
    ADD CONSTRAINT participant_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: physical_tables physical_tables_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.physical_tables
    ADD CONSTRAINT physical_tables_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: events Admins can create events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create events" ON public.events FOR INSERT WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: events Admins can delete events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete events" ON public.events FOR DELETE USING (public.is_admin(auth.uid()));


--
-- Name: age_band_logos Admins can manage logos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage logos" ON public.age_band_logos USING (public.is_admin(auth.uid()));


--
-- Name: participant_profiles Admins can manage participant profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage participant profiles" ON public.participant_profiles USING (public.is_admin(auth.uid()));


--
-- Name: physical_tables Admins can manage tables; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage tables" ON public.physical_tables USING (public.is_admin(auth.uid()));


--
-- Name: events Admins can update events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update events" ON public.events FOR UPDATE USING (public.is_admin(auth.uid()));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: events Anyone can view events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view events" ON public.events FOR SELECT TO authenticated USING (true);


--
-- Name: age_band_logos Anyone can view logos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view logos" ON public.age_band_logos FOR SELECT TO authenticated USING (true);


--
-- Name: physical_tables Anyone can view tables; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view tables" ON public.physical_tables FOR SELECT TO authenticated USING (true);


--
-- Name: participant_profiles Participants can view participants in same event; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Participants can view participants in same event" ON public.participant_profiles FOR SELECT USING ((public.is_participant_in_event(auth.uid(), event_id) OR public.is_admin(auth.uid())));


--
-- Name: user_roles Super admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: connections Users can create connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create connections" ON public.connections FOR INSERT WITH CHECK ((auth.uid() = requester_id));


--
-- Name: participant_profiles Users can create their own participant profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own participant profile" ON public.participant_profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: circle_promotions Users can create their own promotions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own promotions" ON public.circle_promotions FOR INSERT WITH CHECK ((auth.uid() = promoter_id));


--
-- Name: circle_promotions Users can delete their own promotions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own promotions" ON public.circle_promotions FOR DELETE USING ((auth.uid() = promoter_id));


--
-- Name: diary_entries Users can manage their own diary; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own diary" ON public.diary_entries USING ((auth.uid() = user_id));


--
-- Name: participant_notes Users can manage their own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own notes" ON public.participant_notes USING ((auth.uid() = author_id));


--
-- Name: connections Users can update connections they're part of; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update connections they're part of" ON public.connections FOR UPDATE USING (((auth.uid() = requester_id) OR (auth.uid() = target_id)));


--
-- Name: participant_profiles Users can update their own participant profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own participant profile" ON public.participant_profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: circle_promotions Users can update their own promotions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own promotions" ON public.circle_promotions FOR UPDATE USING ((auth.uid() = promoter_id));


--
-- Name: connections Users can view their connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their connections" ON public.connections FOR SELECT USING (((auth.uid() = requester_id) OR (auth.uid() = target_id)));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: circle_promotions Users can view their own promotions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own promotions" ON public.circle_promotions FOR SELECT USING ((auth.uid() = promoter_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: age_band_logos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.age_band_logos ENABLE ROW LEVEL SECURITY;

--
-- Name: circle_promotions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.circle_promotions ENABLE ROW LEVEL SECURITY;

--
-- Name: connections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

--
-- Name: diary_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

--
-- Name: participant_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.participant_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: participant_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.participant_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: physical_tables; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.physical_tables ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


