-- =============================================================================
-- Database Schema: Coffee Shop POS System (สัปดาห์ที่ 7)
-- Course: 88734065 การวิเคราะห์และออกแบบระบบ (System Analysis and Design)
-- Database Engine: MySQL 8.0+ / InnoDB
-- Charset: utf8mb4 / Collation: utf8mb4_unicode_ci
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `cafe_pos`
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `cafe_pos`;

-- ปิด Foreign Key Checks ชั่วคราวเพื่อรองรับการ DROP TABLE เดิม (หากมี)
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `stock_movement`;
DROP TABLE IF EXISTS `order_item`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `menu_item`;
DROP TABLE IF EXISTS `employee`;
DROP TABLE IF EXISTS `branch`;
DROP TABLE IF EXISTS `category`;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 1. ตาราง category (หมวดหมู่สินค้า)
-- =============================================================================
CREATE TABLE `category` (
  `category_id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL COMMENT 'ชื่อหมวดหมู่ เช่น กาแฟ, ชา, เบเกอรี่'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. ตาราง branch (สาขาของร้าน)
-- =============================================================================
CREATE TABLE `branch` (
  `branch_id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT 'ชื่อสาขา',
  `address` VARCHAR(255) NULL COMMENT 'ที่อยู่สาขา'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. ตาราง employee (พนักงานร้านกาแฟ: แคชเชียร์, บาริสต้า, ผู้จัดการ)
-- กลยุทธ์ Single-Table Inheritance โดยใช้คอลัมน์ role
-- =============================================================================
CREATE TABLE `employee` (
  `employee_id` INT AUTO_INCREMENT PRIMARY KEY,
  `branch_id` INT NOT NULL COMMENT 'รหัสสาขาที่พนักงานสังกัด',
  `name` VARCHAR(100) NOT NULL COMMENT 'ชื่อ-นามสกุลพนักงาน',
  `role` VARCHAR(20) NOT NULL COMMENT 'ตำแหน่ง เช่น cashier, barista, manager',
  INDEX `idx_employee_branch` (`branch_id`),
  CONSTRAINT `fk_employee_branch` 
    FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. ตาราง menu_item (รายการเมนูเครื่องดื่มและเบเกอรี่)
-- มี branch_id รองรับการบริหารจัดการสต็อกแยกตามสาขา
-- =============================================================================
CREATE TABLE `menu_item` (
  `menu_id` INT AUTO_INCREMENT PRIMARY KEY,
  `branch_id` INT NOT NULL COMMENT 'รหัสสาขาที่วางขาย',
  `category_id` INT NOT NULL COMMENT 'รหัสหมวดหมู่สินค้า',
  `name` VARCHAR(100) NOT NULL COMMENT 'ชื่อเมนู',
  `price` DECIMAL(10,2) NOT NULL COMMENT 'ราคาขายปัจจุบันในแค็ตตาล็อก',
  `stock_quantity` INT NOT NULL DEFAULT 0 COMMENT 'จำนวนคงเหลือในสต็อกของสาขา',
  INDEX `idx_menu_branch` (`branch_id`),
  INDEX `idx_menu_category` (`category_id`),
  CONSTRAINT `fk_menu_branch` 
    FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_menu_category` 
    FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. ตาราง orders (คำสั่งซื้อหลัก)
-- ตัด total_amount ออกเพื่อป้องกัน Update Anomaly และคำนวณสดจาก order_item
-- =============================================================================
CREATE TABLE `orders` (
  `order_id` INT AUTO_INCREMENT PRIMARY KEY,
  `branch_id` INT NOT NULL COMMENT 'สาขาที่เกิดรายการสั่งซื้อ',
  `employee_id` INT NOT NULL COMMENT 'พนักงานแคชเชียร์ผู้รับออเดอร์',
  `payment_method` VARCHAR(20) NOT NULL COMMENT 'วิธีชำระเงิน เช่น cash, transfer, qr',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'วันเวลาที่ทำรายการ',
  INDEX `idx_orders_branch` (`branch_id`),
  INDEX `idx_orders_employee` (`employee_id`),
  INDEX `idx_orders_created_at` (`created_at`),
  CONSTRAINT `fk_orders_branch` 
    FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_employee` 
    FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. ตาราง order_item (รายการสินค้าในออเดอร์ - Associative Entity)
-- unit_price เป็น snapshot ราคา ณ เวลาสั่งซื้อจริง เพื่อความถูกต้องทางประวัติศาสตร์
-- =============================================================================
CREATE TABLE `order_item` (
  `order_item_id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL COMMENT 'รหัสออเดอร์หลัก',
  `menu_id` INT NOT NULL COMMENT 'รหัสเมนูสินค้า',
  `quantity` INT NOT NULL COMMENT 'จำนวนที่สั่งซื้อ',
  `unit_price` DECIMAL(10,2) NOT NULL COMMENT 'ราคาต่อหน่วย ณ เวลาสั่งซื้อ (Price Snapshot)',
  INDEX `idx_order_item_order` (`order_id`),
  INDEX `idx_order_item_menu` (`menu_id`),
  CONSTRAINT `fk_order_item_orders` 
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_order_item_menu` 
    FOREIGN KEY (`menu_id`) REFERENCES `menu_item` (`menu_id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. ตาราง stock_movement (บันทึกประวัติการเคลื่อนไหวสต็อกวัตถุดิบ/สินค้า)
-- =============================================================================
CREATE TABLE `stock_movement` (
  `movement_id` INT AUTO_INCREMENT PRIMARY KEY,
  `menu_id` INT NOT NULL COMMENT 'รหัสเมนูสินค้าที่ตัดสต็อก',
  `quantity_change` INT NOT NULL COMMENT 'จำนวนที่เปลี่ยนแปลง เช่น -1 เมื่อขาย, +50 เมื่อรับเข้า',
  `moved_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'เวลาที่เกิดการเปลี่ยนแปลง',
  INDEX `idx_movement_menu` (`menu_id`),
  CONSTRAINT `fk_movement_menu` 
    FOREIGN KEY (`menu_id`) REFERENCES `menu_item` (`menu_id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Initial Seed Mock Data สำหรับการทดสอบ
-- =============================================================================

-- 1. หมวดหมู่สินค้า
INSERT INTO `category` (`category_id`, `name`) VALUES
  (1, 'กาแฟ (Coffee)'),
  (2, 'ชา (Tea)'),
  (3, 'สมูทตี้ (Smoothie)'),
  (4, 'เบเกอรี่ (Bakery)');

-- 2. ข้อมูลสาขา
INSERT INTO `branch` (`branch_id`, `name`, `address`) VALUES
  (1, 'สาขาบางแสน (Main Campus)', '169 ถ.ลงหาดบางแสน ต.แสนสุข อ.เมือง จ.ชลบุรี 20131'),
  (2, 'สาขาศรีราชา (Sriracha Harbor)', '88 ถ.สุขุมวิท ต.ศรีราชา อ.ศรีราชา จ.ชลบุรี 20110');

-- 3. ข้อมูลพนักงาน
INSERT INTO `employee` (`employee_id`, `branch_id`, `name`, `role`) VALUES
  (1, 1, 'สมชาย สายชง', 'barista'),
  (2, 1, 'สมหญิง ยิ้มหวาน', 'cashier'),
  (3, 1, 'วันชัย จัดการดี', 'manager'),
  (4, 2, 'สมศักดิ์ มือโปร', 'barista'),
  (5, 2, 'กัญญา รับทรัพย์', 'cashier');

-- 4. ข้อมูลเมนูสินค้า (แยกตามสาขา)
INSERT INTO `menu_item` (`menu_id`, `branch_id`, `category_id`, `name`, `price`, `stock_quantity`) VALUES
  -- สาขา 1 (บางแสน)
  (1, 1, 1, 'เอสเพรสโซ (Espresso)', 45.00, 100),
  (2, 1, 1, 'อเมริกาโน่เย็น (Iced Americano)', 50.00, 100),
  (3, 1, 1, 'ลาเต้เย็น (Iced Latte)', 60.00, 80),
  (4, 1, 2, 'ชาไทยเย็น (Thai Milk Tea)', 50.00, 90),
  (5, 1, 2, 'ชาเขียวมัทฉะ (Matcha Latte)', 65.00, 60),
  (6, 1, 4, 'ครัวซองต์เนยสด (Butter Croissant)', 55.00, 30),
  -- สาขา 2 (ศรีราชา)
  (7, 2, 1, 'เอสเพรสโซ (Espresso)', 45.00, 80),
  (8, 2, 1, 'อเมริกาโน่เย็น (Iced Americano)', 50.00, 80),
  (9, 2, 1, 'ลาเต้เย็น (Iced Latte)', 60.00, 70),
  (10, 2, 2, 'ชาไทยเย็น (Thai Milk Tea)', 50.00, 85);

-- 5. ตัวอย่างข้อมูลออเดอร์
INSERT INTO `orders` (`order_id`, `branch_id`, `employee_id`, `payment_method`, `created_at`) VALUES
  (1, 1, 2, 'cash', '2026-10-02 09:15:00'),
  (2, 1, 2, 'qr', '2026-10-02 09:30:00');

-- 6. ตัวอย่างรายการสินค้าในออเดอร์
INSERT INTO `order_item` (`order_item_id`, `order_id`, `menu_id`, `quantity`, `unit_price`) VALUES
  (1, 1, 2, 2, 50.00), -- อเมริกาโน่เย็น 2 แก้ว @ 50 = 100.00
  (2, 1, 6, 1, 55.00), -- ครัวซองต์ 1 ชิ้น @ 55 = 55.00
  (3, 2, 3, 1, 60.00), -- ลาเต้เย็น 1 แก้ว @ 60 = 60.00
  (4, 2, 5, 1, 65.00); -- ชาเขียวมัทฉะ 1 แก้ว @ 65 = 65.00

-- 7. บันทึกตัดสต็อกจากการขาย
INSERT INTO `stock_movement` (`movement_id`, `menu_id`, `quantity_change`, `moved_at`) VALUES
  (1, 2, -2, '2026-10-02 09:15:00'),
  (2, 6, -1, '2026-10-02 09:15:00'),
  (3, 3, -1, '2026-10-02 09:30:00'),
  (4, 5, -1, '2026-10-02 09:30:00');
