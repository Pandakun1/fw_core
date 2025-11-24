-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server-Version:               11.8.2-MariaDB-log - mariadb.org binary distribution
-- Server-Betriebssystem:        Win64
-- HeidiSQL Version:             12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Exportiere Datenbank-Struktur für spielplatz
CREATE DATABASE IF NOT EXISTS `spielplatz` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `spielplatz`;

-- Exportiere Struktur von Tabelle spielplatz.players
CREATE TABLE IF NOT EXISTS `players` (
  `identifier` varchar(64) NOT NULL,
  `name` varchar(100) NOT NULL,
  `money_cash` int(11) NOT NULL DEFAULT 0,
  `money_bank` int(11) NOT NULL DEFAULT 0,
  `inventory` longtext NOT NULL DEFAULT '{}',
  `job_name` varchar(50) NOT NULL DEFAULT 'unemployed',
  `job_grade` int(11) NOT NULL DEFAULT 0,
  `position_x` double NOT NULL DEFAULT 0,
  `position_y` double NOT NULL DEFAULT 0,
  `position_z` double NOT NULL DEFAULT 0,
  `daten` longtext NOT NULL,
  `last_seen` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle spielplatz.players: ~0 rows (ungefähr)
INSERT INTO `players` (`identifier`, `name`, `money_cash`, `money_bank`, `inventory`, `job_name`, `job_grade`, `position_x`, `position_y`, `position_z`, `daten`, `last_seen`) VALUES
	('license:ea235e1c3dffe7bc5479d630e62f061b4bbee0d2', 'probe', 609, 25572, '{}', 'unemployed', 0, 248.34725952148438, -759.6791381835938, 34.6380615234375, '"filler"', '2025-11-23 16:42:26');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
