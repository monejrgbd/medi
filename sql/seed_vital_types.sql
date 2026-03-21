INSERT INTO public.vital_types (name, unit, min_value, max_value, step_value, display_order)
VALUES
  ('Weight', 'kg', 0.5, 500, 0.1, 1),
  ('Height', 'cm', 20, 300, 0.1, 2),
  ('Blood Pressure Systolic', 'mmHg', 60, 300, 1, 3),
  ('Blood Pressure Diastolic', 'mmHg', 30, 200, 1, 4),
  ('Heart Rate', 'bpm', 20, 300, 1, 5),
  ('Temperature', 'F', 90, 110, 0.1, 6),
  ('Oxygen Saturation', '%', 50, 100, 1, 7),
  ('Respiratory Rate', 'breaths/min', 5, 60, 1, 8),
  ('Blood Glucose', 'mg/dL', 20, 600, 1, 9),
  ('BMI', 'kg/m2', 10, 80, 0.1, 10),
  ('Head Circumference', 'cm', 20, 70, 0.1, 11)
ON CONFLICT (name) DO NOTHING;
