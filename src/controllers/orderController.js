const OrderModel = require("../models/orderModel");
const { positiveInt } = require("../utils/validate");

const PAYMENTS = new Set(["cash", "transfer", "qr"]);

exports.createOrder = async (req, res) => {
  const b = req.body || {},
    { items, paymentMethod } = b;
  const branchId = positiveInt(b.branchId),
    employeeId = positiveInt(b.employeeId);
  // ตรวจ input ทั้งหมดก่อนเข้า Model (alt ชั้นนอกใน Sequence Diagram)
  // หมายเหตุ: ไม่อ่าน unitPrice/price/totalAmount จาก body เลย — ราคามาจากฐานข้อมูลเท่านั้น
  if (
    !branchId ||
    !employeeId ||
    !PAYMENTS.has(paymentMethod) ||
    !Array.isArray(items) ||
    !items.length ||
    items.some((i) => !positiveInt(i?.menuId) || !positiveInt(i?.quantity))
  ) {
    return res
      .status(400)
      .json({
        error:
          "ข้อมูลออเดอร์ไม่ถูกต้อง: ตรวจ branchId, employeeId, paymentMethod (cash/transfer/qr) และ menuId/quantity เป็นจำนวนเต็มบวก",
      });
  }
  try {
    const result = await OrderModel.create({
      branchId,
      employeeId,
      paymentMethod,
      items: items.map((i) => ({
        menuId: positiveInt(i.menuId),
        quantity: positiveInt(i.quantity),
      })),
    });
    res.status(201).json(result);
  } catch (e) {
    console.error(e);
    // ส่งข้อความกลับ client เฉพาะ error ที่ Model ตั้งใจโยน (มี e.status) เช่น สต็อกไม่พอ
    // error จากฐานข้อมูลห้ามส่ง e.message ตรง ๆ เพราะเปิดเผยชื่อตาราง/constraint
    if (e.status) return res.status(e.status).json({ error: e.message });
    if (e.code === "ER_NO_REFERENCED_ROW_2")
      return res.status(400).json({ error: "ไม่พบสาขาหรือพนักงานที่ระบุ" });
    res.status(500).json({ error: "บันทึกออเดอร์ไม่สำเร็จ" });
  }
};

exports.listOrders = async (req, res) => {
  const branchId = positiveInt(req.query.branchId);
  if (!branchId)
    return res
      .status(400)
      .json({ error: "ต้องระบุ branchId เป็นจำนวนเต็มบวก" });
  try {
    res.json(await OrderModel.findAll(branchId));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "ดึงรายการออเดอร์ไม่สำเร็จ" });
  }
};
