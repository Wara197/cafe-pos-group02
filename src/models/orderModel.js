const db = require("../config/db");

const badRequest = (message) =>
  Object.assign(new Error(message), { status: 400 });

class OrderModel {
  static async create({ branchId, employeeId, paymentMethod, items }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      // ล็อกแถวเมนูเรียงตาม menu_id เสมอ เพื่อลดโอกาส deadlock เมื่อสองออเดอร์สั่งเมนูชุดเดียวกัน
      const menuIds = [...new Set(items.map((item) => item.menuId))].sort(
        (a, b) => a - b,
      );
      const placeholders = menuIds.map(() => "?").join(",");
      const [menuRows] = await connection.query(
        `SELECT menu_id, price, stock_quantity FROM menu_item
         WHERE branch_id = ? AND menu_id IN (${placeholders}) ORDER BY menu_id FOR UPDATE`,
        [branchId, ...menuIds],
      );
      const menuById = new Map(
        menuRows.map((row) => [Number(row.menu_id), row]),
      );

      // รวม quantity ของ menuId ซ้ำก่อนเช็กสต็อก
      const totals = new Map();
      for (const item of items)
        totals.set(item.menuId, (totals.get(item.menuId) || 0) + item.quantity);
      for (const [menuId, quantity] of totals) {
        const menu = menuById.get(menuId);
        if (!menu) throw badRequest(`ไม่พบเมนู id ${menuId} ในสาขานี้`);
        if (Number(menu.stock_quantity) < quantity)
          throw badRequest(`สต็อกไม่เพียงพอสำหรับเมนู id ${menuId}`);
      }

      const [orderResult] = await connection.query(
        `INSERT INTO orders (branch_id, employee_id, payment_method, created_at) VALUES (?, ?, ?, NOW())`,
        [branchId, employeeId, paymentMethod],
      );
      const orderId = orderResult.insertId;
      let totalCents = 0;
      for (const item of items) {
        const unitPrice = Number(menuById.get(item.menuId).price);
        totalCents += Math.round(unitPrice * 100) * item.quantity; // คิดเป็นสตางค์เพื่อเลี่ยงเศษทศนิยมของ float
        await connection.query(
          `INSERT INTO order_item (order_id, menu_id, quantity, unit_price) VALUES (?, ?, ?, ?)`,
          [orderId, item.menuId, item.quantity, unitPrice],
        );
        const [stockResult] = await connection.query(
          `UPDATE menu_item SET stock_quantity = stock_quantity - ?
           WHERE menu_id = ? AND branch_id = ? AND stock_quantity >= ?`,
          [item.quantity, item.menuId, branchId, item.quantity],
        );
        // ปกติไม่เกิดเพราะล็อกแถวและเช็กยอดรวมไว้แล้ว แต่ถ้าหักไม่สำเร็จต้อง rollback ทั้งออเดอร์ ไม่ปล่อยให้ commit
        if (stockResult.affectedRows !== 1)
          throw badRequest(`สต็อกไม่เพียงพอสำหรับเมนู id ${item.menuId}`);
        await connection.query(
          `INSERT INTO stock_movement (menu_id, quantity_change, moved_at) VALUES (?, ?, NOW())`,
          [item.menuId, -item.quantity],
        );
      }
      const [remaining] = await connection.query(
        `SELECT menu_id, stock_quantity FROM menu_item WHERE branch_id = ? AND menu_id IN (${placeholders})`,
        [branchId, ...menuIds],
      );
      const lowStockMenuIds = remaining
        .filter((row) => Number(row.stock_quantity) < 10)
        .map((row) => Number(row.menu_id));
      await connection.commit();
      return { orderId, totalAmount: totalCents / 100, lowStockMenuIds };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async findAll(branchId) {
    const [rows] = await db.query(
      `SELECT o.order_id, o.branch_id, o.employee_id, o.payment_method, o.created_at,
              COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_amount
       FROM orders o LEFT JOIN order_item oi ON oi.order_id = o.order_id
       WHERE o.branch_id = ?
       GROUP BY o.order_id, o.branch_id, o.employee_id, o.payment_method, o.created_at
       ORDER BY o.created_at DESC`,
      [branchId],
    );
    return rows;
  }
}
module.exports = OrderModel;
