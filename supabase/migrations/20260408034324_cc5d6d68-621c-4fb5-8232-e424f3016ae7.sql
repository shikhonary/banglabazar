CREATE TABLE public.holding_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  guardian_name TEXT NOT NULL,
  ward_no TEXT NOT NULL,
  holding_no TEXT NOT NULL,
  village TEXT NOT NULL,
  tax NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.holding_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own holding cards"
  ON public.holding_cards FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own holding cards"
  ON public.holding_cards FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own holding cards"
  ON public.holding_cards FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own holding cards"
  ON public.holding_cards FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_holding_cards_updated_at
  BEFORE UPDATE ON public.holding_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();