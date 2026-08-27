CREATE POLICY "negocios archivos ver" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'negocios' AND (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id::text = (storage.foldername(name))[1] AND n.owner_id = auth.uid())));
CREATE POLICY "negocios archivos subir" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'negocios' AND (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id::text = (storage.foldername(name))[1] AND n.owner_id = auth.uid())));
CREATE POLICY "negocios archivos actualizar" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'negocios' AND (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id::text = (storage.foldername(name))[1] AND n.owner_id = auth.uid())))
WITH CHECK (bucket_id = 'negocios' AND (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id::text = (storage.foldername(name))[1] AND n.owner_id = auth.uid())));
CREATE POLICY "negocios archivos borrar" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'negocios' AND (public.has_role(auth.uid(),'master') OR EXISTS (SELECT 1 FROM public.negocios n WHERE n.id::text = (storage.foldername(name))[1] AND n.owner_id = auth.uid())));