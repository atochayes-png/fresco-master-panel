
ALTER TABLE public.negocio_perfil ADD COLUMN IF NOT EXISTS recibe_pedidos boolean NOT NULL DEFAULT false;

CREATE TABLE public.negocio_productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  precio numeric NOT NULL DEFAULT 0,
  disponible boolean NOT NULL DEFAULT true,
  foto_ruta text,
  foto_url text,
  orden integer NOT NULL DEFAULT 0,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.negocio_productos TO authenticated;
GRANT ALL ON public.negocio_productos TO service_role;
ALTER TABLE public.negocio_productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "productos visibles" ON public.negocio_productos FOR SELECT TO authenticated
USING (has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_productos.negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "productos insertan" ON public.negocio_productos FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_productos.negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "productos editan" ON public.negocio_productos FOR UPDATE TO authenticated
USING (has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_productos.negocio_id AND n.owner_id = auth.uid()))
WITH CHECK (has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_productos.negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "productos borran" ON public.negocio_productos FOR DELETE TO authenticated
USING (has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_productos.negocio_id AND n.owner_id = auth.uid()));

CREATE TRIGGER productos_tocar BEFORE UPDATE ON public.negocio_productos
FOR EACH ROW EXECUTE FUNCTION public.tocar_actualizado_en();

CREATE TABLE public.usuarios_publicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telefono text NOT NULL UNIQUE,
  acepta_promociones boolean NOT NULL DEFAULT false,
  creado_en timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.usuarios_publicos TO service_role;
ALTER TABLE public.usuarios_publicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuarios publicos master" ON public.usuarios_publicos FOR SELECT TO authenticated
USING (has_role(auth.uid(),'master'));

CREATE TABLE public.guardados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telefono text NOT NULL,
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  creado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (telefono, negocio_id)
);
GRANT ALL ON public.guardados TO service_role;
ALTER TABLE public.guardados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guardados master" ON public.guardados FOR SELECT TO authenticated
USING (has_role(auth.uid(),'master'));

CREATE TABLE public.resenas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  telefono text NOT NULL,
  estrellas smallint NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
  comentario text,
  creado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (telefono, negocio_id)
);
GRANT SELECT ON public.resenas TO authenticated;
GRANT ALL ON public.resenas TO service_role;
ALTER TABLE public.resenas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resenas visibles" ON public.resenas FOR SELECT TO authenticated
USING (has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = resenas.negocio_id AND n.owner_id = auth.uid()));

CREATE SEQUENCE IF NOT EXISTS public.pedidos_folio_seq;

CREATE TABLE public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio text NOT NULL UNIQUE DEFAULT ('TFY-' || lpad(nextval('public.pedidos_folio_seq')::text, 6, '0')),
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  cliente_nombre text NOT NULL,
  cliente_telefono text NOT NULL,
  tipo_entrega text NOT NULL DEFAULT 'recoger',
  direccion text,
  referencia text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  costo_entrega numeric NOT NULL DEFAULT 0,
  total_estimado numeric NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'GENERADO',
  origen text NOT NULL DEFAULT 'tomar_el_fresco_en_yucatan',
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pedidos TO authenticated;
GRANT ALL ON public.pedidos TO service_role;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pedidos visibles" ON public.pedidos FOR SELECT TO authenticated
USING (has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = pedidos.negocio_id AND n.owner_id = auth.uid()));

CREATE TRIGGER pedidos_tocar BEFORE UPDATE ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.tocar_actualizado_en();

CREATE INDEX idx_productos_negocio ON public.negocio_productos(negocio_id);
CREATE INDEX idx_pedidos_negocio ON public.pedidos(negocio_id, creado_en DESC);
CREATE INDEX idx_resenas_negocio ON public.resenas(negocio_id);
CREATE INDEX idx_guardados_tel ON public.guardados(telefono);
