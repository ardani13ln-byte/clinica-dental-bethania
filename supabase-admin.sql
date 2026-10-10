-- Modulo admin en PRODUCCION (extraido 2026-10-10, regenerado).
-- Orden: funciones -> tablas/politicas -> trigger. Sin lineas psql.

CREATE OR REPLACE FUNCTION public.get_user_modules(uid uuid DEFAULT auth.uid())
 RETURNS TABLE(key text, name text, icon text, enabled boolean, sort_order integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET row_security TO 'off'
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;
  IF uid IS DISTINCT FROM auth.uid() THEN
    PERFORM 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin') AND COALESCE(active, true);
    IF NOT FOUND THEN
      uid := auth.uid();
    END IF;
  END IF;
  RETURN QUERY
    SELECT m.key, m.name, m.icon,
      COALESCE(um.enabled, true) AS enabled,
      m.sort_order
    FROM public.modules m
    LEFT JOIN public.user_modules um ON um.module_key = m.key AND um.user_id = uid
    ORDER BY m.sort_order;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET row_security TO 'off'
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, role, active)
  VALUES (NEW.id, NEW.email, 'user', false);
  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.is_active_staff(uid uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET row_security TO 'off'
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND COALESCE(active, false) AND role <> 'user'
  );
$function$
;
CREATE OR REPLACE FUNCTION public.is_admin_or_above(uid uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET row_security TO 'off'
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND COALESCE(active, false) AND role IN ('admin', 'superadmin')
  );
$function$
;
CREATE OR REPLACE FUNCTION public.is_superadmin(uid uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET row_security TO 'off'
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = uid AND role = 'superadmin' AND active = true
  );
$function$
;

-- Dispara perfil inactivo al registrarse (un superadmin lo activa y asigna rol).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modules (
    id integer NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    enabled boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: modules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.modules_id_seq OWNED BY public.modules.id;


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    full_name text,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['superadmin'::text, 'admin'::text, 'dentist'::text, 'hygienist'::text, 'assistant'::text, 'receptionist'::text, 'user'::text])))
);


--
-- Name: system_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_logs (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    level text DEFAULT 'info'::text NOT NULL,
    category text DEFAULT 'system'::text NOT NULL,
    message text NOT NULL,
    user_email text,
    user_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT system_logs_level_check CHECK ((level = ANY (ARRAY['info'::text, 'warning'::text, 'error'::text, 'critical'::text])))
);


--
-- Name: system_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_logs_id_seq OWNED BY public.system_logs.id;


--
-- Name: user_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_modules (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    module_key text NOT NULL,
    enabled boolean DEFAULT true
);


--
-- Name: user_modules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_modules_id_seq OWNED BY public.user_modules.id;


--
-- Name: modules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules ALTER COLUMN id SET DEFAULT nextval('public.modules_id_seq'::regclass);


--
-- Name: system_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_logs ALTER COLUMN id SET DEFAULT nextval('public.system_logs_id_seq'::regclass);


--
-- Name: user_modules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_modules ALTER COLUMN id SET DEFAULT nextval('public.user_modules_id_seq'::regclass);


--
-- Name: modules modules_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_key_key UNIQUE (key);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: system_logs system_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_pkey PRIMARY KEY (id);


--
-- Name: user_modules user_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_modules
    ADD CONSTRAINT user_modules_pkey PRIMARY KEY (id);


--
-- Name: user_modules user_modules_user_id_module_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_modules
    ADD CONSTRAINT user_modules_user_id_module_key_key UNIQUE (user_id, module_key);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_modules user_modules_module_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_modules
    ADD CONSTRAINT user_modules_module_key_fkey FOREIGN KEY (module_key) REFERENCES public.modules(key);


--
-- Name: user_modules user_modules_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_modules
    ADD CONSTRAINT user_modules_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: system_logs logs_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY logs_delete ON public.system_logs FOR DELETE TO authenticated USING (public.is_admin_or_above());


--
-- Name: system_logs logs_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY logs_insert ON public.system_logs FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_above());


--
-- Name: system_logs logs_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY logs_read ON public.system_logs FOR SELECT TO authenticated USING (public.is_admin_or_above());


--
-- Name: modules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

--
-- Name: modules modules_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY modules_read ON public.modules FOR SELECT TO authenticated USING (true);


--
-- Name: modules modules_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY modules_write ON public.modules TO authenticated USING (public.is_admin_or_above()) WITH CHECK (public.is_admin_or_above());


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_read ON public.profiles FOR SELECT TO authenticated USING (((auth.uid() = id) OR public.is_superadmin()));


--
-- Name: profiles profiles_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_write ON public.profiles TO authenticated USING (public.is_admin_or_above()) WITH CHECK (public.is_admin_or_above());


--
-- Name: system_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: user_modules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;

--
-- Name: user_modules user_modules_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_modules_read ON public.user_modules FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR public.is_superadmin()));


--
-- Name: user_modules user_modules_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_modules_write ON public.user_modules TO authenticated USING (public.is_admin_or_above()) WITH CHECK (public.is_admin_or_above());


--
-- PostgreSQL database dump complete
--


