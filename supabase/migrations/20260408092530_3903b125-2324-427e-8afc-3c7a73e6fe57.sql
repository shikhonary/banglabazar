CREATE POLICY "Anyone can view holding cards by id"
ON public.holding_cards
FOR SELECT
TO anon
USING (true);