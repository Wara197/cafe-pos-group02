/**
 * menuModel.js - Data Access Model สำหรับตาราง menu_item
 * สอดคล้องกับ schema.sql และ ER Diagram ตามหลักการใน wk07.md หัวข้อ 4.2 - 4.4
 *
 * ตรวจสอบความสอดคล้อง (Checklist 4.4):
 * - ทุก field ตรงกับ column ใน schema.sql:
 *   [menu_id, branch_id, category_id, name, price, stock_quantity]
 */

const db = require("./db"); // รองรับ connection pool

class MenuItemModel {
  /**
   * ดึงรายการเมนูทั้งหมด พร้อมข้อมูลหมวดหมู่และสาขา (JOIN เพื่อแสดงผล)
   */
  static async findAll() {
    const sql = `
      SELECT 
        m.menu_id,
        m.branch_id,
        b.name AS branch_name,
        m.category_id,
        c.name AS category_name,
        m.name,
        m.price,
        m.stock_quantity
      FROM menu_item m
      JOIN category c ON m.category_id = c.category_id
      JOIN branch b ON m.branch_id = b.branch_id
      ORDER BY m.branch_id ASC, m.category_id ASC, m.menu_id ASC
    `;
    const [rows] = await db.query(sql);
    return rows;
  }

  /**
   * ดึงรายการเมนูเฉพาะสาขาที่กำหนด
   * @param {number} branchId
   */
  static async findByBranch(branchId) {
    const sql = `
      SELECT 
        m.menu_id,
        m.branch_id,
        m.category_id,
        c.name AS category_name,
        m.name,
        m.price,
        m.stock_quantity
      FROM menu_item m
      JOIN category c ON m.category_id = c.category_id
      WHERE m.branch_id = ?
      ORDER BY m.category_id ASC, m.name ASC
    `;
    const [rows] = await db.query(sql, [branchId]);
    return rows;
  }

  /**
   * ค้นหาเมนูตาม menu_id
   * @param {number} menuId
   */
  static async findById(menuId) {
    const sql = `
      SELECT 
        m.menu_id,
        m.branch_id,
        m.category_id,
        c.name AS category_name,
        m.name,
        m.price,
        m.stock_quantity
      FROM menu_item m
      JOIN category c ON m.category_id = c.category_id
      WHERE m.menu_id = ?
    `;
    const [rows] = await db.query(sql, [menuId]);
    return rows[0] || null;
  }

  /**
   * เพิ่มเมนูใหม่ลงในสาขา
   * @param {Object} data { branch_id, category_id, name, price, stock_quantity }
   */
  static async create({ branch_id, category_id, name, price, stock_quantity = 0 }) {
    const sql = `
      INSERT INTO menu_item (branch_id, category_id, name, price, stock_quantity)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [branch_id, category_id, name, price, stock_quantity]);
    return {
      menu_id: result.insertId,
      branch_id,
      category_id,
      name,
      price,
      stock_quantity
    };
  }

  /**
   * ปรับปรุงข้อมูลเมนู (ชื่อ, ราคา)
   * @param {number} menuId
   * @param {Object} updateData { name, price, category_id }
   */
  static async update(menuId, { name, price, category_id }) {
    const sql = `
      UPDATE menu_item
      SET name = ?, price = ?, category_id = ?
      WHERE menu_id = ?
    `;
    const [result] = await db.query(sql, [name, price, category_id, menuId]);
    return result.affectedRows > 0;
  }

  /**
   * ปรับปรุงยอดสต็อกคงเหลือ และบันทึก stock_movement
   * @param {number} menuId
   * @param {number} quantityChange เช่น -1 (เมื่อขาย) หรือ +50 (เมื่อรับของ)
   */
  static async updateStock(menuId, quantityChange, connection = null) {
    const client = connection || db;
    
    // อัปเดต stock_quantity ใน menu_item
    const updateSql = `
      UPDATE menu_item 
      SET stock_quantity = stock_quantity + ?
      WHERE menu_id = ?
    `;
    await client.query(updateSql, [quantityChange, menuId]);

    // บันทึกประวัติใน stock_movement
    const movementSql = `
      INSERT INTO stock_movement (menu_id, quantity_change, moved_at)
      VALUES (?, ?, NOW())
    `;
    await client.query(movementSql, [menuId, quantityChange]);
  }
}

module.exports = MenuItemModel;
