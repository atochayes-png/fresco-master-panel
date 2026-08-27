CREATE TABLE public.negocio_perfil (
  negocio_id uuid PRIMARY KEY REFERENCES public.negocios(id) ON DELETE CASCADE,
  descripcion text,
  recibe_clientes boolean,
  direccion text,
  colonia text,
  codigo_postal text,
  latitud double precision,
  longitud double precision,
  domicilio boolean,
  costo_entrega_tipo text,
  costo_entrega numeric,
  distancia_km numeric,
  notas_entrega text,
  solo_reservacion boolean NOT NULL DEFAULT false,
  whatsapp_activo boolean NOT NULL DEFAULT true,
  whatsapp_numero text,
  facebook text,
  instagram text,
  sitio_web text,
  foto_principal text,
  menu_url text,
  menu_tipo text,
  precio_promedio numeric,
  precio_desde numeric,
  duracion text,
  punto_salida text,
  precio_noche numeric,
  capacidad integer,
  tipo_servicio text,
  paso_actual integer NOT NULL DEFAULT 1,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.negocio_perfil TO authenticated;
GRANT ALL ON public.negocio_perfil TO service_role;
ALTER TABLE public.negocio_perfil ENABLE ROW LEVEL SECURITY;
CREATE POLICY "perfil negocio visible" ON public.negocio_perfil FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "perfil negocio inserta" ON public.negocio_perfil FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "perfil negocio edita" ON public.negocio_perfil FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()))
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE TRIGGER negocio_perfil_actualizado_en BEFORE UPDATE ON public.negocio_perfil FOR EACH ROW EXECUTE FUNCTION public.tocar_actualizado_en();

CREATE TABLE public.negocio_horarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  dia smallint NOT NULL,
  abierto boolean NOT NULL DEFAULT false,
  apertura time,
  cierre time,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (negocio_id, dia)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.negocio_horarios TO authenticated;
GRANT ALL ON public.negocio_horarios TO service_role;
ALTER TABLE public.negocio_horarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "horarios visibles" ON public.negocio_horarios FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "horarios insertan" ON public.negocio_horarios FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "horarios editan" ON public.negocio_horarios FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()))
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "horarios borran" ON public.negocio_horarios FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE TRIGGER negocio_horarios_actualizado_en BEFORE UPDATE ON public.negocio_horarios FOR EACH ROW EXECUTE FUNCTION public.tocar_actualizado_en();

CREATE TABLE public.negocio_fotos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  ruta text NOT NULL,
  url text NOT NULL,
  orden integer NOT NULL DEFAULT 0,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.negocio_fotos TO authenticated;
GRANT ALL ON public.negocio_fotos TO service_role;
ALTER TABLE public.negocio_fotos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fotos visibles" ON public.negocio_fotos FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "fotos insertan" ON public.negocio_fotos FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "fotos editan" ON public.negocio_fotos FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()))
WITH CHECK (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE POLICY "fotos borran" ON public.negocio_fotos FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.owner_id = auth.uid()));
CREATE TRIGGER negocio_fotos_actualizado_en BEFORE UPDATE ON public.negocio_fotos FOR EACH ROW EXECUTE FUNCTION public.tocar_actualizado_en();

CREATE OR REPLACE FUNCTION public.negocio_dueno_sin_cambios_admin()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(),'master') THEN
    RETURN NEW;
  END IF;
  NEW.owner_id := OLD.owner_id;
  NEW.usuario := OLD.usuario;
  NEW.plan_tipo := OLD.plan_tipo;
  NEW.fecha_inicio := OLD.fecha_inicio;
  NEW.fecha_fin := OLD.fecha_fin;
  NEW.estatus := OLD.estatus;
  NEW.tipo := OLD.tipo;
  RETURN NEW;
END;
$$;
CREATE TRIGGER negocios_dueno_limites BEFORE UPDATE ON public.negocios FOR EACH ROW EXECUTE FUNCTION public.negocio_dueno_sin_cambios_admin();

CREATE POLICY "dueno edita su negocio" ON public.negocios FOR UPDATE TO authenticated
USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());