const { json } = require("express")

const ollama = require("ollama").default



const evaluateAnswer = async(question, answer) => {
    try{
        const prompt = `You are a Professional AI Interviewer Question ${question} Candidate's Answer ${answer} Evaluate the answer: Return only valid json in this format 
        {
        "score": number,
        "confidence": number,
        "feedback": "short feedback"
        }
        Rules:
        - score should be between 0 to 100
        - confidence should be between 0 to 100
        - feedback should be concise
        `

        const response = await ollama.chat({
            model: "llama3",
            format: "json",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        })
        return JSON.parse( response.message.content )
    }
    catch(err){
        console.log("Scoring error",err)
        throw new Error("Failed to generate answer")
    }
}

module.exports = {evaluateAnswer}