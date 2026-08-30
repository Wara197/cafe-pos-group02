// src/models/orderModel.js
const db = require("../config/db");

exports.create = async (paymentMethod, totalAmount) => {
  const [result] = await db.query(
    "INSERT INTO orders (payment_method, total_amount, created_at) VALUES (?, ?, NOW())",
    [paymentMethod, totalAmount],
  );
  return result.insertId;
};

exports.findAll = async () => {
  const [rows] = await db.query("SELECT * FROM orders");
  return rows;
};
