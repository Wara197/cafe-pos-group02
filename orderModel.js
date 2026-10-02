/**
 * orderModel.js - Data Access Model สำหรับตาราง orders และ order_item
 * สอดคล้องกับ schema.sql และ ER Diagram ตามหลักการใน wk07.md หัวข้อ 4.2 - 4.4
 *
 * ตรวจสอบความสอดคล้อง (Checklist 4.4):
 * - ตาราง orders: [order_id, branch_id, employee_id, payment_method, created_at]
 * - ตาราง order_item: [order_item_id, order_id, menu_id, quantity, unit_price]
 * - หมายเหตุสำคัญ: ไม่มี column "total_amount" ในตาราง orders เพราะเป็น derived value (หลักออกแบบที่ดี เพื่อป้องกัน update anomaly)
 *   ยอดรวมคำนวณสดด้วย SUM(quantity * unit_price) ผ่าน JOIN ทุกครั้งที่ query
 */

const db = require("./db"); // รองรับ connection pool
class OrderModel {
  /**
   * สร้างออเดอร์ใหม่พร้อมรายการสินค้า (Transactional Create)
   * บันทึกลงตาราง orders และ order_item พร้อมตัดสต็อกและบันทึก stock_movement
   *
   * @param {Object} orderData
   * @param {number} orderData.branch_id
   * @param {number} orderData.employee_id
   * @param {string} orderData.payment_method
   * @param {Array<{menu_id: number, quantity: number, unit_price: number}>} orderData.items
   */
  static async create({ branch_id, employee_id, payment_method, items }) {
    if (!items || items.length === 0) {
      throw new Error("ต้องมีรายการสินค้าอย่างน้อย 1 รายการ");
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. บันทึกลงตาราง orders (ไม่มี total_amount ตาม 3NF)
      const insertOrderSql = `
        INSERT INTO orders (branch_id, employee_id, payment_method, created_at)
        VALUES (?, ?, ?, NOW())
      `;
      const [orderResult] = await connection.query(insertOrderSql, [
        branch_id,
        employee_id,
        payment_method,
      ]);
      const orderId = orderResult.insertId;

      // 2. บันทึกแต่ละรายการลงตาราง order_item พร้อม snapshot ราคา (unit_price)
      let calculatedTotal = 0;
      for (const item of items) {
        const itemSubtotal = Number(item.unit_price) * Number(item.quantity);
        calculatedTotal += itemSubtotal;

        const insertItemSql = `
          INSERT INTO order_item (order_id, menu_id, quantity, unit_price)
          VALUES (?, ?, ?, ?)
        `;
        await connection.query(insertItemSql, [
          orderId,
          item.menu_id,
          item.quantity,
          item.unit_price,
        ]);

        // 3. ตัดสต็อกสินค้าในสาขา
        const updateStockSql = `
          UPDATE menu_item 
          SET stock_quantity = stock_quantity - ?
          WHERE menu_id = ?
        `;
        await connection.query(updateStockSql, [item.quantity, item.menu_id]);

        // 4. บันทึกประวัติการตัดสต็อก
        const stockMoveSql = `
          INSERT INTO stock_movement (menu_id, quantity_change, moved_at)
          VALUES (?, ?, NOW())
        `;
        await connection.query(stockMoveSql, [item.menu_id, -item.quantity]);
      }

      await connection.commit();

      return {
        order_id: orderId,
        branch_id,
        employee_id,
        payment_method,
        total_amount: calculatedTotal,
        items_count: items.length,
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * ดึงข้อมูลออเดอร์ตาม order_id พร้อมคำนวณยอดรวมสุทธิและดึงรายการสินค้า
   * @param {number} orderId
   */
  static async findById(orderId) {
    // ดึงหัวออเดอร์พร้อมคำนวณ total_amount สดผ่าน SUM()
    const orderSql = `
      SELECT 
        o.order_id,
        o.branch_id,
        b.name AS branch_name,
        o.employee_id,
        e.name AS employee_name,
        o.payment_method,
        o.created_at,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0.00) AS total_amount
      FROM orders o
      JOIN branch b ON o.branch_id = b.branch_id
      JOIN employee e ON o.employee_id = e.employee_id
      LEFT JOIN order_item oi ON o.order_id = oi.order_id
      WHERE o.order_id = ?
      GROUP BY o.order_id, o.branch_id, b.name, o.employee_id, e.name, o.payment_method, o.created_at
    `;
    const [orders] = await db.query(orderSql, [orderId]);
    if (orders.length === 0) return null;

    const order = orders[0];

    // ดึงรายการสินค้าทั้งหมดในออเดอร์นี้
    const itemsSql = `
      SELECT 
        oi.order_item_id,
        oi.menu_id,
        m.name AS menu_name,
        oi.quantity,
        oi.unit_price,
        (oi.quantity * oi.unit_price) AS subtotal
      FROM order_item oi
      JOIN menu_item m ON oi.menu_id = m.menu_id
      WHERE oi.order_id = ?
      ORDER BY oi.order_item_id ASC
    `;
    const [items] = await db.query(itemsSql, [orderId]);
    order.items = items;

    return order;
  }

  /**
   * ดึงรายการออเดอร์ทั้งหมดของสาขา พร้อมยอดรวมที่คำนวณสด
   * @param {number} branchId
   */
  static async findAllByBranch(branchId) {
    const sql = `
      SELECT 
        o.order_id,
        o.branch_id,
        o.employee_id,
        e.name AS employee_name,
        o.payment_method,
        o.created_at,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0.00) AS total_amount,
        COUNT(oi.order_item_id) AS total_items
      FROM orders o
      JOIN employee e ON o.employee_id = e.employee_id
      LEFT JOIN order_item oi ON o.order_id = oi.order_id
      WHERE o.branch_id = ?
      GROUP BY o.order_id, o.branch_id, o.employee_id, e.name, o.payment_method, o.created_at
      ORDER BY o.created_at DESC
    `;
    const [rows] = await db.query(sql, [branchId]);
    return rows;
  }
}

module.exports = OrderModel;
