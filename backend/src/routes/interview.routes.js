const express = require("express")

const router = express.Router()

const {generateQuestions,submitAnswer,endInterview,getInterviewSession} = require("../controllers/interview.controller")
const upload = require("../middlewares/upload.middleware")

router.post("/generate",generateQuestions)
router.post("/submit-answer",upload.single("audio"),submitAnswer)
router.post("/end",endInterview)
router.get("/session/:sessionId",getInterviewSession)



module.exports = router
