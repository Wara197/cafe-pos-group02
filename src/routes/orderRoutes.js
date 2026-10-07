// src/routes/orderRoutes.js
const router = require("express").Router();
const create = require("../controllers/orderController");
router.post("/", create.createOrder);
router.get("/", create.listOrders);

module.exports = router;
