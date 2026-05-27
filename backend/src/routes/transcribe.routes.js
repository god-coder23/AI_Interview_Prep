const express = require("express")

const router = express.Router()

const upload = require("../middlewares/upload.middleware")
const transcribe = require("../controllers/transcribe.controller")

router.post("/",upload.single("audio"),transcribe)

module.exports = router