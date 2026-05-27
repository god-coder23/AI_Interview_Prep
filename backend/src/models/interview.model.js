const mongoose = require("mongoose")
 

const interviewSchema = new mongoose.Schema({
    resume: {
        type: String,
        required: true
    },
    jd: {
        type: String,
        required: true
    },
    questions: {
        type: [String],
        required: true
    },
    answers: [
        {
            question: String,
            transcript: String,
            score: Number,
            confidence: Number,
            feedback: String,
            strengths: [String],
            improvements: [String]
        }
    ],
    currentQuestion: {
        type: Number,
        default: 0
    },
    followUpCount: {
        type: Number,
        default: 0
    },
    confidence: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        default: "Ongoing"
    },
    finalSummary: {
        type: String,
        default: ""
    }
})

const interviewModel = mongoose.model("Interview",interviewSchema)

module.exports = interviewModel
