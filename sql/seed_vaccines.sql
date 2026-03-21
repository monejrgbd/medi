INSERT INTO public.vaccines (name, code, dose_series) VALUES
  ('Influenza',           '141', 1),
  ('COVID-19 mRNA',       '213', 2),
  ('Tdap',                '115', 1),
  ('Td',                  '138', 1),
  ('DTaP',                '20',  5),
  ('Hepatitis A',         '83',  2),
  ('Hepatitis B',         '45',  3),
  ('MMR',                 '3',   2),
  ('Varicella',           '21',  2),
  ('PCV13',               '133', 4),
  ('PPSV23',              '33',  1),
  ('Shingles RZV',        '187', 2),
  ('HPV',                 '165', 3),
  ('IPV',                 '10',  4),
  ('Meningococcal ACWY',  '114', 2),
  ('Rotavirus',           '116', 3),
  ('Hib',                 '48',  4)
ON CONFLICT (name) DO NOTHING;
