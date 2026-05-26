const {generateInterviewQuestion} = require("../services/ollama.service")
const Interview = require("../models/interview.model")
const {evaluateAnswer} = require("../services/scoring.service")

const {generateSpeech} = require("../services/tts.service")
const { transcribeAudio } = require("../services/whisper.service")


const generateQuestions = async(req, res) => {
    try{
        const {resume, jd} = req.body

        const questions = await generateInterviewQuestion(resume, jd)

        const questionsArray = questions.split("\n").filter(q=>q.trim() !== "" && q.includes("?"))

        const interview = await Interview.create({
            resume,
            jd,
            questions: questionsArray
        })

        res.status(200).json({
            success: true,
            sessionId: interview._id,
            questions: interview.questions
        })
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            success: false,
            message: "Failed to generate questions"
        })
    }
}


const submitAnswer = async(req,res) => {
    try{
        console.log(req.body)
console.log(req.file)
        const {sessionId} = req.body
        const audioPath = req.file.path
        const transcript = await transcribeAudio(audioPath)

        const interview = await Interview.findById(sessionId)

        if (!interview){
            return res.status(404).json({
                success: false,
                message: "Interview not found"
            })
        }

        const currentQuestion = interview.questions[interview.currentQuestion]
        const evaluation = await evaluateAnswer(currentQuestion, transcript)

        interview.answers.push({
            question: currentQuestion,
            transcript,
            score: evaluation.score,
            confidence: evaluation.confidence,
            feedback: evaluation.feedback
        })

        interview.currentQuestion += 1

        if (interview.currentQuestion >= interview.questions.length){
            interview.status = "completed"
        }
        await interview.save()
        const nextQuestion = interview.status === "completed" ? null : interview.questions[ interview.currentQuestion]

        
        const filename = `question-${Date.now()}.wav`
        let audioURL = null
        if (nextQuestion){
            await generateSpeech(nextQuestion, filename)
        }
        audioURL = `http://localhost:3000/audio/${filename}`

        res.status(200).json({
            success: true,
            evaluation,
            status: interview.status,
            nextQuestion: interview.status == "completed" ? null : interview.questions[interview.currentQuestion],
            audioURL
        })
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            success: false,
            message: "Failed to submit answer"
        })
    }
}


module.exports = {generateQuestions, submitAnswer}