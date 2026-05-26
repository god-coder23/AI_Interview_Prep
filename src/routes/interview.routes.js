const express = require("express")

const router = express.Router()

const {generateQuestions,submitAnswer} = require("../controllers/interview.controller")
const upload = require("../middlewares/upload.middleware")

router.post("/generate",generateQuestions)
router.post("/submit-answer",upload.single("audio"),submitAnswer)



module.exports = router