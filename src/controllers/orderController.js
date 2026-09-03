// src/controllers/orderController.js (ปรับปรุงจาก Sprint 1 ให้ใช้ class Order/OrderItem)
const orderModel = require("../models/orderModel");
const { Order } = require("../models/Order");

const VALID_PAYMENT_METHODS = ["cash", "credit", "qr"];

exports.createOrder = async (req, res) => {
  const { items, paymentMethod } = req.body;

  // ... validation เหมือนเดิมทุกจุดตาม wk05.md หัวข้อ 1.4 ...
  if (!Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ error: "ต้องมีรายการสินค้าอย่างน้อย 1 รายการ" });
  }
  const hasInvalidName = items.some(
    (item) => typeof item.name !== "string" || item.name.trim() === "",
  );
  if (hasInvalidName) {
    return res.status(400).json({ error: "ต้องระบุชื่อสินค้าให้ครบทุกรายการ" });
  }
  const hasInvalidPrice = items.some(
    (item) => !Number.isFinite(item.price) || item.price <= 0,
  );
  if (hasInvalidPrice) {
    return res.status(400).json({ error: "price ต้องมากกว่า 0" });
  }
  const hasInvalidQuantity = items.some(
    (item) => !Number.isInteger(item.quantity) || item.quantity <= 0,
  );
  if (hasInvalidQuantity) {
    return res.status(400).json({ error: "quantity ต้องมากกว่า 0" });
  }
  if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    return res
      .status(400)
      .json({ error: "paymentMethod ไม่ถูกต้องหรือไม่ได้ระบุ" });
  }

  const order = new Order(paymentMethod);
  // ยังไม่มี MenuItem class จริง (ตามหัวข้อ 2.3 เป็นตัวเลือกเสริม) จึงส่ง item
  // ที่รับมาจาก request body โดยตรงเข้า addItem() แทน MenuItem instance ไปก่อน
  // เพราะ item นั้นมี field "price" อยู่แล้วซึ่งพอสำหรับ OrderItem ใช้คำนวณ
  items.forEach((item) => order.addItem(item, item.quantity));

  if (!order.submit()) {
    return res
      .status(400)
      .json({ error: "ต้องมีรายการสินค้าอย่างน้อย 1 รายการ" });
  }

  const totalAmount = order.calculateTotal(); // แทนที่ items.reduce(...) เดิม

  try {
    // Controller ไม่มีคำสั่ง SQL หลงเหลืออยู่เลย เรียกผ่าน Model แทน
    const orderId = await orderModel.create(paymentMethod, totalAmount);
    res.status(201).json({ orderId, totalAmount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการบันทึกออเดอร์" });
  }
};

exports.getAllOrders = async (req, res) => {
  const orders = await orderModel.findAll();
  res.json(orders);
};
