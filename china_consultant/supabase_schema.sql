-- SQL Schema for China Visa Service Consultancy Pvt. Ltd. Supabase Tables
-- Paste this script into your Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- 1. Create users table
CREATE TABLE IF NOT EXISTS public.users (
    email TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'employee', 'customer')),
    status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read users table, and allow public registrations
CREATE POLICY "Allow public read access to users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public registrations" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access to admins" ON public.users FOR UPDATE USING (true);

-- 2. Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    client TEXT NOT NULL,
    passport TEXT NOT NULL,
    country TEXT NOT NULL,
    "visaType" TEXT NOT NULL, -- Keep camelCase to match frontend keys
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'draft')),
    date DATE NOT NULL,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Allow read/write access to all
CREATE POLICY "Enable all actions for authenticated users" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable public select/insert for anonymous users" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Enable public insert for invoices" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable public update for invoices" ON public.invoices FOR UPDATE USING (true);

-- 3. Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    "clientName" TEXT NOT NULL, -- Keep camelCase to match frontend keys
    email TEXT NOT NULL,
    phone TEXT,
    country TEXT NOT NULL,
    "visaType" TEXT,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    "createdDate" DATE NOT NULL, -- Keep camelCase to match frontend keys
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all actions for appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable select for appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Enable insert for appointments" ON public.appointments FOR INSERT WITH CHECK (true);

-- 4. Seed Default accounts
INSERT INTO public.users (email, password, name, role, status)
VALUES 
('admin@cvs.com', 'admin123', 'Rajesh Sharma', 'admin', 'active'),
('employee@cvs.com', 'employee123', 'Anita Thapa', 'employee', 'active'),
('customer@cvs.com', 'customer123', 'Ram Bahadur', 'customer', 'active')
ON CONFLICT (email) DO NOTHING;

-- Seed Default Invoices
INSERT INTO public.invoices (id, client, passport, country, "visaType", amount, status, date, email, notes)
VALUES
('INV-2081-001', 'Ram Bahadur Thapa', 'NP12345678', 'China', 'Tourist (L)', 15000, 'paid', '2081-01-15', 'ram@email.com', 'Urgent China Tourist Visa processing.'),
('INV-2081-002', 'Sita Devi Sharma', 'NP87654321', 'Japan', 'Student', 18000, 'pending', '2081-02-03', 'sita@email.com', 'Japan Student Visa document checking.'),
('INV-2081-003', 'Hari Prasad KC', 'NP11223344', 'China', 'Business (M)', 20000, 'paid', '2081-02-20', 'hari@email.com', 'China Business Visa submission.'),
('INV-2081-004', 'Gita Adhikari', 'NP55667788', 'South Korea', 'Tourist', 12000, 'draft', '2081-03-10', 'gita@email.com', 'Drafting South Korea Tourist documents.'),
('INV-2081-005', 'Bikash Gurung', 'NP99887766', 'China', 'Student (X)', 22000, 'pending', '2081-03-18', 'bikash@email.com', 'China Student Visa documentation assistance.')
ON CONFLICT (id) DO NOTHING;
