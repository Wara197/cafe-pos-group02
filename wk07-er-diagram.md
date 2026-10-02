# เอกสารออกแบบ ER Diagram ระบบร้านกาแฟ (Coffee Shop POS System)

**รายวิชา:** 88734065 การวิเคราะห์และออกแบบระบบ (System Analysis and Design)  
**กิจกรรม:** Workshop สัปดาห์ที่ 7 ข้อ 1 และ 2

---

## 1. แผนภาพ Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    BRANCH ||--o{ EMPLOYEE : employs
    BRANCH ||--o{ MENU_ITEM : manages
    BRANCH ||--o{ ORDERS : places_at
    CATEGORY ||--o{ MENU_ITEM : categorizes
    EMPLOYEE ||--o{ ORDERS : creates
    ORDERS ||--o{ ORDER_ITEM : contains
    MENU_ITEM ||--o{ ORDER_ITEM : "ordered in"
    MENU_ITEM ||--o{ STOCK_MOVEMENT : tracks

    CATEGORY {
        int category_id PK "รหัสหมวดหมู่"
        string name "ชื่อหมวดหมู่สินค้า"
    }

    BRANCH {
        int branch_id PK "รหัสสาขา"
        string name "ชื่อสาขา"
        string address "ที่อยู่สาขา"
    }

    EMPLOYEE {
        int employee_id PK "รหัสพนักงาน"
        int branch_id FK "รหัสสาขาที่สังกัด"
        string name "ชื่อ-นามสกุลพนักงาน"
        string role "ตำแหน่ง (barista, cashier, manager)"
    }

    MENU_ITEM {
        int menu_id PK "รหัสเมนูสินค้า"
        int branch_id FK "รหัสสาขาที่วางขาย"
        int category_id FK "รหัสหมวดหมู่สินค้า"
        string name "ชื่อเมนูสินค้า"
        decimal price "ราคาขายปัจจุบันในแค็ตตาล็อก"
        int stock_quantity "จำนวนสต็อกคงเหลือในสาขา"
    }

    ORDERS {
        int order_id PK "รหัสคำสั่งซื้อ"
        int branch_id FK "สาขาที่สั่งซื้อ"
        int employee_id FK "พนักงานแคชเชียร์ผู้รับออเดอร์"
        string payment_method "วิธีการชำระเงิน (cash, transfer, qr)"
        datetime created_at "วันเวลาที่สั่งซื้อ"
    }

    ORDER_ITEM {
        int order_item_id PK "รหัสรายการสินค้าในออเดอร์"
        int order_id FK "รหัสออเดอร์หลัก"
        int menu_id FK "รหัสเมนูสินค้า"
        int quantity "จำนวนชิ้น/แก้วที่สั่ง"
        decimal unit_price "ราคาต่อหน่วย ณ เวลาสั่งซื้อ (Snapshot)"
    }

    STOCK_MOVEMENT {
        int movement_id PK "รหัสการเคลื่อนไหวสต็อก"
        int menu_id FK "รหัสเมนูสินค้า"
        int quantity_change "จำนวนที่เปลี่ยนแปลง (+/-)"
        datetime moved_at "วันเวลาที่เกิดรายการ"
    }
```

---

## 2. ตารางสรุปรายละเอียด Entity, Primary Key, Foreign Key และ Attribute

| Entity               | Primary Key (PK) | Foreign Key (FK)                                       | Attributes อื่นๆ                  | หน้าที่ในระบบ                                                                           |
| :------------------- | :--------------- | :----------------------------------------------------- | :-------------------------------- | :-------------------------------------------------------------------------------------- |
| **`CATEGORY`**       | `category_id`    | -                                                      | `name`                            | แยกประเภทสินค้า (กาแฟ, ชา, เบเกอรี่) เพื่อผ่าน 3NF                                      |
| **`BRANCH`**         | `branch_id`      | -                                                      | `name`, `address`                 | รองรับระบบหลายสาขาตามขอบเขตโครงงาน                                                      |
| **`EMPLOYEE`**       | `employee_id`    | `branch_id` -> `BRANCH`                                | `name`, `role`                    | เก็บข้อมูลพนักงาน (ใช้ Single-table สำหรับ Barista, Cashier)                            |
| **`MENU_ITEM`**      | `menu_id`        | `branch_id` -> `BRANCH`<br>`category_id` -> `CATEGORY` | `name`, `price`, `stock_quantity` | รายการเมนูและสต็อกคงเหลือแยกรายสาขา                                                     |
| **`ORDERS`**         | `order_id`       | `branch_id` -> `BRANCH`<br>`employee_id` -> `EMPLOYEE` | `payment_method`, `created_at`    | หัวคำสั่งซื้อหลัก (ไม่เก็บ total_amount เพราะเป็น derived value ป้องกัน update anomaly) |
| **`ORDER_ITEM`**     | `order_item_id`  | `order_id` -> `ORDERS`<br>`menu_id` -> `MENU_ITEM`     | `quantity`, `unit_price`          | Associative Entity แก้ความสัมพันธ์ M:N และเก็บ snapshot ราคา                            |
| **`STOCK_MOVEMENT`** | `movement_id`    | `menu_id` -> `MENU_ITEM`                               | `quantity_change`, `moved_at`     | Audit Log ตรวจสอบการเพิ่ม/ลดสต็อกย้อนหลัง                                               |

---

## 3. รายละเอียดความสัมพันธ์และ Cardinality

1. **`BRANCH` (1) — (N) `EMPLOYEE` (One-to-Many):**  
   หนึ่งสาขามีพนักงานปฏิบัติงานได้หลายคน พนักงานแต่ละคนสังกัดสาขาได้เพียงหนึ่งแห่ง
2. **`BRANCH` (1) — (N) `MENU_ITEM` (One-to-Many):**  
   หนึ่งสาขามีรายการเมนูและสต็อกสินค้าหลายรายการ สินค้าแต่ละแถวระบุจำนวนสต็อกเฉพาะสาขานั้น
3. **`BRANCH` (1) — (N) `ORDERS` (One-to-Many):**  
   หนึ่งสาขามีรายการออเดอร์เกิดขึ้นได้หลายรายการ
4. **`CATEGORY` (1) — (N) `MENU_ITEM` (One-to-Many):**  
   หนึ่งหมวดหมู่สินค้ามีเมนูบรรจุอยู่ได้หลายเมนู แต่ละเมนูจัดอยู่ในหมวดหมู่เดียว
5. **`EMPLOYEE` (1) — (N) `ORDERS` (One-to-Many):**  
   พนักงานแคชเชียร์หนึ่งคนสามารถสร้างและบันทึกออเดอร์ได้หลายรายการ
6. **`ORDERS` (1) — (N) `ORDER_ITEM` (One-to-Many / Composition):**  
   ออเดอร์หนึ่งรายการประกอบด้วยรายการสินค้าหลายรายการ หากลบออเดอร์ รายการย่อยใน `ORDER_ITEM` จะถูกลบตามไปด้วย (`ON DELETE CASCADE`)
7. **`MENU_ITEM` (1) — (N) `ORDER_ITEM` (One-to-Many / Aggregation):**  
   เมนูสินค้าหนึ่งรายการสามารถถูกอ้างอิงในรายการสั่งซื้อของลูกค้าได้หลายออเดอร์
8. **`MENU_ITEM` (1) — (N) `STOCK_MOVEMENT` (One-to-Many):**  
   เมนูสินค้าหนึ่งรายการมีประวัติการเข้า-ออกของสต็อกได้หลายครั้ง
