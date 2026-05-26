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

            answer: String,

            score: Number,

            confidence: Number,

            feedback: String
        }
    ],
    currentQuestion: {
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
    }
})

const interviewModel = mongoose.model("Interview",interviewSchema)

module.exports = interviewModel