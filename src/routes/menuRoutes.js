const router = require("express").Router();
const c = require("../controllers/menuController");
router.get("/", c.listMenu);
router.get("/:id", c.getMenu);
router.post("/", c.createMenu);
router.put("/:id", c.updateMenu);
router.delete("/:id", c.deleteMenu);
module.exports = router;
