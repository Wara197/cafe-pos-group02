// src/controllers/orderController.js (หลังแยก Model)
const orderModel = require("../models/orderModel");

const VALID_PAYMENT_METHODS = ["cash", "credit", "qr"];

exports.createOrder = async (req, res) => {
  const { items, paymentMethod } = req.body;

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

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

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
