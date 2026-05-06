-- Időpont foglaló rendszer - Adatbázis séma
-- Futtatás: mysql -u root -p < database.sql

CREATE DATABASE IF NOT EXISTS idopont_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_hungarian_ci;

USE idopont_db;

-- Kategóriák tábla
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Felhasználók tábla (user = vásárló, company = vállalkozás)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'company') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cégek / vállalkozások tábla
CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  category_id INT NOT NULL,
  address VARCHAR(255),
  phone VARCHAR(30),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Szabad időpontok tábla
CREATE TABLE IF NOT EXISTS time_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Foglalások tábla
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  company_id INT NOT NULL,
  slot_id INT NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (slot_id) REFERENCES time_slots(id) ON DELETE CASCADE
);

-- Alap kategóriák feltöltése
INSERT INTO categories (name, icon) VALUES
  ('Fodrász', '✂️'),
  ('Orvos', '🏥'),
  ('Szépségszalon', '💅'),
  ('Autószerelő', '🔧'),
  ('Fogorvos', '🦷'),
  ('Masszőr', '💆'),
  ('Személyi edző', '💪'),
  ('Könyvelő', '📊'),
  ('Szemész', '👁️'),
  ('Egyéb', '📋');
