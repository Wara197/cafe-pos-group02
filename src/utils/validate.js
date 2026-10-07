// ตัวช่วยตรวจ/แปลงค่า input ที่ใช้ร่วมกันใน controller
// รับเฉพาะ number หรือ string ที่เป็นตัวเลข — ปฏิเสธ true/null/array ที่ Number() จะแปลงเป็นเลขได้แบบเงียบ ๆ
const INT_MAX = 2147483647; // ขอบเขตของคอลัมน์ INT ใน MySQL

const toNumber = (v) =>
  typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;

// จำนวนเต็มบวก (>= 1) คืน null เมื่อไม่ผ่าน
const positiveInt = (v) => {
  const n = toNumber(v);
  return Number.isSafeInteger(n) && n > 0 && n <= INT_MAX ? n : null;
};

// จำนวนเต็มไม่ติดลบ (>= 0) คืน null เมื่อไม่ผ่าน (ระวัง: 0 เป็นค่าที่ใช้ได้ ต้องเช็ค === null)
const nonNegativeInt = (v) => {
  const n = toNumber(v);
  return Number.isSafeInteger(n) && n >= 0 && n <= INT_MAX ? n : null;
};

// ราคา > 0, ไม่เกิน DECIMAL(10,2), ทศนิยมไม่เกิน 2 ตำแหน่ง
const priceValue = (v) => {
  const n = toNumber(v);
  if (!Number.isFinite(n) || n <= 0 || n > 99999999.99) return null;
  const cents = Math.round(n * 100);
  return Math.abs(n * 100 - cents) < 1e-6 ? cents / 100 : null;
};

// รองรับทั้ง camelCase (branchId) และ snake_case (stock_quantity) ใน body
const pick = (body, camel, snake) => (body[camel] !== undefined ? body[camel] : body[snake]);

module.exports = { positiveInt, nonNegativeInt, priceValue, pick };
