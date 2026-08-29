ALTER TABLE public.negocio_perfil
  ADD COLUMN IF NOT EXISTS renta_usa_calendario boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS renta_edad_minima integer,
  ADD COLUMN IF NOT EXISTS renta_licencia boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS renta_identificacion boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS renta_deposito boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS renta_tarjeta text NOT NULL DEFAULT 'no',
  ADD COLUMN IF NOT EXISTS renta_requisitos_notas text,
  ADD COLUMN IF NOT EXISTS renta_entrega_opciones text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS renta_entrega_costo_tipo text NOT NULL DEFAULT 'sin_costo',
  ADD COLUMN IF NOT EXISTS renta_entrega_costo numeric,
  ADD COLUMN IF NOT EXISTS renta_notas text;

CREATE TABLE public.negocio_vehiculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  modelo_referencia text,
  descripcion text,
  pasajeros integer NOT NULL DEFAULT 5,
  transmision text NOT NULL DEFAULT 'automatica',
  aire_acondicionado boolean NOT NULL DEFAULT true,
  equipaje text,
  precio numeric,
  precio_tipo text NOT NULL DEFAULT 'dia',
  unidades integer NOT NULL DEFAULT 1,
  activo boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX negocio_vehiculos_negocio_idx ON public.negocio_vehiculos(negocio_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.negocio_vehiculos TO authenticated;
GRANT ALL ON public.negocio_vehiculos TO service_role;
ALTER TABLE public.negocio_vehiculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehiculos visibles" ON public.negocio_vehiculos FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "vehiculos insertan" ON public.negocio_vehiculos FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "vehiculos editan" ON public.negocio_vehiculos FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()))
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "vehiculos borran" ON public.negocio_vehiculos FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE TRIGGER negocio_vehiculos_tocar BEFORE UPDATE ON public.negocio_vehiculos
FOR EACH ROW EXECUTE FUNCTION public.tocar_actualizado_en();

CREATE TABLE public.vehiculo_medios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehiculo_id uuid NOT NULL REFERENCES public.negocio_vehiculos(id) ON DELETE CASCADE,
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
CREATE INDEX vehiculo_medios_vehiculo_idx ON public.vehiculo_medios(vehiculo_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehiculo_medios TO authenticated;
GRANT ALL ON public.vehiculo_medios TO service_role;
ALTER TABLE public.vehiculo_medios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehiculo medios visibles" ON public.vehiculo_medios FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "vehiculo medios insertan" ON public.vehiculo_medios FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "vehiculo medios editan" ON public.vehiculo_medios FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()))
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "vehiculo medios borran" ON public.vehiculo_medios FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));

CREATE TABLE public.vehiculo_bloqueos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehiculo_id uuid NOT NULL REFERENCES public.negocio_vehiculos(id) ON DELETE CASCADE,
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  unidades integer NOT NULL DEFAULT 1,
  creado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vehiculo_id, fecha)
);
CREATE INDEX vehiculo_bloqueos_fecha_idx ON public.vehiculo_bloqueos(vehiculo_id, fecha);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehiculo_bloqueos TO authenticated;
GRANT ALL ON public.vehiculo_bloqueos TO service_role;
ALTER TABLE public.vehiculo_bloqueos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehiculo bloqueos visibles" ON public.vehiculo_bloqueos FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "vehiculo bloqueos insertan" ON public.vehiculo_bloqueos FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "vehiculo bloqueos editan" ON public.vehiculo_bloqueos FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()))
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "vehiculo bloqueos borran" ON public.vehiculo_bloqueos FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));

CREATE SEQUENCE IF NOT EXISTS public.solicitudes_renta_folio_seq;
CREATE TABLE public.solicitudes_renta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio text NOT NULL UNIQUE DEFAULT ('TFY-A-' || lpad(nextval('public.solicitudes_renta_folio_seq')::text, 6, '0')),
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  vehiculo_id uuid REFERENCES public.negocio_vehiculos(id) ON DELETE SET NULL,
  vehiculo_nombre text NOT NULL,
  fecha_inicio date NOT NULL,
  hora_inicio text NOT NULL DEFAULT '10:00',
  fecha_fin date NOT NULL,
  hora_fin text NOT NULL DEFAULT '10:00',
  dias integer NOT NULL DEFAULT 1,
  pasajeros integer,
  lugar_entrega text NOT NULL DEFAULT 'sucursal',
  precio_referencia numeric,
  costo_entrega numeric,
  total_estimado numeric,
  cliente_nombre text NOT NULL,
  cliente_telefono text NOT NULL,
  modo_disponibilidad text NOT NULL DEFAULT 'sin_calendario',
  estado text NOT NULL DEFAULT 'SOLICITUD_GENERADA',
  origen text NOT NULL DEFAULT 'tomar_el_fresco_en_yucatan',
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX solicitudes_renta_negocio_idx ON public.solicitudes_renta(negocio_id);
GRANT SELECT ON public.solicitudes_renta TO authenticated;
GRANT ALL ON public.solicitudes_renta TO service_role;
ALTER TABLE public.solicitudes_renta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "solicitudes renta visibles" ON public.solicitudes_renta FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE TRIGGER solicitudes_renta_tocar BEFORE UPDATE ON public.solicitudes_renta
FOR EACH ROW EXECUTE FUNCTION public.tocar_actualizado_en();