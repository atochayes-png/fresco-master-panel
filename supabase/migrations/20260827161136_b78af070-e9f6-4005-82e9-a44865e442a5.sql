CREATE TYPE public.app_role AS ENUM ('master','negocio');
CREATE TYPE public.negocio_estatus AS ENUM ('activo','suspendido');
CREATE TYPE public.negocio_config AS ENUM ('perfil_incompleto','perfil_completo');

CREATE TABLE public.perfiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  usuario text NOT NULL UNIQUE,
  creado_en timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.perfiles TO authenticated;
GRANT ALL ON public.perfiles TO service_role;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.negocios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre_negocio text NOT NULL,
  nombre_dueno text NOT NULL,
  celular text NOT NULL,
  tipo text NOT NULL,
  municipio text NOT NULL,
  usuario text NOT NULL,
  plan_tipo text NOT NULL DEFAULT 'prueba_gratis',
  fecha_inicio date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Merida')::date,
  fecha_fin date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Merida')::date + 30),
  estatus public.negocio_estatus NOT NULL DEFAULT 'activo',
  estado_configuracion public.negocio_config NOT NULL DEFAULT 'perfil_incompleto',
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.negocios TO authenticated;
GRANT ALL ON public.negocios TO service_role;
ALTER TABLE public.negocios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "master ve todos los perfiles" ON public.perfiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'master') OR id = auth.uid());
CREATE POLICY "master edita perfiles" ON public.perfiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'master')) WITH CHECK (public.has_role(auth.uid(),'master'));

CREATE POLICY "roles propios o master" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'master'));

CREATE POLICY "negocios visibles" ON public.negocios FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'master') OR owner_id = auth.uid());
CREATE POLICY "master crea negocios" ON public.negocios FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'master'));
CREATE POLICY "master edita negocios" ON public.negocios FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'master')) WITH CHECK (public.has_role(auth.uid(),'master'));

CREATE OR REPLACE FUNCTION public.tocar_actualizado_en() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.actualizado_en = now(); RETURN NEW; END; $$;
CREATE TRIGGER negocios_actualizado_en BEFORE UPDATE ON public.negocios
  FOR EACH ROW EXECUTE FUNCTION public.tocar_actualizado_en();

CREATE INDEX negocios_owner_idx ON public.negocios(owner_id);
CREATE UNIQUE INDEX negocios_usuario_idx ON public.negocios(lower(usuario));