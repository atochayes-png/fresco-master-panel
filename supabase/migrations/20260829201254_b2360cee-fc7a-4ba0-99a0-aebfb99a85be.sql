ALTER TABLE public.negocio_perfil
  ADD COLUMN IF NOT EXISTS usa_calendario boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS checkin text,
  ADD COLUMN IF NOT EXISTS checkout text,
  ADD COLUMN IF NOT EXISTS acepta_mascotas boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS acepta_ninos boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS requiere_anticipo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notas_hospedaje text;

CREATE TABLE public.negocio_alojamientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo text NOT NULL DEFAULT 'habitacion',
  descripcion text,
  capacidad integer NOT NULL DEFAULT 2,
  camas integer,
  tipo_camas text,
  precio numeric,
  precio_tipo text NOT NULL DEFAULT 'noche',
  servicios text[] NOT NULL DEFAULT '{}',
  unidades integer NOT NULL DEFAULT 1,
  activo boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX negocio_alojamientos_negocio_idx ON public.negocio_alojamientos(negocio_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.negocio_alojamientos TO authenticated;
GRANT ALL ON public.negocio_alojamientos TO service_role;
ALTER TABLE public.negocio_alojamientos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alojamientos visibles" ON public.negocio_alojamientos FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "alojamientos insertan" ON public.negocio_alojamientos FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "alojamientos editan" ON public.negocio_alojamientos FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()))
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "alojamientos borran" ON public.negocio_alojamientos FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE TRIGGER negocio_alojamientos_tocar BEFORE UPDATE ON public.negocio_alojamientos
FOR EACH ROW EXECUTE FUNCTION public.tocar_actualizado_en();

CREATE TABLE public.alojamiento_medios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alojamiento_id uuid NOT NULL REFERENCES public.negocio_alojamientos(id) ON DELETE CASCADE,
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
CREATE INDEX alojamiento_medios_aloj_idx ON public.alojamiento_medios(alojamiento_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alojamiento_medios TO authenticated;
GRANT ALL ON public.alojamiento_medios TO service_role;
ALTER TABLE public.alojamiento_medios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aloj medios visibles" ON public.alojamiento_medios FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "aloj medios insertan" ON public.alojamiento_medios FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "aloj medios editan" ON public.alojamiento_medios FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()))
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "aloj medios borran" ON public.alojamiento_medios FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));

CREATE TABLE public.alojamiento_bloqueos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alojamiento_id uuid NOT NULL REFERENCES public.negocio_alojamientos(id) ON DELETE CASCADE,
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  unidades integer NOT NULL DEFAULT 1,
  creado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (alojamiento_id, fecha)
);
CREATE INDEX alojamiento_bloqueos_fecha_idx ON public.alojamiento_bloqueos(alojamiento_id, fecha);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alojamiento_bloqueos TO authenticated;
GRANT ALL ON public.alojamiento_bloqueos TO service_role;
ALTER TABLE public.alojamiento_bloqueos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bloqueos visibles" ON public.alojamiento_bloqueos FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "bloqueos insertan" ON public.alojamiento_bloqueos FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "bloqueos editan" ON public.alojamiento_bloqueos FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()))
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "bloqueos borran" ON public.alojamiento_bloqueos FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));

CREATE SEQUENCE IF NOT EXISTS public.solicitudes_hospedaje_folio_seq;
CREATE TABLE public.solicitudes_hospedaje (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio text NOT NULL UNIQUE DEFAULT ('TFY-H-' || lpad(nextval('public.solicitudes_hospedaje_folio_seq')::text, 6, '0')),
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  alojamiento_id uuid REFERENCES public.negocio_alojamientos(id) ON DELETE SET NULL,
  alojamiento_nombre text NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  noches integer NOT NULL DEFAULT 1,
  huespedes integer NOT NULL DEFAULT 1,
  precio_referencia numeric,
  total_estimado numeric,
  cliente_nombre text NOT NULL,
  cliente_telefono text NOT NULL,
  modo_disponibilidad text NOT NULL DEFAULT 'sin_calendario',
  estado text NOT NULL DEFAULT 'SOLICITUD_GENERADA',
  origen text NOT NULL DEFAULT 'tomar_el_fresco_en_yucatan',
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX solicitudes_hospedaje_negocio_idx ON public.solicitudes_hospedaje(negocio_id);
GRANT SELECT ON public.solicitudes_hospedaje TO authenticated;
GRANT ALL ON public.solicitudes_hospedaje TO service_role;
ALTER TABLE public.solicitudes_hospedaje ENABLE ROW LEVEL SECURITY;
CREATE POLICY "solicitudes hospedaje visibles" ON public.solicitudes_hospedaje FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE TRIGGER solicitudes_hospedaje_tocar BEFORE UPDATE ON public.solicitudes_hospedaje
FOR EACH ROW EXECUTE FUNCTION public.tocar_actualizado_en();