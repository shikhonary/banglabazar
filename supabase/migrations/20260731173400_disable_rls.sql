-- Disable Row Level Security on holding_cards
ALTER TABLE public.holding_cards DISABLE ROW LEVEL SECURITY;

-- Explicitly grant permissions to anon, authenticated, and service_role
GRANT ALL ON public.holding_cards TO anon;
GRANT ALL ON public.holding_cards TO authenticated;
GRANT ALL ON public.holding_cards TO service_role;
