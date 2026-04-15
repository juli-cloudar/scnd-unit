-- employees Tabelle erweitern
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'Mitarbeiter',
  permissions JSONB DEFAULT '{"canAddProducts": false, "canEditProducts": false, "canDeleteProducts": false, "canViewStats": false, "canManageEmployees": false}'::jsonb,
  login_count INTEGER DEFAULT 0,
  total_work_hours INTEGER DEFAULT 0,
  online BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- activity_logs Tabelle
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id),
  username TEXT,
  action TEXT,
  details TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
