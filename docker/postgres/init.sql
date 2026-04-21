-- ==============================================================================
-- 1. NETEJA PRÈVIA
-- ==============================================================================
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS zones CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==============================================================================
-- 2. CREACIÓ DE TAULES MESTRES
-- ==============================================================================

-- 1. Usuaris
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'client', 
    created_at TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP
);

-- 2. Recintes (On es fan els esdeveniments: Razzmatazz, Palau Sant Jordi...)
CREATE TABLE venues (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    created_at TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP
);

-- 3. Esdeveniments (El concert o espectacle enllaçat a un recinte)
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    venue_id BIGINT NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP(0) NOT NULL,
    created_at TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 3. EL NUCLI DE LA LLÒGICA: ZONES I SEIENTS
-- ==============================================================================

-- 4. Zones de l'esdeveniment (Pista General, Tribuna VIP...)
CREATE TABLE zones (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_numbered BOOLEAN DEFAULT false, -- TRUE = Té seients físics. FALSE = Només aforament (Pista)
    capacity INT NOT NULL,             -- Quanta gent hi cap en aquesta zona
    price DECIMAL(8, 2) NOT NULL,
    created_at TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP
);

-- 5. Seients (NOMÉS existeixen si la zona té is_numbered = true)
CREATE TABLE seats (
    id BIGSERIAL PRIMARY KEY,
    zone_id BIGINT NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    row_label VARCHAR(10) NOT NULL,
    seat_number INT NOT NULL,
    status VARCHAR(50) DEFAULT 'available', -- 'available', 'reserved', 'sold'
    created_at TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (zone_id, row_label, seat_number)
);

-- ==============================================================================
-- 4. GESTIÓ DE COMPRES I CONCURRÈNCIA
-- ==============================================================================

-- 6. Reserves Temporals (El bloqueig de 5 minuts)
CREATE TABLE reservations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    zone_id BIGINT NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    seat_id BIGINT REFERENCES seats(id) ON DELETE CASCADE NULL, -- NULL si és entrada de pista
    quantity INT DEFAULT 1, -- 1 per seients, N per entrades de pista
    expires_at TIMESTAMP(0) NOT NULL,
    created_at TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP
);

-- 7. Entrades Comprades (La venda final)
CREATE TABLE tickets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    zone_id BIGINT NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    seat_id BIGINT REFERENCES seats(id) ON DELETE CASCADE NULL, -- NULL si és entrada de pista
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    purchase_price DECIMAL(8, 2) NOT NULL,
    created_at TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 5. INSERCIÓ DE DADES DE PROVA (EL TEU EXEMPLE)
-- ==============================================================================

-- Usuaris
INSERT INTO users (name, email, password, role) VALUES 
('Marc Admin', 'admin@tixflow.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Client U', 'client1@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client');

-- Recintes
INSERT INTO venues (name, city, address) VALUES 
('Sala Razzmatazz', 'Barcelona', 'Carrer dels Almogàvers, 122'),
('Palau Sant Jordi', 'Barcelona', 'Passeig Olímpic, 5-7');

-- Esdeveniments
INSERT INTO events (venue_id, title, description, event_date) VALUES 
(1, 'Concert Indie Razzmatazz', 'Només pista, tothom dret.', '2026-10-15 21:00:00'),
(2, 'Gran Final E-Sports', 'Esdeveniment massiu amb pista i grada.', '2026-11-20 18:00:00');

-- Zones
INSERT INTO zones (event_id, name, is_numbered, capacity, price) VALUES 
-- ZONA 1: Esdeveniment Razzmatazz (Pista general, 2000 persones, sense seients)
(1, 'Pista General', false, 2000, 30.00),

-- ZONA 2 i 3: Esdeveniment Palau Sant Jordi (Pista i Grada VIP)
(2, 'Pista Premium', false, 1500, 80.00),
(2, 'Grada VIP', true, 50, 150.00); -- is_numbered = true

-- Seients (NOMÉS per a la Grada VIP del Palau Sant Jordi, zone_id = 3)
INSERT INTO seats (zone_id, row_label, seat_number, status) VALUES 
(3, 'Fila 1', 1, 'available'),
(3, 'Fila 1', 2, 'available'),
(3, 'Fila 1', 3, 'sold'), -- Simulem que ja està venut
(3, 'Fila 1', 4, 'available');

-- Creem un Ticket definitiu per a la persona que va comprar el seient 3
INSERT INTO tickets (user_id, zone_id, seat_id, qr_code, purchase_price) VALUES 
(2, 3, 3, 'QR-VIP-001', 150.00);

-- Creem un Ticket de pista (seat_id = NULL)
INSERT INTO tickets (user_id, zone_id, seat_id, qr_code, purchase_price) VALUES 
(2, 1, NULL, 'QR-PISTA-999', 30.00);