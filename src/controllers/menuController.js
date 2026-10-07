const MenuModel = require("../models/menuModel");
const { positiveInt, nonNegativeInt, priceValue, pick } = require("../utils/validate");

// แปลง body เป็นข้อมูลเมนูที่ตรวจแล้ว (PUT/POST ต้องส่งครบทุกฟิลด์) คืน null เมื่อไม่ผ่าน
// รับได้ทั้ง categoryId/stockQuantity (ตามโจทย์ wk09) และ category_id/stock_quantity
const parseMenu = (b) => {
  const category_id = positiveInt(pick(b, "categoryId", "category_id"));
  const stock_quantity = nonNegativeInt(pick(b, "stockQuantity", "stock_quantity"));
  const price = priceValue(b.price);
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (category_id === null || stock_quantity === null || price === null || !name || name.length > 100) return null;
  return { category_id, name, price, stock_quantity };
};

const MENU_FIELDS_MSG = "ต้องระบุ categoryId, name (ไม่เกิน 100 ตัวอักษร), price > 0 (ทศนิยมไม่เกิน 2 ตำแหน่ง) และ stockQuantity >= 0";

exports.listMenu = async (req, res) => {
  const branchId = positiveInt(req.query.branchId);
  if (!branchId) return res.status(400).json({ error: "ต้องระบุ branchId เป็นจำนวนเต็มบวก" });
  try { res.json(await MenuModel.findAll(branchId)); }
  catch (e) { console.error(e); res.status(500).json({ error: "ดึงรายการเมนูไม่สำเร็จ" }); }
};

exports.getMenu = async (req, res) => {
  const branchId = positiveInt(req.query.branchId), menuId = positiveInt(req.params.id);
  if (!branchId || !menuId) return res.status(400).json({ error: "ต้องระบุ menuId และ branchId ที่ถูกต้อง" });
  try {
    const row = await MenuModel.findById(menuId, branchId);
    if (!row) return res.status(404).json({ error: "ไม่พบเมนูในสาขานี้" });
    res.json(row);
  } catch (e) { console.error(e); res.status(500).json({ error: "ดึงข้อมูลเมนูไม่สำเร็จ" }); }
};

exports.createMenu = async (req, res) => {
  const b = req.body || {}, branchId = positiveInt(b.branchId), menu = parseMenu(b);
  if (!branchId || !menu) return res.status(400).json({ error: `ต้องระบุ branchId; ${MENU_FIELDS_MSG}` });
  try {
    const row = await MenuModel.create({ branch_id: branchId, ...menu });
    res.status(201).json(row);
  } catch (e) {
    console.error(e);
    const fk = e.code === "ER_NO_REFERENCED_ROW_2";
    res.status(fk ? 400 : 500).json({ error: fk ? "ไม่พบสาขาหรือหมวดหมู่" : "เพิ่มเมนูไม่สำเร็จ" });
  }
};

exports.updateMenu = async (req, res) => {
  const branchId = positiveInt(req.query.branchId), menuId = positiveInt(req.params.id), menu = parseMenu(req.body || {});
  if (!branchId || !menuId || !menu) return res.status(400).json({ error: `ต้องระบุ branchId ใน query และส่งข้อมูลเมนูครบ: ${MENU_FIELDS_MSG}` });
  try {
    const count = await MenuModel.update(menuId, branchId, menu);
    if (!count) return res.status(404).json({ error: "ไม่พบเมนูในสาขานี้" });
    res.json({ updated: true });
  } catch (e) {
    console.error(e);
    const fk = e.code === "ER_NO_REFERENCED_ROW_2";
    res.status(fk ? 400 : 500).json({ error: fk ? "ไม่พบหมวดหมู่ที่ระบุ" : "แก้ไขเมนูไม่สำเร็จ" });
  }
};

exports.deleteMenu = async (req, res) => {
  const branchId = positiveInt(req.query.branchId), menuId = positiveInt(req.params.id);
  if (!branchId || !menuId) return res.status(400).json({ error: "ต้องระบุ menuId และ branchId ที่ถูกต้อง" });
  try {
    const count = await MenuModel.remove(menuId, branchId);
    if (!count) return res.status(404).json({ error: "ไม่พบเมนูในสาขานี้" });
    res.json({ deleted: true });
  } catch (e) {
    console.error(e);
    const referenced = e.code === "ER_ROW_IS_REFERENCED_2";
    res.status(referenced ? 409 : 500).json({
      error: referenced
        ? "ลบไม่ได้เนื่องจากมีประวัติการสั่งซื้อหรือการเคลื่อนไหวสต็อกอ้างอิงเมนูนี้"
        : "ลบเมนูไม่สำเร็จ",
    });
  }
};
