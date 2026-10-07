# AI Disclosure — Coding Sprint 2 (สัปดาห์ที่ 9)

**กลุ่ม:** cafe-pos-group02

## Diagram/Requirement ต้นทาง

- Use Case Diagram สัปดาห์ที่ 4: Use Case “รับออเดอร์และคำนวณราคา”, “เลือกเมนู/ตัวเลือก”, “บันทึกวิธีชำระเงิน”, “ตัดสต็อกอัตโนมัติ” และ “แจ้งเตือนสต็อกใกล้หมด”
- Data design สัปดาห์ที่ 7: `menu_item`, `orders`, `order_item`, `stock_movement`; ราคา snapshot ใน `order_item.unit_price`; สาขาผ่าน `branch_id`
- Sequence Diagram และ Flowchart: `wk09-workshop.md` และภาพ `wk09-sequence-diagram.png`

## การใช้ AI

- ใช้ AI ช่วยตรวจเอกสาร/โค้ดต้นทาง, ร่าง Sequence Diagram และ Flowchart, ปรับโครงสร้าง Express MVC, สร้าง CRUD เมนูและ order transaction, และจัดทำ test plan/เอกสารประกอบ
- ผู้ใช้เป็นผู้กำหนดระบบร้านกาแฟและให้ไฟล์ Use Case, Schema, ER Diagram และโค้ดเดิมเป็นข้อมูลต้นทาง
- ไฟล์ที่ AI ช่วยสร้าง/ปรับในชุดนี้: `src/app.js`, `src/config/db.js`, `src/controllers/*`, `src/models/*`, `src/routes/*`, `src/utils/validate.js`, `package.json`, `README.md`, `wk09-workshop.md`, `wk09-sequence-diagram.png` และ disclosure นี้
- ผู้จัดทำต้องตรวจโค้ด, รันกับ MySQL ของกลุ่ม, ทำ test cases, บันทึกผลจริง และอธิบายการทำงานได้ก่อนส่ง

## ความแตกต่างจาก Diagram/โค้ดเดิมและเหตุผล

โค้ด Sprint 1 ที่ให้มาตรวจรับ `price` จาก request และบันทึก `total_amount` ใน `orders` ซึ่งไม่ตรงกับ schema สัปดาห์ 7 ที่ไม่มีคอลัมน์ดังกล่าวและกำหนด snapshot ราคาใน `order_item` จึงปรับ API ให้รับเฉพาะ `menuId`/`quantity`, อ่านราคาในฐานข้อมูล และบันทึก `order_item` ตาม schema ใหม่ เพิ่ม transaction/row lock เพื่อให้การสร้างออเดอร์และการเปลี่ยนสต็อกเป็นหน่วยงานเดียว และเพิ่ม `branchId` ใน CRUD เมนูพร้อมใส่เงื่อนไขสาขาใน SQL เพื่อป้องกันการเข้าถึงเมนูข้ามสาขา

รอบตรวจทานเพิ่มเติม: ปรับ validation ให้รับเฉพาะ number/ตัวเลขใน string (ปฏิเสธ `true`/`null`/array), รับ `categoryId`/`stockQuantity` ตามโจทย์ควบคู่กับ snake_case, ไม่ส่ง `e.message` ของ error ฐานข้อมูลกลับ client, คำนวณ `totalAmount` เป็นสตางค์เพื่อเลี่ยงเศษทศนิยม และตรวจ `affectedRows` ตอนตัดสต็อก (rollback หากหักไม่สำเร็จ) ให้ JSON ที่ผิดรูปแบบตอบ 400 แทน 500 ใน `src/app.js` โดยลำดับ flow ยังตรงกับ Sequence Diagram เดิม

Use Case ระบุให้แจ้งเตือนสต็อกต่ำ; ใน Sprint 2 implementation นี้ response ส่ง `lowStockMenuIds` ให้ POS แสดงคำเตือน ส่วนการส่งอีเมล/notification จริงอยู่นอกขอบเขตตามเอกสารสัปดาห์ 9
