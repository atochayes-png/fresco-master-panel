ALTER TABLE public.negocio_perfil
  ADD COLUMN IF NOT EXISTS salida_latitud double precision,
  ADD COLUMN IF NOT EXISTS salida_longitud double precision;