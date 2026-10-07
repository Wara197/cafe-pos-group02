const db = require("../config/db");

class MenuModel {
  static async findAll(branchId) {
    const [rows] = await db.query(
      `SELECT menu_id, branch_id, category_id, name, price, stock_quantity FROM menu_item
       WHERE branch_id = ? ORDER BY category_id, menu_id`,
      [branchId],
    );
    return rows;
  }

  static async findById(menuId, branchId) {
    const [rows] = await db.query(
      `SELECT menu_id, branch_id, category_id, name, price, stock_quantity FROM menu_item
       WHERE menu_id = ? AND branch_id = ?`,
      [menuId, branchId],
    );
    return rows[0] || null;
  }

  static async create({ branch_id, category_id, name, price, stock_quantity }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.query(
        `INSERT INTO menu_item (branch_id, category_id, name, price, stock_quantity) VALUES (?, ?, ?, ?, ?)`,
        [branch_id, category_id, name, price, stock_quantity],
      );
      if (stock_quantity > 0) {
        await connection.query(
          `INSERT INTO stock_movement (menu_id, quantity_change, moved_at) VALUES (?, ?, NOW())`,
          [result.insertId, stock_quantity],
        );
      }
      await connection.commit();
      return this.findById(result.insertId, branch_id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async update(
    menuId,
    branchId,
    { category_id, name, price, stock_quantity },
  ) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query(
        `SELECT stock_quantity FROM menu_item WHERE menu_id = ? AND branch_id = ? FOR UPDATE`,
        [menuId, branchId],
      );
      if (!rows.length) {
        await connection.rollback();
        return 0;
      }
      const stockChange =
        Number(stock_quantity) - Number(rows[0].stock_quantity);
      await connection.query(
        `UPDATE menu_item SET category_id = ?, name = ?, price = ?, stock_quantity = ?
         WHERE menu_id = ? AND branch_id = ?`,
        [category_id, name, price, stock_quantity, menuId, branchId],
      );
      if (stockChange !== 0) {
        await connection.query(
          `INSERT INTO stock_movement (menu_id, quantity_change, moved_at) VALUES (?, ?, NOW())`,
          [menuId, stockChange],
        );
      }
      await connection.commit();
      return 1;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async remove(menuId, branchId) {
    const [result] = await db.query(
      `DELETE FROM menu_item WHERE menu_id = ? AND branch_id = ?`,
      [menuId, branchId],
    );
    return result.affectedRows;
  }
}
module.exports = MenuModel;
