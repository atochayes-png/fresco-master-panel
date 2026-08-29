CREATE TABLE public.negocio_experiencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  categoria text,
  precio numeric,
  precio_tipo text NOT NULL DEFAULT 'consultar',
  duracion text,
  punto_salida text,
  salida_latitud double precision,
  salida_longitud double precision,
  horarios text[] NOT NULL DEFAULT '{}',
  capacidad integer,
  extras jsonb NOT NULL DEFAULT '[]'::jsonb,
  requiere_anticipo boolean NOT NULL DEFAULT false,
  activa boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  foto_portada text,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX negocio_experiencias_negocio_idx ON public.negocio_experiencias(negocio_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.negocio_experiencias TO authenticated;
GRANT ALL ON public.negocio_experiencias TO service_role;
ALTER TABLE public.negocio_experiencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "experiencias visibles" ON public.negocio_experiencias FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "experiencias insertan" ON public.negocio_experiencias FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "experiencias editan" ON public.negocio_experiencias FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()))
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "experiencias borran" ON public.negocio_experiencias FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE TRIGGER negocio_experiencias_tocar BEFORE UPDATE ON public.negocio_experiencias
FOR EACH ROW EXECUTE FUNCTION public.tocar_actualizado_en();

CREATE TABLE public.experiencia_medios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiencia_id uuid NOT NULL REFERENCES public.negocio_experiencias(id) ON DELETE CASCADE,
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'image',
  public_id text NOT NULL,
  secure_url text NOT NULL,
  resource_type text NOT NULL DEFAULT 'image',
  orden integer NOT NULL DEFAULT 0,
  es_portada boolean NOT NULL DEFAULT false,
  duration numeric,
  format text,
  bytes bigint,
  creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX experiencia_medios_exp_idx ON public.experiencia_medios(experiencia_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experiencia_medios TO authenticated;
GRANT ALL ON public.experiencia_medios TO service_role;
ALTER TABLE public.experiencia_medios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exp medios visibles" ON public.experiencia_medios FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "exp medios insertan" ON public.experiencia_medios FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "exp medios editan" ON public.experiencia_medios FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()))
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "exp medios borran" ON public.experiencia_medios FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));

CREATE SEQUENCE IF NOT EXISTS public.reservaciones_folio_seq;
CREATE TABLE public.reservaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio text NOT NULL UNIQUE DEFAULT ('TFY-R-' || lpad(nextval('public.reservaciones_folio_seq')::text, 6, '0')),
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  experiencia_id uuid REFERENCES public.negocio_experiencias(id) ON DELETE SET NULL,
  experiencia_nombre text NOT NULL,
  fecha_solicitada date,
  horario text,
  personas integer NOT NULL DEFAULT 1,
  extras jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_estimado numeric,
  cliente_nombre text NOT NULL,
  cliente_telefono text NOT NULL,
  estado text NOT NULL DEFAULT 'SOLICITUD_GENERADA',
  origen text NOT NULL DEFAULT 'tomar_el_fresco_en_yucatan',
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reservaciones_negocio_idx ON public.reservaciones(negocio_id);
GRANT SELECT ON public.reservaciones TO authenticated;
GRANT ALL ON public.reservaciones TO service_role;
ALTER TABLE public.reservaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reservaciones visibles" ON public.reservaciones FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE TRIGGER reservaciones_tocar BEFORE UPDATE ON public.reservaciones
FOR EACH ROW EXECUTE FUNCTION public.tocar_actualizado_en();