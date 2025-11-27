const express = require("express");
const router = express.Router();
const { register, login, dashboard } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/dashboard", authMiddleware, dashboard);

module.exports = router;
