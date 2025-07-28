-- יצירת טבלת ישובים
CREATE TABLE IF NOT EXISTS settlements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- הכנסת ישובים קיימים
INSERT INTO settlements (name) VALUES 
('ניר-עם'),
('כפר עזה'),
('ארז'),
('יכיני'),
('אור-הנר'),
('נחל עוז'),
('ברור-חיל'),
('גבים'),
('דורות'),
('מפלסים'),
('רוחמה')
ON CONFLICT (name) DO NOTHING; 