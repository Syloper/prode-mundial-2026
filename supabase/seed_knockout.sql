-- ============================================================
-- PRODE MUNDIAL 2026 - Partidos Eliminación Directa
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Fechas: resultado_deadline = 24h antes del partido
-- Zona horaria: UTC (EDT = UTC-4 en verano)
-- ============================================================

INSERT INTO public.matches
  (id, home_team, away_team, home_team_flag, away_team_flag,
   scheduled_date, result_deadline, group_name, phase)
VALUES

-- ============================================================
-- DIECISEISAVOS DE FINAL (R32) — 2-5 julio 2026
-- ============================================================

-- 2 de julio
(73,  '1° Grupo E',              '3° mejor (A/B/C/D/F)',  '❓','❓', '2026-07-02 13:00:00+00','2026-07-01 13:00:00+00','Eliminación directa','Dieciseisavos'),
(74,  '1° Grupo I',              '3° mejor (C/D/F/G/H)',  '❓','❓', '2026-07-02 16:00:00+00','2026-07-01 16:00:00+00','Eliminación directa','Dieciseisavos'),
(75,  '2° Grupo A',              '2° Grupo B',            '❓','❓', '2026-07-02 19:00:00+00','2026-07-01 19:00:00+00','Eliminación directa','Dieciseisavos'),
(76,  '1° Grupo F',              '2° Grupo C',            '❓','❓', '2026-07-02 22:00:00+00','2026-07-01 22:00:00+00','Eliminación directa','Dieciseisavos'),

-- 3 de julio
(77,  '2° Grupo K',              '2° Grupo L',            '❓','❓', '2026-07-03 13:00:00+00','2026-07-02 13:00:00+00','Eliminación directa','Dieciseisavos'),
(78,  '1° Grupo H',              '2° Grupo J',            '❓','❓', '2026-07-03 16:00:00+00','2026-07-02 16:00:00+00','Eliminación directa','Dieciseisavos'),
(79,  '1° Grupo D',              '3° mejor (B/E/F/I/J)',  '❓','❓', '2026-07-03 19:00:00+00','2026-07-02 19:00:00+00','Eliminación directa','Dieciseisavos'),
(80,  '1° Grupo G',              '3° mejor (A/E/H/I/J)',  '❓','❓', '2026-07-03 22:00:00+00','2026-07-02 22:00:00+00','Eliminación directa','Dieciseisavos'),

-- 4 de julio
(81,  '1° Grupo C',              '2° Grupo F',            '❓','❓', '2026-07-04 13:00:00+00','2026-07-03 13:00:00+00','Eliminación directa','Dieciseisavos'),
(82,  '2° Grupo E',              '2° Grupo I',            '❓','❓', '2026-07-04 16:00:00+00','2026-07-03 16:00:00+00','Eliminación directa','Dieciseisavos'),
(83,  '1° Grupo A',              '3° mejor (C/E/F/H/I)',  '❓','❓', '2026-07-04 19:00:00+00','2026-07-03 19:00:00+00','Eliminación directa','Dieciseisavos'),
(84,  '1° Grupo L',              '3° mejor (E/H/I/J/K)',  '❓','❓', '2026-07-04 22:00:00+00','2026-07-03 22:00:00+00','Eliminación directa','Dieciseisavos'),

-- 5 de julio
(85,  '1° Grupo J',              '2° Grupo H',            '❓','❓', '2026-07-05 13:00:00+00','2026-07-04 13:00:00+00','Eliminación directa','Dieciseisavos'),
(86,  '2° Grupo D',              '2° Grupo G',            '❓','❓', '2026-07-05 16:00:00+00','2026-07-04 16:00:00+00','Eliminación directa','Dieciseisavos'),
(87,  '1° Grupo B',              '3° mejor (E/F/G/I/J)',  '❓','❓', '2026-07-05 19:00:00+00','2026-07-04 19:00:00+00','Eliminación directa','Dieciseisavos'),
(88,  '1° Grupo K',              '3° mejor (D/E/I/J/L)',  '❓','❓', '2026-07-05 22:00:00+00','2026-07-04 22:00:00+00','Eliminación directa','Dieciseisavos'),

-- ============================================================
-- OCTAVOS DE FINAL (R16) — 7-10 julio 2026
-- ============================================================
(89,  'Por definir','Por definir','❓','❓', '2026-07-07 17:00:00+00','2026-07-06 17:00:00+00','Eliminación directa','Octavos'),
(90,  'Por definir','Por definir','❓','❓', '2026-07-07 21:00:00+00','2026-07-06 21:00:00+00','Eliminación directa','Octavos'),
(91,  'Por definir','Por definir','❓','❓', '2026-07-08 17:00:00+00','2026-07-07 17:00:00+00','Eliminación directa','Octavos'),
(92,  'Por definir','Por definir','❓','❓', '2026-07-08 21:00:00+00','2026-07-07 21:00:00+00','Eliminación directa','Octavos'),
(93,  'Por definir','Por definir','❓','❓', '2026-07-09 17:00:00+00','2026-07-08 17:00:00+00','Eliminación directa','Octavos'),
(94,  'Por definir','Por definir','❓','❓', '2026-07-09 21:00:00+00','2026-07-08 21:00:00+00','Eliminación directa','Octavos'),
(95,  'Por definir','Por definir','❓','❓', '2026-07-10 17:00:00+00','2026-07-09 17:00:00+00','Eliminación directa','Octavos'),
(96,  'Por definir','Por definir','❓','❓', '2026-07-10 21:00:00+00','2026-07-09 21:00:00+00','Eliminación directa','Octavos'),

-- ============================================================
-- CUARTOS DE FINAL — 11-12 julio 2026
-- ============================================================
(97,  'Por definir','Por definir','❓','❓', '2026-07-11 17:00:00+00','2026-07-10 17:00:00+00','Eliminación directa','Cuartos'),
(98,  'Por definir','Por definir','❓','❓', '2026-07-11 21:00:00+00','2026-07-10 21:00:00+00','Eliminación directa','Cuartos'),
(99,  'Por definir','Por definir','❓','❓', '2026-07-12 17:00:00+00','2026-07-11 17:00:00+00','Eliminación directa','Cuartos'),
(100, 'Por definir','Por definir','❓','❓', '2026-07-12 21:00:00+00','2026-07-11 21:00:00+00','Eliminación directa','Cuartos'),

-- ============================================================
-- SEMIFINALES — 14-15 julio 2026
-- ============================================================
(101, 'Por definir','Por definir','❓','❓', '2026-07-14 21:00:00+00','2026-07-13 21:00:00+00','Eliminación directa','Semifinal'),
(102, 'Por definir','Por definir','❓','❓', '2026-07-15 21:00:00+00','2026-07-14 21:00:00+00','Eliminación directa','Semifinal'),

-- ============================================================
-- TERCER PUESTO — 18 julio 2026
-- ============================================================
(103, 'Por definir','Por definir','❓','❓', '2026-07-18 21:00:00+00','2026-07-17 21:00:00+00','Eliminación directa','Tercer puesto'),

-- ============================================================
-- FINAL — 19 julio 2026 · MetLife Stadium, NJ
-- ============================================================
(104, 'Por definir','Por definir','❓','❓', '2026-07-19 21:00:00+00','2026-07-18 21:00:00+00','Eliminación directa','Final')

ON CONFLICT (id) DO NOTHING;
