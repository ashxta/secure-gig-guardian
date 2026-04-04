
-- Create workers table
CREATE TABLE public.workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view their own profile" ON public.workers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Workers can insert their own profile" ON public.workers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Workers can update their own profile" ON public.workers FOR UPDATE USING (auth.uid() = user_id);

-- Create insurance_policies table
CREATE TABLE public.insurance_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE NOT NULL,
  policy_number TEXT NOT NULL UNIQUE,
  coverage_type TEXT NOT NULL DEFAULT 'Basic Coverage (4 hrs/day)',
  weekly_premium NUMERIC(10,2) NOT NULL DEFAULT 0,
  risk_score NUMERIC(5,2) DEFAULT 0,
  rainfall NUMERIC(10,2) DEFAULT 0,
  temperature NUMERIC(10,2) DEFAULT 0,
  aqi NUMERIC(10,2) DEFAULT 0,
  safe_zone NUMERIC(5,2) DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view their own policies" ON public.insurance_policies FOR SELECT USING (
  worker_id IN (SELECT id FROM public.workers WHERE user_id = auth.uid())
);
CREATE POLICY "Workers can create their own policies" ON public.insurance_policies FOR INSERT WITH CHECK (
  worker_id IN (SELECT id FROM public.workers WHERE user_id = auth.uid())
);
CREATE POLICY "Workers can update their own policies" ON public.insurance_policies FOR UPDATE USING (
  worker_id IN (SELECT id FROM public.workers WHERE user_id = auth.uid())
);
CREATE POLICY "Workers can delete their own policies" ON public.insurance_policies FOR DELETE USING (
  worker_id IN (SELECT id FROM public.workers WHERE user_id = auth.uid())
);

-- Create claims table
CREATE TYPE public.claim_status AS ENUM ('pending', 'approved', 'rejected', 'paid');

CREATE TABLE public.claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID REFERENCES public.insurance_policies(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE NOT NULL,
  claim_type TEXT NOT NULL,
  trigger_reason TEXT NOT NULL,
  payout_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status public.claim_status NOT NULL DEFAULT 'pending',
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view their own claims" ON public.claims FOR SELECT USING (
  worker_id IN (SELECT id FROM public.workers WHERE user_id = auth.uid())
);
CREATE POLICY "Workers can create their own claims" ON public.claims FOR INSERT WITH CHECK (
  worker_id IN (SELECT id FROM public.workers WHERE user_id = auth.uid())
);
CREATE POLICY "Workers can update their own claims" ON public.claims FOR UPDATE USING (
  worker_id IN (SELECT id FROM public.workers WHERE user_id = auth.uid())
);

-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON public.workers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON public.insurance_policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON public.claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
