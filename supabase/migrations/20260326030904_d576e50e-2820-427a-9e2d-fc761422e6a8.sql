CREATE POLICY "Allow public read access" ON public.broncoscopia FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.broncoscopia FOR INSERT WITH CHECK (true);