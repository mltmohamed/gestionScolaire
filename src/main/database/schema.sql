-- Schéma de la base de données pour SchoolManage

-- Table: students (Élèves)
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  class_id INTEGER,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- Table: teachers (Professeurs)
CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  address TEXT,
  specialty TEXT,
  hire_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: classes
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  level TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  max_students INTEGER DEFAULT 30,
  teacher_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- Table: subjects (Matières)
CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  description TEXT,
  coefficient INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: grades (Notes)
CREATE TABLE IF NOT EXISTS grades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  value DECIMAL(5,2) NOT NULL,
  max_value DECIMAL(5,2) DEFAULT 20,
  comment TEXT,
  date DATE DEFAULT CURRENT_DATE,
  term TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject ON grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
