require("dotenv").config();
const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("public"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/menu", require("./routes/menuRoutes"));

app.use((req, res) =>
  res.status(404).json({ error: "ไม่พบ endpoint ที่ร้องขอ" }),
);

// JSON ที่ส่งมาผิดรูปแบบ ต้องตอบ 400 ไม่ใช่ 500 (เดิมตกไปที่ handler 500 ทั้งหมด)
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed")
    return res.status(400).json({ error: "รูปแบบ JSON ไม่ถูกต้อง" });
  console.error(err);
  res.status(500).json({ error: "เกิดข้อผิดพลาดภายในระบบ" });
});

const PORT = process.env.PORT || 3000;

if (require.main === module)
  app.listen(PORT, () => {
    console.log(`Cafe POS server running on port http://localhost:${PORT}`);
  });
module.exports = app;
