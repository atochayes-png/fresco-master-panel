ALTER TABLE public.negocio_perfil
  ADD COLUMN IF NOT EXISTS comida_tipos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS atiende_local boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS atiende_recoger boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tiempo_preparacion text,
  ADD COLUMN IF NOT EXISTS formas_pago text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.negocio_productos
  ADD COLUMN IF NOT EXISTS categoria text;

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS forma_pago text,
  ADD COLUMN IF NOT EXISTS hora_solicitada text;

CREATE TABLE public.negocio_promociones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descripcion text,
  foto_url text,
  foto_public_id text,
  precio numeric,
  fecha_inicio date,
  fecha_fin date,
  activa boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX negocio_promociones_negocio_idx ON public.negocio_promociones(negocio_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.negocio_promociones TO authenticated;
GRANT ALL ON public.negocio_promociones TO service_role;

ALTER TABLE public.negocio_promociones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promociones visibles" ON public.negocio_promociones FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));

CREATE POLICY "promociones insertan" ON public.negocio_promociones FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));

CREATE POLICY "promociones editan" ON public.negocio_promociones FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()))
WITH CHECK (public.has_role(auth.uid(), 'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));

CREATE POLICY "promociones borran" ON public.negocio_promociones FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));

CREATE TRIGGER negocio_promociones_tocar BEFORE UPDATE ON public.negocio_promociones
FOR EACH ROW EXECUTE FUNCTION public.tocar_actualizado_en();