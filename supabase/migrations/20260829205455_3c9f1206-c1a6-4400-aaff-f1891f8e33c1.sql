ALTER TABLE public.negocio_perfil
  ADD COLUMN IF NOT EXISTS divertirme_tipos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ambiente text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS restriccion_edad text NOT NULL DEFAULT 'sin_restriccion',
  ADD COLUMN IF NOT EXISTS restriccion_notas text,
  ADD COLUMN IF NOT EXISTS cover_activo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cover_tipo text NOT NULL DEFAULT 'consultar',
  ADD COLUMN IF NOT EXISTS cover_monto numeric,
  ADD COLUMN IF NOT EXISTS reserva_recomendada text NOT NULL DEFAULT 'no',
  ADD COLUMN IF NOT EXISTS horario_notas text;

CREATE TABLE public.negocio_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  fecha date,
  hora text,
  foto_url text,
  foto_public_id text,
  cover_monto numeric,
  activo boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX negocio_eventos_negocio_idx ON public.negocio_eventos(negocio_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.negocio_eventos TO authenticated;
GRANT ALL ON public.negocio_eventos TO service_role;
ALTER TABLE public.negocio_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eventos visibles" ON public.negocio_eventos FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "eventos insertan" ON public.negocio_eventos FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "eventos editan" ON public.negocio_eventos FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()))
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "eventos borran" ON public.negocio_eventos FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE TRIGGER negocio_eventos_tocar BEFORE UPDATE ON public.negocio_eventos
FOR EACH ROW EXECUTE FUNCTION public.tocar_actualizado_en();

CREATE SEQUENCE IF NOT EXISTS public.contactos_divertirme_folio_seq;
CREATE TABLE public.contactos_divertirme (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio text NOT NULL UNIQUE DEFAULT ('TFY-D-' || lpad(nextval('public.contactos_divertirme_folio_seq')::text, 6, '0')),
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  evento_id uuid REFERENCES public.negocio_eventos(id) ON DELETE SET NULL,
  fecha_visita date,
  hora_visita text,
  personas integer,
  cliente_nombre text NOT NULL,
  cliente_telefono text NOT NULL,
  tipo_contacto text NOT NULL DEFAULT 'CONTACTO_GENERADO',
  estado text NOT NULL DEFAULT 'CONTACTO_GENERADO',
  origen text NOT NULL DEFAULT 'tomar_el_fresco_en_yucatan',
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contactos_divertirme_negocio_idx ON public.contactos_divertirme(negocio_id);
GRANT SELECT ON public.contactos_divertirme TO authenticated;
GRANT ALL ON public.contactos_divertirme TO service_role;
ALTER TABLE public.contactos_divertirme ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contactos divertirme visibles" ON public.contactos_divertirme FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE TRIGGER contactos_divertirme_tocar BEFORE UPDATE ON public.contactos_divertirme
FOR EACH ROW EXECUTE FUNCTION public.tocar_actualizado_en();