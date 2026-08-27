CREATE TABLE public.negocio_medios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('image','video')),
  public_id text NOT NULL,
  secure_url text NOT NULL,
  resource_type text NOT NULL DEFAULT 'image',
  orden integer NOT NULL DEFAULT 0,
  es_portada boolean NOT NULL DEFAULT false,
  es_destacado boolean NOT NULL DEFAULT false,
  width integer,
  height integer,
  duration numeric,
  format text,
  bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX negocio_medios_negocio_idx ON public.negocio_medios (negocio_id, orden);
CREATE UNIQUE INDEX negocio_medios_una_portada ON public.negocio_medios (negocio_id) WHERE es_portada;
CREATE UNIQUE INDEX negocio_medios_un_destacado ON public.negocio_medios (negocio_id) WHERE es_destacado;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.negocio_medios TO authenticated;
GRANT ALL ON public.negocio_medios TO service_role;

ALTER TABLE public.negocio_medios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "medios visibles" ON public.negocio_medios FOR SELECT TO authenticated
USING (has_role(auth.uid(),'master'::app_role) OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_medios.negocio_id AND n.owner_id = auth.uid()));

CREATE POLICY "medios insertan" ON public.negocio_medios FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(),'master'::app_role) OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_medios.negocio_id AND n.owner_id = auth.uid()));

CREATE POLICY "medios editan" ON public.negocio_medios FOR UPDATE TO authenticated
USING (has_role(auth.uid(),'master'::app_role) OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_medios.negocio_id AND n.owner_id = auth.uid()))
WITH CHECK (has_role(auth.uid(),'master'::app_role) OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_medios.negocio_id AND n.owner_id = auth.uid()));

CREATE POLICY "medios borran" ON public.negocio_medios FOR DELETE TO authenticated
USING (has_role(auth.uid(),'master'::app_role) OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_medios.negocio_id AND n.owner_id = auth.uid()));

CREATE TRIGGER negocio_medios_touch BEFORE UPDATE ON public.negocio_medios
FOR EACH ROW EXECUTE FUNCTION public.tocar_actualizado_en();

CREATE OR REPLACE FUNCTION public.medios_unico_marcado()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.es_portada THEN
    UPDATE public.negocio_medios SET es_portada = false
    WHERE negocio_id = NEW.negocio_id AND id <> NEW.id AND es_portada;
  END IF;
  IF NEW.es_destacado THEN
    UPDATE public.negocio_medios SET es_destacado = false
    WHERE negocio_id = NEW.negocio_id AND id <> NEW.id AND es_destacado;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER negocio_medios_unico
AFTER INSERT OR UPDATE OF es_portada, es_destacado ON public.negocio_medios
FOR EACH ROW EXECUTE FUNCTION public.medios_unico_marcado();

CREATE TABLE public.medios_pendientes_borrado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL,
  resource_type text NOT NULL DEFAULT 'image',
  procesado boolean NOT NULL DEFAULT false,
  creado_en timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.medios_pendientes_borrado TO authenticated;
GRANT ALL ON public.medios_pendientes_borrado TO service_role;

ALTER TABLE public.medios_pendientes_borrado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pendientes insertan" ON public.medios_pendientes_borrado FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "pendientes master" ON public.medios_pendientes_borrado FOR SELECT TO authenticated
USING (has_role(auth.uid(),'master'::app_role));