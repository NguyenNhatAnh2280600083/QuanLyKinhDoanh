-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: qlbanhangkinhdoanh
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `ix_categories_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Bột giặt','Các loại bột giặt Lix'),(2,'Nước giặt','Các loại nước giặt Lix cao cấp'),(3,'Nước xả vải','Các loại nước xả làm mềm vải Lix'),(4,'Chất tẩy rửa khác','Nước rửa chén, lau sàn Lix');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_debts`
--

DROP TABLE IF EXISTS `customer_debts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_debts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `order_id` int NOT NULL,
  `total_amount` float DEFAULT NULL,
  `paid_amount` float DEFAULT NULL,
  `remaining_amount` float DEFAULT NULL,
  `due_date` datetime NOT NULL,
  `status` enum('UNPAID','PARTIAL','PAID','OVERDUE') DEFAULT 'UNPAID',
  `created_at` datetime DEFAULT (now()),
  `updated_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_id` (`order_id`),
  KEY `customer_id` (`customer_id`),
  KEY `ix_customer_debts_id` (`id`),
  CONSTRAINT `customer_debts_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `customer_debts_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_debts`
--

LOCK TABLES `customer_debts` WRITE;
/*!40000 ALTER TABLE `customer_debts` DISABLE KEYS */;
INSERT INTO `customer_debts` VALUES (1,1,392,2750,2750,0,'2026-07-05 10:15:06','PAID','2026-06-05 10:15:05','2026-06-05 10:15:30'),(2,2,393,600,600,0,'2026-07-05 10:15:50','PAID','2026-06-05 10:15:49','2026-06-05 10:16:44'),(3,3,394,7350,0,7350,'2026-06-03 17:00:00','OVERDUE','2026-06-05 10:17:09','2026-06-05 10:59:36'),(4,3,395,1080,0,1080,'2026-07-05 11:31:36','UNPAID','2026-06-05 11:31:35','2026-06-05 11:31:35'),(5,1,401,14850,0,14850,'2026-07-12 09:34:27','UNPAID','2026-06-12 09:34:26','2026-06-12 09:34:26'),(6,3,402,12160,0,12160,'2026-07-12 10:37:51','UNPAID','2026-06-12 10:37:50','2026-06-12 10:37:50'),(7,4,403,7500,0,7500,'2026-07-12 10:38:04','UNPAID','2026-06-12 10:38:04','2026-06-12 10:38:04'),(8,5,406,15500,0,15500,'2026-07-12 10:40:29','UNPAID','2026-06-12 10:40:28','2026-06-12 10:40:28'),(9,6,405,2500,0,2500,'2026-07-12 10:40:29','UNPAID','2026-06-12 10:40:29','2026-06-12 10:40:29'),(10,5,404,8850,0,8850,'2026-07-12 10:40:29','UNPAID','2026-06-12 10:40:29','2026-06-12 10:40:29'),(11,4,407,13500,0,13500,'2026-07-12 12:46:55','UNPAID','2026-06-12 12:46:54','2026-06-12 12:46:54'),(12,1,408,11750,0,11750,'2026-07-17 08:26:19','UNPAID','2026-06-17 08:26:19','2026-06-17 08:26:19');
/*!40000 ALTER TABLE `customer_debts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `region` varchar(50) DEFAULT NULL,
  `customer_type` enum('MT','GT','ECOM','EXPORT') DEFAULT 'GT',
  `created_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `ix_customers_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'Công ty Cổ phần Bột giặt Lix','sales@lixco.com','02838966803','Số 3, đường số 2, Khu phố 4, Phường Linh Trung, TP. Thủ Đức, TP. HCM','South','MT','2026-05-15 10:28:38'),(2,'Công ty TNHH MTV Lix Việt Nam','info@lixvietnam.vn','02438542961','Lô A2, KCN Yên Phong, Xã Yên Trung, Huyện Yên Phong, Tỉnh Bắc Ninh','North','GT','2026-05-15 10:28:38'),(3,'Công ty TNHH Thương mại Dịch vụ Tổng hợp WinCommerce','contact@wincommerce.vn','02471066866','Số 72 Lê Thánh Tôn, Phường Bến Nghé, Quận 1, TP. HCM','South','ECOM','2026-05-15 10:28:38'),(4,'Công ty Cổ phần EB Services (Big C/Go!)','customer-service@bigc.vn','02839939200','163 Phan Đăng Lưu, Phường 1, Quận Phú Nhuận, TP. HCM','South','EXPORT','2026-05-15 10:28:38'),(5,'Hệ thống Siêu thị Co.op Mart (Saigon Co.op)','chamsockhachhang@saigoncoop.vn','1900555568','199-205 Nguyễn Thái Học, Phường Phạm Ngũ Lão, Quận 1, TP. HCM','South','MT','2026-05-15 10:28:38'),(6,'Chi nhánh Công ty CP Bột giặt Lix tại Bình Dương','lixbd@lixco.com','02743742441','Lô A6-A12, KCN Đại Đăng, Phường Phú Tân, TP. Thủ Dầu Một, Tỉnh Bình Dương','South','GT','2026-05-15 10:28:38');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `debt_payments`
--

DROP TABLE IF EXISTS `debt_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `debt_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `debt_id` int NOT NULL,
  `amount` float NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_date` datetime DEFAULT (now()),
  `note` text,
  `created_by` int NOT NULL,
  `created_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `debt_id` (`debt_id`),
  KEY `created_by` (`created_by`),
  KEY `ix_debt_payments_id` (`id`),
  CONSTRAINT `debt_payments_ibfk_1` FOREIGN KEY (`debt_id`) REFERENCES `customer_debts` (`id`),
  CONSTRAINT `debt_payments_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `debt_payments`
--

LOCK TABLES `debt_payments` WRITE;
/*!40000 ALTER TABLE `debt_payments` DISABLE KEYS */;
INSERT INTO `debt_payments` VALUES (1,1,2750,'cash','2026-06-05 03:15:16','Đã thanh toán vào ngày 6/5',1,'2026-06-05 10:15:30'),(2,2,600,'cash','2026-06-03 17:00:00',NULL,1,'2026-06-05 10:16:44');
/*!40000 ALTER TABLE `debt_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_logs`
--

DROP TABLE IF EXISTS `inventory_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int DEFAULT NULL,
  `order_id` int DEFAULT NULL,
  `type` enum('IN','OUT','ADJUST','RETURN') NOT NULL,
  `quantity` int NOT NULL,
  `note` text,
  `created_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `order_id` (`order_id`),
  KEY `created_by` (`created_by`),
  KEY `ix_inventory_logs_id` (`id`),
  CONSTRAINT `inventory_logs_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `inventory_logs_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `inventory_logs_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=189 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_logs`
--

LOCK TABLES `inventory_logs` WRITE;
/*!40000 ALTER TABLE `inventory_logs` DISABLE KEYS */;
INSERT INTO `inventory_logs` VALUES (121,1,386,'OUT',100,'Xuất kho 100 sp cho đơn #386 (tồn trước: 100)',1,'2026-06-05 08:55:49'),(122,3,387,'OUT',195,'Xuất kho 195 sp cho đơn #387 (tồn trước: 195)',1,'2026-06-05 08:56:06'),(123,1,386,'IN',100,'Nhập kho 100 sp dư từ SX đơn #386 (Kế hoạch #24)',1,'2026-06-05 08:56:16'),(124,2,386,'IN',200,'Nhập kho 200 sp dư từ SX đơn #386 (Kế hoạch #25)',1,'2026-06-05 08:56:20'),(125,3,388,'IN',200,'Nhập kho 200 sp dư từ SX đơn #388 (Kế hoạch #26)',1,'2026-06-05 08:57:33'),(126,4,389,'OUT',47,'Xuất kho 47 sp cho đơn #389 (tồn trước: 147)',2,'2026-06-05 08:58:50'),(127,3,390,'OUT',50,'Xuất kho 50 sp cho đơn #390 (tồn trước: 200)',1,'2026-06-05 09:26:01'),(134,2,NULL,'ADJUST',50,'[Điều chỉnh kiểm kê] Kiểm kê định kỳ. Chênh lệch: +50',1,'2026-06-05 09:45:26'),(160,1,391,'OUT',99,'Xuất kho 99 sp cho đơn #391 (tồn trước: 100)',1,'2026-06-05 09:54:16'),(161,1,NULL,'ADJUST',191,'[Điều chỉnh kiểm kê] Kiểm kê định kỳ. Chênh lệch: +191',1,'2026-06-05 10:06:05'),(162,2,392,'OUT',50,'Xuất kho 50 sp cho đơn #392 (tồn trước: 250)',1,'2026-06-05 10:15:04'),(163,3,393,'OUT',50,'Xuất kho 50 sp cho đơn #393 (tồn trước: 150)',1,'2026-06-05 10:15:49'),(164,5,394,'OUT',98,'Xuất kho 98 sp cho đơn #394 (tồn trước: 398)',1,'2026-06-05 10:17:08'),(165,3,395,'OUT',90,'Xuất kho 90 sp cho đơn #395 (tồn trước: 100)',1,'2026-06-05 11:31:35'),(166,1,NULL,'IN',1000,'Nhập kho từ hoàn thành kế hoạch sản xuất tuần PP-2026-001',1,'2026-06-05 15:10:56'),(167,3,NULL,'IN',692,'Nhập kho từ hoàn thành kế hoạch sản xuất tuần PP-2026-005',1,'2026-06-12 07:52:58'),(168,1,NULL,'ADJUST',-1190,'Cập nhật số lượng tồn kho từ 1200 thành 10 qua quản lý sản phẩm',1,'2026-06-12 09:15:38'),(169,2,NULL,'IN',100,'Nhập kho từ hoàn thành kế hoạch sản xuất tuần PP-2026-003',1,'2026-06-12 09:19:17'),(170,1,NULL,'IN',109,'Nhập kho từ hoàn thành kế hoạch sản xuất tuần PP-2026-007',1,'2026-06-12 09:32:48'),(171,1,401,'OUT',99,'Xuất kho 99 sp cho đơn #401 (tồn trước: 119)',1,'2026-06-12 09:34:26'),(172,1,NULL,'IN',98,'Nhập kho từ hoàn thành kế hoạch sản xuất tuần PP-2026-008',1,'2026-06-12 10:20:38'),(173,1,NULL,'IN',1,'Nhập kho từ hoàn thành kế hoạch sản xuất tuần PP-2026-009',1,'2026-06-12 10:23:09'),(174,4,402,'OUT',80,'Xuất kho 80 sp cho đơn #402 (tồn trước: 100)',1,'2026-06-12 10:37:50'),(175,6,402,'OUT',48,'Xuất kho 48 sp cho đơn #402 (tồn trước: 348)',1,'2026-06-12 10:37:50'),(176,5,403,'OUT',100,'Xuất kho 100 sp cho đơn #403 (tồn trước: 300)',1,'2026-06-12 10:38:03'),(177,1,404,'OUT',59,'Xuất kho 59 sp cho đơn #404 (tồn trước: 119)',1,'2026-06-12 10:40:27'),(178,8,405,'OUT',100,'Xuất kho 100 sp cho đơn #405 (tồn trước: 800)',1,'2026-06-12 10:40:28'),(179,7,406,'OUT',200,'Xuất kho 200 sp cho đơn #406 (tồn trước: 500)',1,'2026-06-12 10:40:28'),(180,8,406,'OUT',100,'Xuất kho 100 sp cho đơn #406 (tồn trước: 700)',1,'2026-06-12 10:40:28'),(181,1,NULL,'IN',130,'Nhập kho từ hoàn thành kế hoạch sản xuất tuần PP-2026-010',1,'2026-06-12 12:44:39'),(182,4,NULL,'IN',76,'Nhập kho từ hoàn thành kế hoạch sản xuất tuần PP-2026-011',1,'2026-06-12 12:46:39'),(183,1,407,'OUT',90,'Xuất kho 90 sp cho đơn #407 (tồn trước: 190)',1,'2026-06-12 12:46:51'),(184,1,NULL,'IN',198,'Nhập kho từ hoàn thành kế hoạch sản xuất tuần PP-2026-018',1,'2026-06-16 11:05:50'),(185,4,408,'OUT',50,'Xuất kho 50 sp cho đơn #408 (tồn trước: 96)',1,'2026-06-17 08:26:18'),(186,2,408,'OUT',100,'Xuất kho 100 sp cho đơn #408 (tồn trước: 300)',1,'2026-06-17 08:26:18'),(187,2,NULL,'IN',50,'Nhập kho từ hoàn thành kế hoạch sản xuất tuần PP-2026-017',1,'2026-06-17 08:28:43'),(188,1,NULL,'IN',198,'Nhập kho từ hoàn thành kế hoạch sản xuất tuần PP-2026-015',1,'2026-06-17 08:29:17');
/*!40000 ALTER TABLE `inventory_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_requests`
--

DROP TABLE IF EXISTS `material_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `request_code` varchar(50) NOT NULL,
  `material_id` int NOT NULL,
  `requested_quantity` float NOT NULL,
  `current_stock` float NOT NULL,
  `missing_quantity` float NOT NULL,
  `reason` text,
  `status` enum('PENDING','APPROVED','REJECTED','COMPLETED') DEFAULT NULL,
  `production_plan_id` int DEFAULT NULL,
  `created_by` int NOT NULL,
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT (now()),
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_material_requests_request_code` (`request_code`),
  KEY `material_id` (`material_id`),
  KEY `production_plan_id` (`production_plan_id`),
  KEY `created_by` (`created_by`),
  KEY `approved_by` (`approved_by`),
  KEY `ix_material_requests_id` (`id`),
  CONSTRAINT `material_requests_ibfk_1` FOREIGN KEY (`material_id`) REFERENCES `raw_materials` (`id`),
  CONSTRAINT `material_requests_ibfk_2` FOREIGN KEY (`production_plan_id`) REFERENCES `production_plans` (`id`),
  CONSTRAINT `material_requests_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `material_requests_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_requests`
--

LOCK TABLES `material_requests` WRITE;
/*!40000 ALTER TABLE `material_requests` DISABLE KEYS */;
INSERT INTO `material_requests` VALUES (2,'MR-202606-001',13,1089,0,1089,'Cần hàng để sản xuất sản phẩm ','COMPLETED',NULL,1,1,'2026-06-12 06:50:24','2026-06-12 13:50:21','2026-06-12 13:50:24'),(3,'MR-202606-002',13,1089,0,1089,'Nhập nguyên liệu về kho ','COMPLETED',NULL,1,1,'2026-06-16 04:06:36','2026-06-16 11:06:34','2026-06-16 11:06:37');
/*!40000 ALTER TABLE `material_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `order_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `type` enum('production_request','low_stock','material_request') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` int DEFAULT NULL,
  `created_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  KEY `ix_notifications_id` (`id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `notifications_ibfk_3` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (9,1,386,1,'production_request','Yeu cau san xuat them san pham','Don hang ORD-386 can 200 Bột giặt Lix Extra Chanh 6kg, ton kho hien co 100. Can san xuat them 100 san pham.',1,'2026-06-05 08:55:48'),(10,1,386,2,'production_request','Yeu cau san xuat them san pham','Don hang ORD-386 can 100 Bột giặt Lix Đậm Đặc 2kg, ton kho hien co 0. Can san xuat them 100 san pham.',1,'2026-06-05 08:55:48'),(11,1,388,3,'production_request','Yeu cau san xuat them san pham','Don hang ORD-388 can 200 Bột giặt Lix Sạch Thơm 400g, ton kho hien co 0. Can san xuat them 200 san pham.',1,'2026-06-05 08:57:09'),(12,1,NULL,1,'low_stock','Cảnh báo tồn kho thấp','Sản phẩm \'Bột giặt Lix Extra Chanh 6kg\' đang có tồn kho thấp (9 < ngưỡng 10). Vui lòng kiểm tra và bổ sung.',1,'2026-06-05 10:03:41'),(13,1,NULL,3,'low_stock','Cảnh báo tồn kho thấp','Sản phẩm \'Bột giặt Lix Sạch Thơm 400g\' đang có tồn kho thấp (10 < ngưỡng 10). Vui lòng kiểm tra và bổ sung.',1,'2026-06-05 11:31:35'),(14,1,NULL,NULL,'material_request','Yêu cầu nhập nguyên vật liệu','Nhân viên Administrator yêu cầu nhập thêm 500.0 kg Soap base powder. Ghi chú: Yêu cầu nhập hàng cho kế hoạch sản xuất Bột giặt Lix Extra Chanh 6kg',1,'2026-06-05 13:26:14'),(15,1,NULL,NULL,'material_request','Yêu cầu nhập nguyên vật liệu','Nhân viên Administrator yêu cầu nhập thêm 500.0 kg Soap base powder. Ghi chú: Yêu cầu nhập hàng cho kế hoạch sản xuất Bột giặt Lix Extra Chanh 6kg',1,'2026-06-05 13:26:18'),(16,1,NULL,NULL,'material_request','Yêu cầu nhập nguyên vật liệu','Nhân viên Administrator yêu cầu nhập thêm 500.0 kg Soap base powder. Ghi chú: Yêu cầu nhập hàng cho kế hoạch sản xuất Bột giặt Lix Extra Chanh 6kg',1,'2026-06-05 13:27:59'),(17,1,NULL,NULL,'material_request','Yêu cầu nhập nguyên vật liệu','Nhân viên Administrator yêu cầu nhập thêm 500.0 kg Soap base powder. Ghi chú: Yêu cầu nhập hàng cho kế hoạch sản xuất Bột giặt Lix Extra Chanh 6kg',1,'2026-06-05 13:28:54'),(18,2,NULL,1,'production_request','Yêu cầu cung cấp nguyên vật liệu','Yêu cầu NVL cho 1000.0 Bột giặt Lix Extra Chanh 6kg. Ghi chú: Đang thiếu: Soap base powder: 500',0,'2026-06-05 14:25:34'),(19,2,NULL,1,'production_request','Yêu cầu cung cấp nguyên vật liệu','Yêu cầu NVL cho 1000.0 Bột giặt Lix Extra Chanh 6kg. Ghi chú: Đang thiếu: Soap base powder: 500',0,'2026-06-05 14:27:29'),(20,1,NULL,1,'low_stock','Cảnh báo thiếu nguyên vật liệu sản xuất','Kế hoạch PP-2026-012 - Bột giặt Lix Extra Chanh 6kg không đủ nguyên vật liệu để tiếp tục sản xuất. Chi tiết: Soap base powder: thiếu 1089. Vui lòng bổ sung NVL trước khi vận hành.',0,'2026-06-12 13:07:14'),(21,2,NULL,1,'low_stock','Cảnh báo thiếu nguyên vật liệu sản xuất','Kế hoạch PP-2026-012 - Bột giặt Lix Extra Chanh 6kg không đủ nguyên vật liệu để tiếp tục sản xuất. Chi tiết: Soap base powder: thiếu 1089. Vui lòng bổ sung NVL trước khi vận hành.',0,'2026-06-12 13:07:14');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `quantity` int NOT NULL,
  `unit_price` float NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  KEY `ix_order_items_id` (`id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1301 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1270,386,1,200,150),(1271,386,2,100,55),(1272,387,3,195,12),(1273,388,3,200,12),(1274,389,4,47,125),(1275,390,3,50,12),(1276,391,1,99,150),(1277,392,2,50,55),(1278,393,3,50,12),(1279,394,5,98,75),(1280,395,3,90,12),(1290,401,1,99,150),(1291,402,4,80,125),(1292,402,6,48,45),(1293,403,5,100,75),(1294,404,1,59,150),(1295,405,8,100,25),(1296,406,7,200,65),(1297,406,8,100,25),(1298,407,1,90,150),(1299,408,4,50,125),(1300,408,2,100,55);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_status_logs`
--

DROP TABLE IF EXISTS `order_status_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_status_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int DEFAULT NULL,
  `old_status` enum('PENDING','APPROVED','READY_TO_SHIP','SHIPPED','COMPLETED','CANCELLED') DEFAULT NULL,
  `new_status` enum('PENDING','APPROVED','READY_TO_SHIP','SHIPPED','COMPLETED','CANCELLED') DEFAULT NULL,
  `changed_by` int DEFAULT NULL,
  `changed_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `changed_by` (`changed_by`),
  KEY `ix_order_status_logs_id` (`id`),
  CONSTRAINT `order_status_logs_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `order_status_logs_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_status_logs`
--

LOCK TABLES `order_status_logs` WRITE;
/*!40000 ALTER TABLE `order_status_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_status_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `total_amount` float DEFAULT NULL,
  `status` enum('PENDING','APPROVED','READY_TO_SHIP','SHIPPED','COMPLETED','CANCELLED') DEFAULT 'PENDING',
  `created_at` datetime DEFAULT (now()),
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  KEY `user_id` (`user_id`),
  KEY `ix_orders_id` (`id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=409 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (386,1,1,35500,'COMPLETED','2026-06-05 08:55:48','2026-06-05 08:56:23'),(387,2,1,2340,'COMPLETED','2026-06-05 08:56:05','2026-06-05 08:56:08'),(388,3,3,2400,'COMPLETED','2026-06-05 08:57:09','2026-06-05 08:57:47'),(389,4,2,5875,'COMPLETED','2026-06-05 08:58:49','2026-06-05 08:58:51'),(390,5,1,600,'COMPLETED','2026-06-05 09:26:00','2026-06-05 09:26:02'),(391,5,1,14850,'COMPLETED','2026-06-05 09:46:26','2026-06-05 09:54:19'),(392,1,1,2750,'COMPLETED','2026-06-05 10:15:03','2026-06-05 10:15:05'),(393,2,1,600,'COMPLETED','2026-06-05 10:15:48','2026-06-05 10:15:49'),(394,3,1,7350,'COMPLETED','2026-06-05 10:17:06','2026-06-05 10:17:09'),(395,3,1,1080,'COMPLETED','2026-06-05 11:31:32','2026-06-05 11:31:35'),(401,1,1,14850,'COMPLETED','2026-06-12 09:34:22','2026-06-12 09:34:26'),(402,3,1,12160,'COMPLETED','2026-06-12 10:37:47','2026-06-12 10:37:50'),(403,4,1,7500,'COMPLETED','2026-06-12 10:38:02','2026-06-12 10:38:04'),(404,5,1,8850,'COMPLETED','2026-06-12 10:39:55','2026-06-12 10:40:29'),(405,6,1,2500,'COMPLETED','2026-06-12 10:40:04','2026-06-12 10:40:29'),(406,5,1,15500,'COMPLETED','2026-06-12 10:40:25','2026-06-12 10:40:28'),(407,4,1,13500,'COMPLETED','2026-06-12 12:46:48','2026-06-12 12:46:54'),(408,1,1,11750,'COMPLETED','2026-06-17 08:26:15','2026-06-17 08:26:19');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int DEFAULT NULL,
  `amount` float NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_date` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_id` (`order_id`),
  KEY `ix_payments_id` (`id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_permissions_code` (`code`),
  KEY `ix_permissions_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'USER_MANAGEMENT','Quản lý người dùng','Tạo/sửa/khóa/mở khóa/gán role cho user'),(2,'ROLE_MANAGEMENT','Quản lý role','Tạo/sửa/xóa role'),(3,'PERMISSION_MANAGEMENT','Quản lý phân quyền','Gán permission cho role'),(4,'CUSTOMER_MANAGEMENT','Quản lý khách hàng','CRUD khách hàng'),(5,'DEBT_MANAGEMENT','Quản lý công nợ','Xem/ghi nhận công nợ'),(6,'PRODUCT_MANAGEMENT','Quản lý sản phẩm','CRUD sản phẩm'),(7,'ORDER_MANAGEMENT','Quản lý đơn hàng','CRUD đơn hàng'),(8,'INVENTORY_VIEW','Xem tồn kho','Xem tồn kho thành phẩm'),(9,'WAREHOUSE_MANAGEMENT','Quản lý kho','Nhập/xuất/điều chỉnh kho + xem nhật ký kho'),(10,'RAW_MATERIAL_MANAGEMENT','Quản lý NVL','CRUD nguyên vật liệu + nhập/xuất'),(11,'BOM_MANAGEMENT','Quản lý BOM','CRUD BOM + tính nhu cầu NVL'),(12,'PRODUCTION_MANAGEMENT','Quản lý kế hoạch sản xuất','CRUD kế hoạch sản xuất'),(13,'REPORT_VIEW','Xem báo cáo','Xem báo cáo doanh thu'),(14,'PRODUCT_ANALYTICS_VIEW','Xem Product Analytics','Xem báo cáo phân tích sản phẩm');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_bom`
--

DROP TABLE IF EXISTS `product_bom`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_bom` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int DEFAULT NULL,
  `material_id` int DEFAULT NULL,
  `quantity_required` float NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `material_id` (`material_id`),
  KEY `ix_product_bom_id` (`id`),
  CONSTRAINT `product_bom_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `product_bom_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `raw_materials` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_bom`
--

LOCK TABLES `product_bom` WRITE;
/*!40000 ALTER TABLE `product_bom` DISABLE KEYS */;
INSERT INTO `product_bom` VALUES (1,1,13,5.5),(2,1,17,0.4),(3,1,15,1),(4,2,18,2),(5,2,14,0.05),(6,2,16,1);
/*!40000 ALTER TABLE `product_bom` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `production_material_usage`
--

DROP TABLE IF EXISTS `production_material_usage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_material_usage` (
  `id` int NOT NULL AUTO_INCREMENT,
  `production_plan_id` int DEFAULT NULL,
  `material_id` int DEFAULT NULL,
  `quantity_used` float NOT NULL,
  `created_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `production_plan_id` (`production_plan_id`),
  KEY `material_id` (`material_id`),
  KEY `ix_production_material_usage_id` (`id`),
  CONSTRAINT `production_material_usage_ibfk_1` FOREIGN KEY (`production_plan_id`) REFERENCES `production_plans` (`id`),
  CONSTRAINT `production_material_usage_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `raw_materials` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `production_material_usage`
--

LOCK TABLES `production_material_usage` WRITE;
/*!40000 ALTER TABLE `production_material_usage` DISABLE KEYS */;
INSERT INTO `production_material_usage` VALUES (1,NULL,13,5500,'2026-06-05 15:10:56'),(2,NULL,17,400,'2026-06-05 15:10:56'),(3,NULL,15,1000,'2026-06-05 15:10:56'),(4,9,18,200,'2026-06-12 09:19:17'),(5,9,14,5,'2026-06-12 09:19:17'),(6,9,16,100,'2026-06-12 09:19:17'),(7,11,13,599.5,'2026-06-12 09:32:48'),(8,11,17,43.6,'2026-06-12 09:32:48'),(9,11,15,109,'2026-06-12 09:32:48'),(10,NULL,13,539,'2026-06-12 10:20:38'),(11,NULL,17,39.2,'2026-06-12 10:20:38'),(12,NULL,15,98,'2026-06-12 10:20:38'),(13,13,13,5.5,'2026-06-12 10:23:09'),(14,13,17,0.4,'2026-06-12 10:23:09'),(15,13,15,1,'2026-06-12 10:23:09'),(16,14,13,715,'2026-06-12 12:44:39'),(17,14,17,52,'2026-06-12 12:44:39'),(18,14,15,130,'2026-06-12 12:44:39'),(19,22,13,1089,'2026-06-16 11:05:50'),(20,22,17,79.2,'2026-06-16 11:05:50'),(21,22,15,198,'2026-06-16 11:05:50'),(22,21,18,100,'2026-06-17 08:28:43'),(23,21,14,2.5,'2026-06-17 08:28:43'),(24,21,16,50,'2026-06-17 08:28:43'),(25,19,13,1089,'2026-06-17 08:29:17'),(26,19,17,79.2,'2026-06-17 08:29:17'),(27,19,15,198,'2026-06-17 08:29:17');
/*!40000 ALTER TABLE `production_material_usage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `production_plans`
--

DROP TABLE IF EXISTS `production_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plan_code` varchar(50) NOT NULL,
  `product_id` int NOT NULL,
  `planned_quantity` int NOT NULL,
  `completed_quantity` int DEFAULT NULL,
  `week_number` int NOT NULL,
  `year` int NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `status` enum('PLANNED','IN_PROGRESS','COMPLETED','CANCELLED') DEFAULT NULL,
  `progress_percent` float DEFAULT NULL,
  `note` text,
  `created_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT (now()),
  `updated_at` datetime DEFAULT (now()),
  `order_id` int DEFAULT NULL,
  `required_quantity` int DEFAULT NULL,
  `is_stock_deducted` int DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_production_plans_plan_code` (`plan_code`),
  KEY `product_id` (`product_id`),
  KEY `created_by` (`created_by`),
  KEY `order_id` (`order_id`),
  KEY `ix_production_plans_id` (`id`),
  CONSTRAINT `production_plans_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `production_plans_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `production_plans_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `production_plans`
--

LOCK TABLES `production_plans` WRITE;
/*!40000 ALTER TABLE `production_plans` DISABLE KEYS */;
INSERT INTO `production_plans` VALUES (5,'PP-2026-005',3,692,692,25,2026,'2026-06-15 00:00:00','2026-06-21 23:59:59','COMPLETED',100,NULL,1,'2026-06-11 23:20:27','2026-06-12 07:52:58',NULL,692,0,NULL,NULL),(9,'PP-2026-003',2,100,100,25,2026,'2026-06-15 00:00:00','2026-06-21 23:59:59','COMPLETED',100,NULL,1,'2026-06-12 07:53:42','2026-06-12 09:19:17',NULL,100,0,NULL,NULL),(10,'PP-2026-006',1,109,0,25,2026,'2026-06-15 00:00:00','2026-06-21 23:59:59','CANCELLED',0,NULL,1,'2026-06-12 09:15:47','2026-06-12 09:19:03',NULL,109,0,NULL,NULL),(11,'PP-2026-007',1,109,109,25,2026,'2026-06-15 00:00:00','2026-06-21 23:59:59','COMPLETED',100,NULL,1,'2026-06-12 09:32:44','2026-06-12 09:32:48',NULL,109,0,NULL,NULL),(13,'PP-2026-009',1,1,1,26,2026,'2026-06-22 00:00:00','2026-06-28 23:59:59','COMPLETED',100,NULL,1,'2026-06-12 10:23:07','2026-06-12 10:23:09',NULL,1,0,'2026-06-12 03:23:09','2026-06-12 03:23:09'),(14,'PP-2026-010',1,130,130,25,2026,'2026-06-15 00:00:00','2026-06-21 23:59:59','COMPLETED',100,NULL,1,'2026-06-12 10:57:02','2026-06-12 12:44:39',NULL,130,0,'2026-06-11 17:00:00','2026-06-12 05:44:39'),(15,'PP-2026-011',4,76,76,25,2026,'2026-06-15 00:00:00','2026-06-21 23:59:59','COMPLETED',100,NULL,1,'2026-06-12 10:57:02','2026-06-12 12:46:39',NULL,76,0,'2026-06-11 17:00:00','2026-06-12 05:46:40'),(16,'PP-2026-012',1,198,98,25,2026,'2026-06-15 00:00:00','2026-06-21 23:59:59','CANCELLED',49.49,NULL,1,'2026-06-12 12:47:04','2026-06-12 13:09:34',NULL,198,0,'2026-06-11 17:00:00',NULL),(17,'PP-2026-013',1,198,0,25,2026,'2026-06-15 00:00:00','2026-06-21 23:59:59','CANCELLED',0,NULL,1,'2026-06-12 13:09:40','2026-06-12 13:12:15',NULL,198,0,NULL,NULL),(18,'PP-2026-014',1,198,0,25,2026,'2026-06-15 00:00:00','2026-06-21 23:59:59','CANCELLED',0,NULL,1,'2026-06-12 13:12:21','2026-06-12 13:19:24',NULL,198,0,NULL,NULL),(19,'PP-2026-015',1,198,198,25,2026,'2026-06-15 00:00:00','2026-06-21 23:59:59','COMPLETED',100,NULL,1,'2026-06-12 13:19:28','2026-06-17 08:29:17',NULL,198,0,'2026-06-11 17:00:00','2026-06-15 17:00:00'),(20,'PP-2026-016',4,4,0,25,2026,'2026-06-15 00:00:00','2026-06-21 23:59:59','PLANNED',0,NULL,1,'2026-06-12 13:20:25','2026-06-12 13:20:25',NULL,4,0,NULL,NULL),(21,'PP-2026-017',2,50,50,25,2026,'2026-06-15 00:00:00','2026-06-21 23:59:59','COMPLETED',100,NULL,1,'2026-06-12 13:28:04','2026-06-17 08:28:43',NULL,50,0,'2026-06-11 21:00:00','2026-06-17 01:28:44'),(22,'PP-2026-018',1,198,198,26,2026,'2026-06-22 00:00:00','2026-06-28 23:59:59','COMPLETED',100,NULL,1,'2026-06-16 11:05:48','2026-06-16 11:05:50',NULL,198,0,'2026-06-16 04:05:51','2026-06-16 04:05:51');
/*!40000 ALTER TABLE `production_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `price` float NOT NULL,
  `stock_quantity` int DEFAULT NULL,
  `low_stock_threshold` int DEFAULT NULL,
  `safety_stock_rate` float NOT NULL DEFAULT '0.2',
  `category_id` int DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT (now()),
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `ix_products_id` (`id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'Bột giặt Lix Extra Chanh 6kg','Bột giặt hương chanh thơm mát, tẩy sạch vết bẩn',150,496,10,0.2,1,NULL,'2026-05-15 10:28:38','2026-06-17 08:29:17'),(2,'Bột giặt Lix Đậm Đặc 2kg','Công thức đậm đặc, tiết kiệm hơn',55,250,10,0.2,1,NULL,'2026-05-15 10:28:38','2026-06-17 08:28:43'),(3,'Bột giặt Lix Sạch Thơm 400g','Gói nhỏ tiện lợi, sạch nhanh',12,702,10,0.2,1,NULL,'2026-05-15 10:28:38','2026-06-12 07:52:58'),(4,'Nước giặt Lix Matic Hương Nước Hoa 3.8kg','Chuyên dùng cho máy giặt, hương thơm bền lâu',125,46,10,0.2,2,NULL,'2026-05-15 10:28:38','2026-06-17 08:26:18'),(5,'Nước giặt Lix Thơm Ngát 2kg','Sạch vết bẩn, bảo vệ sợi vải',75,200,10,0.2,2,NULL,'2026-05-15 10:28:38','2026-06-12 10:38:03'),(6,'Nước xả vải Lix Soft Hương Hoa Hồng 1.8L','Làm mềm vải, hương hoa hồng dịu nhẹ',45,300,10,0.2,3,NULL,'2026-05-15 10:28:38','2026-06-12 10:37:50'),(7,'Nước rửa chén Lix Hương Chanh 4kg','Tẩy sạch dầu mỡ, hương chanh tự nhiên',65,300,10,0.2,4,NULL,'2026-05-15 10:28:38','2026-06-12 10:40:28'),(8,'Nước lau sàn Lix Hương Lily 1L','Sạch bóng mặt sàn, hương hoa Lily',25,600,10,0.2,4,NULL,'2026-05-15 10:28:38','2026-06-12 10:40:28');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `raw_material_logs`
--

DROP TABLE IF EXISTS `raw_material_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `raw_material_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `material_id` int DEFAULT NULL,
  `type` enum('IMPORT','EXPORT') NOT NULL,
  `quantity` float NOT NULL,
  `note` text,
  `created_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `material_id` (`material_id`),
  KEY `created_by` (`created_by`),
  KEY `ix_raw_material_logs_id` (`id`),
  CONSTRAINT `raw_material_logs_ibfk_1` FOREIGN KEY (`material_id`) REFERENCES `raw_materials` (`id`),
  CONSTRAINT `raw_material_logs_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `raw_material_logs`
--

LOCK TABLES `raw_material_logs` WRITE;
/*!40000 ALTER TABLE `raw_material_logs` DISABLE KEYS */;
INSERT INTO `raw_material_logs` VALUES (11,13,'IMPORT',5000,'Initial system seeding',1,'2026-06-05 13:02:05'),(12,14,'IMPORT',100,'Initial system seeding',1,'2026-06-05 13:02:05'),(13,15,'IMPORT',10000,'Initial system seeding',1,'2026-06-05 13:02:05'),(14,16,'IMPORT',5000,'Initial system seeding',1,'2026-06-05 13:02:05'),(15,17,'IMPORT',2000,'Initial system seeding',1,'2026-06-05 13:02:05'),(16,18,'IMPORT',3000,'Initial system seeding',1,'2026-06-05 13:02:05'),(17,NULL,'IMPORT',1000,NULL,1,'2026-06-05 13:11:04'),(18,13,'IMPORT',5500,NULL,1,'2026-06-05 15:10:18'),(19,13,'EXPORT',5500,'Xuất sản xuất theo kế hoạch #1',1,'2026-06-05 15:10:56'),(20,17,'EXPORT',400,'Xuất sản xuất theo kế hoạch #1',1,'2026-06-05 15:10:56'),(21,15,'EXPORT',1000,'Xuất sản xuất theo kế hoạch #1',1,'2026-06-05 15:10:56'),(22,13,'IMPORT',500,NULL,1,'2026-06-12 07:55:29'),(23,18,'EXPORT',200,'Xuất sản xuất theo kế hoạch #9',1,'2026-06-12 09:19:17'),(24,14,'EXPORT',5,'Xuất sản xuất theo kế hoạch #9',1,'2026-06-12 09:19:17'),(25,16,'EXPORT',100,'Xuất sản xuất theo kế hoạch #9',1,'2026-06-12 09:19:17'),(26,13,'EXPORT',599.5,'Xuất sản xuất theo kế hoạch #11',1,'2026-06-12 09:32:48'),(27,17,'EXPORT',43.6,'Xuất sản xuất theo kế hoạch #11',1,'2026-06-12 09:32:48'),(28,15,'EXPORT',109,'Xuất sản xuất theo kế hoạch #11',1,'2026-06-12 09:32:48'),(29,13,'EXPORT',539,'Xuất sản xuất theo kế hoạch #12',1,'2026-06-12 10:20:38'),(30,17,'EXPORT',39.2,'Xuất sản xuất theo kế hoạch #12',1,'2026-06-12 10:20:38'),(31,15,'EXPORT',98,'Xuất sản xuất theo kế hoạch #12',1,'2026-06-12 10:20:38'),(32,13,'EXPORT',5.5,'Xuất sản xuất theo kế hoạch #13',1,'2026-06-12 10:23:09'),(33,17,'EXPORT',0.4,'Xuất sản xuất theo kế hoạch #13',1,'2026-06-12 10:23:09'),(34,15,'EXPORT',1,'Xuất sản xuất theo kế hoạch #13',1,'2026-06-12 10:23:09'),(35,13,'EXPORT',715,'Xuất sản xuất theo kế hoạch #14',1,'2026-06-12 12:44:39'),(36,17,'EXPORT',52,'Xuất sản xuất theo kế hoạch #14',1,'2026-06-12 12:44:39'),(37,15,'EXPORT',130,'Xuất sản xuất theo kế hoạch #14',1,'2026-06-12 12:44:39'),(38,13,'IMPORT',500,NULL,1,'2026-06-12 12:45:31'),(39,13,'IMPORT',0.01,NULL,1,'2026-06-12 12:45:43'),(40,13,'EXPORT',1,NULL,1,'2026-06-12 12:46:01'),(41,13,'EXPORT',4140.01,NULL,1,'2026-06-12 12:46:11'),(42,13,'IMPORT',1089,'Nhập kho từ yêu cầu MR-202606-001',1,'2026-06-12 13:47:49'),(43,13,'EXPORT',1089,NULL,1,'2026-06-12 13:49:52'),(44,13,'IMPORT',1089,'Nhập kho từ yêu cầu MR-202606-001',1,'2026-06-12 13:50:24'),(45,13,'EXPORT',1089,'Xuất sản xuất theo kế hoạch #22',1,'2026-06-16 11:05:50'),(46,17,'EXPORT',79.2,'Xuất sản xuất theo kế hoạch #22',1,'2026-06-16 11:05:50'),(47,15,'EXPORT',198,'Xuất sản xuất theo kế hoạch #22',1,'2026-06-16 11:05:50'),(48,13,'IMPORT',1089,'Nhập kho từ yêu cầu MR-202606-002',1,'2026-06-16 11:06:37'),(49,18,'EXPORT',100,'Xuất sản xuất theo kế hoạch #21',1,'2026-06-17 08:28:43'),(50,14,'EXPORT',2.5,'Xuất sản xuất theo kế hoạch #21',1,'2026-06-17 08:28:43'),(51,16,'EXPORT',50,'Xuất sản xuất theo kế hoạch #21',1,'2026-06-17 08:28:43'),(52,13,'EXPORT',1089,'Xuất sản xuất theo kế hoạch #19',1,'2026-06-17 08:29:17'),(53,17,'EXPORT',79.2,'Xuất sản xuất theo kế hoạch #19',1,'2026-06-17 08:29:17'),(54,15,'EXPORT',198,'Xuất sản xuất theo kế hoạch #19',1,'2026-06-17 08:29:17');
/*!40000 ALTER TABLE `raw_material_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `raw_materials`
--

DROP TABLE IF EXISTS `raw_materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `raw_materials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `unit` varchar(20) NOT NULL,
  `stock_quantity` float DEFAULT NULL,
  `minimum_stock` float DEFAULT NULL,
  `description` text,
  `created_at` datetime DEFAULT (now()),
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_raw_materials_code` (`code`),
  KEY `ix_raw_materials_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `raw_materials`
--

LOCK TABLES `raw_materials` WRITE;
/*!40000 ALTER TABLE `raw_materials` DISABLE KEYS */;
INSERT INTO `raw_materials` VALUES (13,'NVL-PHOI','Soap base powder','kg',0,1000,'Main detergent ingredient','2026-06-05 13:02:05','2026-06-17 08:29:17'),(14,'NVL-HUONG','Lemon fragrance','liter',92.5,20,'Scent for products','2026-06-05 13:02:05','2026-06-17 08:28:43'),(15,'NVL-BAOBI-6KG','Lix 6kg bag','pcs',8266,2000,'6kg packaging','2026-06-05 13:02:05','2026-06-17 08:29:17'),(16,'NVL-BAOBI-NGIAT','3.8kg Plastic bottle','pcs',4850,1000,'Detergent bottle','2026-06-05 13:02:05','2026-06-17 08:28:43'),(17,'NVL-HOACHAT-A','LAS Surfactant','kg',1306.4,500,'Cleaning agent','2026-06-05 13:02:05','2026-06-17 08:29:17'),(18,'NVL-MUOI','Industrial Salt NaCl','kg',2700,800,'Thickening agent','2026-06-05 13:02:05','2026-06-17 08:28:43');
/*!40000 ALTER TABLE `raw_materials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_role_permission` (`role_id`,`permission_id`),
  KEY `ix_role_permissions_role_id` (`role_id`),
  KEY `ix_role_permissions_permission_id` (`permission_id`),
  KEY `ix_role_permissions_id` (`id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1,1),(2,1,2),(3,1,3),(4,1,4),(5,1,5),(6,1,6),(7,1,7),(8,1,8),(9,1,9),(10,1,10),(11,1,11),(12,1,12),(13,1,13),(14,1,14),(16,2,4),(17,2,5),(18,2,6),(19,2,7),(20,2,8),(21,2,9),(22,2,10),(23,2,11),(24,2,12),(15,3,8);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `ix_roles_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'admin',NULL,'2026-06-05 13:39:48'),(2,'manager',NULL,'2026-06-05 13:39:48'),(3,'sales',NULL,'2026-06-05 13:39:48');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_reports`
--

DROP TABLE IF EXISTS `sales_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_type` varchar(20) DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `total_revenue` float DEFAULT NULL,
  `total_orders` int DEFAULT NULL,
  `created_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `ix_sales_reports_id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_reports`
--

LOCK TABLES `sales_reports` WRITE;
/*!40000 ALTER TABLE `sales_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_suppliers_id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `hashed_password` varchar(255) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `role_id` int DEFAULT NULL,
  `is_active` int DEFAULT NULL,
  `created_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_users_email` (`email`),
  UNIQUE KEY `ix_users_username` (`username`),
  KEY `role_id` (`role_id`),
  KEY `ix_users_id` (`id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','admin@example.com','$2b$12$eQOix3xI.vRJktIJBglpl.7VRagCznJQGmse5UDaeBfipPWsUCoY2','Administrator',1,1,'2026-05-15 10:28:38'),(2,'manager','manager@example.com','$2b$12$iZhynmKIdFAQ0WtaUA0FYelQgDZjAmMpewP.pHFIpEmCptrwa/EEa','Manager',2,1,'2026-05-15 10:28:38'),(3,'sale','sale@example.com','$2b$12$fQP9gVJm7oSwR/aTae.05ej67AGs65SfTzz6uYvywRmEz.e.2cyca','Sales',3,1,'2026-05-15 10:28:38'),(4,'anh','nhatanh9abl1@gmail.com','$2b$12$DG/uB9AXsvopT9RsGoEmQOUJZY5zQITv3OysAKGuUBpSAA./huWAu','NguyenNhatAnh',3,1,'2026-05-15 13:41:48');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-24  4:47:05
