# AI Disclosure Form เพิ่มเติมสำหรับ Coding Sprint — wk05

**กลุ่ม:** cafe-pos-group02

---

## 1. Diagram ต้นทางของ Sprint นี้

Use Case ที่ implement: **"รับออเดอร์และคำนวณราคา"** (`POST /api/orders`)
อ้างอิงจาก Use Case Diagram และ Acceptance Criteria ในไฟล์ `wk04-user-stories.md` ของกลุ่ม

---

## 2. ส่วนที่ใช้ AI ช่วย (เฉพาะ Database + Postman)

| งาน                           | AI ช่วยอะไร                                                                                                                     | สิ่งที่ทีมตรวจสอบ/ปรับเอง                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| เขียน `src/config/db.js`      | สร้าง connection pool ด้วย `mysql2/promise` ตามโครงสร้างในหัวข้อ 2.2                                                            | เทียบกับเอกสารต้นฉบับ ตรงกันทุกบรรทัด                                                       |
| ออกแบบ `CREATE TABLE orders`  | ยืนยันโครงสร้างคอลัมน์ตามหัวข้อ 2.3 (`payment_method`, `total_amount`, `created_at`)                                            | รันคำสั่งจริงผ่าน MySQL Command Line Client และตรวจด้วย `SHOW TABLES;` / `DESCRIBE orders;` |
| Debug ปัญหาเชื่อมต่อไม่สำเร็จ | วิเคราะห์ error `ER_ACCESS_DENIED_ERROR` (user/password ว่างเปล่า) และชี้จุดที่ขาด `require("dotenv").config()` ใน `src/app.js` | ทดสอบรันจริงหลังแก้ไข ยืนยันว่าเชื่อมต่อสำเร็จก่อนไปขั้นตอนถัดไป                            |
| ออกแบบชุดทดสอบ Postman        | แนะนำ request body ตัวอย่างสำหรับ happy path และกรณี validation ผิดพลาด (payment method ผิด, price ติดลบ, items ว่าง ฯลฯ)       | รันจริงทุกเคสผ่าน Postman และตรวจ response/status code ด้วยตนเอง                            |

---

## 3. ปัญหาที่พบระหว่างทางและวิธีแก้ (Log จริง)

1. **`ER_ACCESS_DENIED_ERROR: Access denied for user ''@'localhost' (using password: NO)`** — สาเหตุคือไฟล์ `src/app.js` ไม่ได้เรียก `require("dotenv").config()` ทำให้ `process.env.DB_USER`/`DB_PASSWORD` เป็นค่าว่างตอนสร้าง pool ใน `db.js` แก้โดยเพิ่มบรรทัดนี้เป็นบรรทัดแรกสุดของ `app.js`
2. **MySQL Installer แจ้ง "port already in use"** ระหว่างติดตั้งใหม่ (ลบ MySQL เดิมแล้วลงใหม่) — เป็น X Protocol Port (33060) ชนกับ instance เก่าที่ยังไม่ถูกล้างสมบูรณ์ แก้โดยเปลี่ยนเลข X Protocol Port เป็นค่าอื่น (TCP/IP หลัก 3306 ไม่กระทบ)

---

## 4. ผลการทดสอบ (สอดคล้องกับ Workshop ข้อ 5)

- ทดสอบ `POST /api/orders` ด้วย Postman กรณี happy path → **201 Created** พร้อม `{ "orderId": 1, "totalAmount": 125 }` ตรงตาม Response format ที่ wk05.md กำหนด (หัวข้อ 1.4)
- ทดสอบกรณี validation (items ว่าง, name ว่าง, price ติดลบ, paymentMethod ไม่ถูกต้อง) → ได้ **400 Bad Request** พร้อมข้อความ error ตรงตาม Acceptance Criteria ของ US-02/US-03 ทุกข้อ
- ยืนยันด้วย `SELECT * FROM orders;` ใน MySQL ว่าข้อมูลถูกบันทึกจริงตรงกับค่าที่คำนวณ

---
