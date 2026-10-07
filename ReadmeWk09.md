# Coffee Shop POS — Workshop สัปดาห์ที่ 9

1. ใช้ MySQL แล้วนำ `wk07-schema.sql` เข้าเฉพาะฐานข้อมูลว่าง/ทดสอบ: สคริปต์ต้นฉบับมี `DROP TABLE` และลบตารางเดิมก่อนสร้างใหม่ ห้ามรันกับฐานข้อมูลที่มีข้อมูลต้องเก็บ
2. คัดลอก `.env.example` เป็น `.env` แล้วตั้งค่าการเชื่อมต่อ MySQL
3. รัน `npm install` และ `npm start`

API เมนู: `GET /api/menu?branchId=1`, `GET /api/menu/:id?branchId=1`, `POST /api/menu` (ระบุ `branchId` ใน body), `PUT/DELETE /api/menu/:id?branchId=1` (POST/PUT รับ `categoryId, name, price, stockQuantity` ครบ; รองรับชื่อแบบ `category_id, stock_quantity` ด้วย) — `DELETE` จะตอบ 409 หากเมนูมีประวัติออเดอร์หรือ stock_movement อ้างอิงอยู่ (เมนูที่สร้างด้วยสต็อกเริ่มต้น > 0 จะมี movement จึงลบไม่ได้ ถ้าต้องการ demo การลบให้สร้างเมนูด้วย `stockQuantity: 0`)

API ออเดอร์: `POST /api/orders` รับ `{ "branchId": 1, "employeeId": 2, "paymentMethod": "cash", "items": [{ "menuId": 3, "quantity": 1 }] }`; `GET /api/orders?branchId=1`.

ระบบใช้ราคาในฐานข้อมูล ไม่เชื่อราคาจาก client และบันทึก order, order_item, stock deduction และ stock_movement ใน transaction เดียว; การตั้งสต็อกตอนเพิ่ม/แก้เมนูจะบันทึก movement ด้วย

ก่อนส่ง ให้เติมข้อมูลกลุ่ม/สมาชิก, แนบภาพผลทดสอบจากเครื่องกลุ่ม และใส่ repository URL/commit หลัง push งานเข้าคลังของกลุ่ม
