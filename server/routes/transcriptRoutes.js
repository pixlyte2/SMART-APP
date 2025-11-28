    const express = require("express");
    const router = express.Router();
    const { transcribe } = require("../controllers/transcriptController");
    const authMiddleware = require("../middlewares/authMiddleware");

    router.post("/transcribe", authMiddleware, transcribe);

    module.exports = router;
