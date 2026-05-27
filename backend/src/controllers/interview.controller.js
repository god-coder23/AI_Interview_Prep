const {generateInterviewQuestion} = require("../services/ollama.service")
const Interview = require("../models/interview.model")
const {evaluateAnswer} = require("../services/scoring.service")

const {generateSpeech} = require("../services/tts.service")
const { transcribeAudio } = require("../services/whisper.service")
const ollama = require("ollama").default

const UNCERTAIN_PATTERNS = [
    /\bi don't know\b/i,
    /\bi do not know\b/i,
    /\bidk\b/i,
    /\bnot sure\b/i,
    /\bno idea\b/i,
    /\bdon't remember\b/i,
    /\bcannot recall\b/i,
    /\bcan't recall\b/i,
    /\bi dont know\b/i,
    /\bdont know\b/i,
    /\bdo not remember\b/i,
    /\bunsure\b/i,
    /\bskip this\b/i,
    /\bpass\b/i,
    /\bunknown\b/i
]

const FILLER_WORDS = new Set([
    "i", "me", "my", "the", "a", "an", "and", "or", "but", "to", "of", "for",
    "in", "on", "at", "is", "am", "are", "was", "were", "be", "it", "that",
    "this", "just", "maybe", "think", "guess", "umm", "uh", "hmm"
])

const normalizeTranscript = (transcript = "") =>
    transcript
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()

const isExplicitUncertainAnswer = (transcript = "") =>
    UNCERTAIN_PATTERNS.some((pattern) => pattern.test(normalizeTranscript(transcript)))

const isLowInformationAnswer = (transcript = "") => {
    const normalized = normalizeTranscript(transcript)

    if (!normalized) return true
    if (isExplicitUncertainAnswer(normalized)) return true

    const words = normalized.split(" ").filter(Boolean)
    const meaningfulWords = words.filter((word) => !FILLER_WORDS.has(word))

    return meaningfulWords.length < 4
}

const buildLowConfidenceEvaluation = (transcript) => ({
    score: 10,
    confidence: 20,
    feedback: transcript
        ? "You were honest about not knowing the answer. Try sharing a related concept or how you would find the solution next time."
        : "No clear answer was captured. Try giving a brief attempt or explaining how you would approach the problem next time.",
    strengths: ["Honest communication"],
    improvements: ["Add your reasoning or fallback approach", "Mention how you would investigate the answer"]
})

const buildOverallScore = (answers, totalQuestions) => {
    if (!totalQuestions) return 0
    const total = answers.reduce((sum, item) => sum + (item.score || 0), 0)
    return Math.round(total / totalQuestions)
}

const buildFinalSummary = async (interview) => {
    if (!interview.answers.length) {
        return "The interview ended before any answers were submitted. Try another session and answer a few questions to receive a fuller assessment."
    }

    const answersSummary = interview.answers
        .map((answer, index) => `${index + 1}. Q: ${answer.question}\nA: ${answer.transcript}\nFeedback: ${answer.feedback}`)
        .join("\n\n")

    const response = await ollama.chat({
        model: "llama3",
        messages: [
            {
                role: "user",
                content: `You are an interview coach. Based on this mock interview, write a concise final summary in 4-6 sentences.
                Mention overall performance, strongest area, biggest improvement area, and one next step.

                Resume: ${interview.resume}
                Job description: ${interview.jd}
                Answers:
                ${answersSummary}`
            }
        ]
    })

    return response.message.content.trim()
}

const finalizeInterview = async (interview) => {
    interview.status = "Completed"
    interview.followUpCount = 0
    interview.confidence = buildOverallScore(interview.answers, interview.questions.length)
    interview.finalSummary = await buildFinalSummary(interview)
    await interview.save()

    return {
        interviewComplete: true,
        currentQuestion: null,
        progress: {
            current: interview.questions.length,
            total: interview.questions.length
        },
        finalSummary: interview.finalSummary,
        overallScore: interview.confidence
    }
}

const buildSessionResponse = (interview) => {
    const isComplete = interview.status === "Completed" || interview.currentQuestion >= interview.questions.length
    const latestAnswer = interview.answers.length ? interview.answers[interview.answers.length - 1] : null

    return {
        success: true,
        sessionId: interview._id,
        questions: interview.questions,
        currentQuestion: isComplete ? null : interview.questions[interview.currentQuestion] || null,
        progress: {
            current: isComplete ? interview.questions.length : Math.min(interview.currentQuestion + 1, interview.questions.length),
            total: interview.questions.length
        },
        latestFeedback: latestAnswer ? {
            score: latestAnswer.score,
            confidence: latestAnswer.confidence,
            feedback: latestAnswer.feedback,
            strengths: latestAnswer.strengths,
            improvements: latestAnswer.improvements
        } : null,
        interviewComplete: isComplete,
        finalSummary: isComplete ? interview.finalSummary : "",
        overallScore: isComplete ? interview.confidence : null
    }
}

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

        const openingLine = `Welcome to your mock interview. Let's begin. ${interview.questions[0]}`
        const filename = `response-${Date.now()}.wav`
        await generateSpeech(openingLine, filename)

        res.status(200).json({
            success: true,
            sessionId: interview._id,
            questions: interview.questions,
            currentQuestion: interview.questions[0] || null,
            progress: {
                current: 1,
                total: interview.questions.length
            },
            audioURL: `http://localhost:3000/audio/${filename}`
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
        const {sessionId} = req.body
        const audioPath = req.file.path
        const transcript = await transcribeAudio(audioPath)
        const interview = await Interview.findById(sessionId)

        if (!interview){
            return res.status(404).json({ success: false, message: "Interview not found" })
        }

        const currentQuestion = interview.questions[interview.currentQuestion]
        const recentAnswers = interview.answers
            .slice(-2)
            .map((answer, index) => `${index + 1}. ${answer.question} -> ${answer.transcript}`)
            .join("\n")
        
        const prompt = `
        You are a professional but encouraging interviewer.
        Current question: "${currentQuestion}"
        User said: "${transcript}"
        Recent interview context:
        ${recentAnswers || "No previous answers yet."}

        Decide what to do. Return ONLY this JSON:
        {
            "response": "What you say to the user",
            "moveToNext": true or false,
            "reason": "accepted" or "needs_more_detail"
        }

        If the answer is relevant and reasonably complete, moveToNext should be true.
        If the answer is too short, vague, or off-topic, moveToNext should be false and your response should ask for one missing detail or gently rephrase the question.
        If the user clearly says they do not know, do not keep repeating the same question more than once.
        Keep your response under 2 sentences.
        `;

        const aiResponse = await ollama.chat({
            model: "llama3",
            format: "json",
            messages: [{ role: "user", content: prompt }]
        })

        const rawDecision = JSON.parse(aiResponse.message.content)
        const decision = {
            response: rawDecision.response || "Thanks for sharing that.",
            moveToNext: Boolean(rawDecision.moveToNext),
            reason: rawDecision.reason || "accepted"
        }
        const transcriptShowsUncertainty = isExplicitUncertainAnswer(transcript)
        const transcriptIsLowInformation = isLowInformationAnswer(transcript)
        const shouldForceMoveNext =
            transcriptShowsUncertainty || (!decision.moveToNext && interview.followUpCount >= 1)

        if (shouldForceMoveNext) {
            decision.moveToNext = true
            decision.reason = transcriptShowsUncertainty ? "accepted" : "needs_more_detail"
            decision.response = transcriptShowsUncertainty
                ? "Thanks for being honest. Let's move to the next question, and you can explain your approach if something similar comes up again."
                : "Thanks, that's enough for now. Let's move on to the next question."
        }

        let evaluationPromise = null

        if (decision.moveToNext) {
            evaluationPromise = (transcriptShowsUncertainty || transcriptIsLowInformation)
                ? Promise.resolve(buildLowConfidenceEvaluation(transcript))
                : evaluateAnswer(currentQuestion, transcript)

            interview.currentQuestion += 1
            interview.followUpCount = 0
        } else {
            interview.followUpCount += 1
            await interview.save()
        }

        const isComplete = interview.currentQuestion >= interview.questions.length
        const nextQuestion = isComplete ? null : interview.questions[interview.currentQuestion]
        const spokenResponse = isComplete
            ? `${decision.response} This interview is now complete.`
            : decision.moveToNext
                ? `${decision.response} Next question: ${nextQuestion}`
                : decision.response
        const filename = `response-${Date.now()}.wav`
        const audioPromise = generateSpeech(spokenResponse, filename)

        let latestAnswer = null
        if (decision.moveToNext && evaluationPromise) {
            const evaluation = await evaluationPromise

            interview.answers.push({
                question: currentQuestion,
                transcript,
                score: evaluation.score,
                confidence: evaluation.confidence,
                feedback: evaluation.feedback,
                strengths: evaluation.strengths,
                improvements: evaluation.improvements
            })
            latestAnswer = interview.answers[interview.answers.length - 1]

            if (isComplete) {
                await finalizeInterview(interview)
            }
            else {
                await interview.save()
            }
        }

        await audioPromise
        const audioURL = `http://localhost:3000/audio/${filename}`

        res.status(200).json({
            success: true,
            transcript,
            aiResponse: spokenResponse,
            audioURL,
            moveToNext: Boolean(decision.moveToNext),
            currentQuestion: nextQuestion,
            progress: {
                current: Math.min(interview.currentQuestion + 1, interview.questions.length),
                total: interview.questions.length
            },
            latestFeedback: latestAnswer ? {
                score: latestAnswer.score,
                confidence: latestAnswer.confidence,
                feedback: latestAnswer.feedback,
                strengths: latestAnswer.strengths,
                improvements: latestAnswer.improvements
            } : null,
            interviewComplete: isComplete,
            finalSummary: isComplete ? interview.finalSummary : null,
            overallScore: isComplete ? interview.confidence : null
        })
    }
    catch(err){
        console.log(err)
        res.status(500).json({ success: false, message: err.message })
    }
}

const endInterview = async (req, res) => {
    try {
        const { sessionId } = req.body
        const interview = await Interview.findById(sessionId)

        if (!interview) {
            return res.status(404).json({ success: false, message: "Interview not found" })
        }

        if (interview.status !== "Completed") {
            await finalizeInterview(interview)
        }

        res.status(200).json({
            ...buildSessionResponse(interview),
            message: "Interview ended successfully."
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({ success: false, message: err.message })
    }
}

const getInterviewSession = async (req, res) => {
    try {
        const { sessionId } = req.params
        const interview = await Interview.findById(sessionId)

        if (!interview) {
            return res.status(404).json({ success: false, message: "Interview not found" })
        }

        res.status(200).json(buildSessionResponse(interview))
    } catch (err) {
        console.log(err)
        res.status(500).json({ success: false, message: err.message })
    }
}


module.exports = {generateQuestions, submitAnswer, endInterview, getInterviewSession}
