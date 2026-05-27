const ollama = require("ollama").default

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const evaluateAnswer = async(question, answer) => {
    try{
        const prompt = `You are a professional AI interviewer.
        Question: "${question}"
        Candidate answer: "${answer}"

        Evaluate the answer and return only valid json in this format:
        {
          "score": number,
          "confidence": number,
          "feedback": "short feedback",
          "strengths": ["short point"],
          "improvements": ["short point"]
        }

        Rules:
        - score should be between 0 to 100
        - confidence should be between 0 to 100
        - if the answer says "I don't know", is mostly filler, or does not attempt the question, score must be below 20
        - feedback should be concise and actionable
        - strengths should have 2 short bullets max
        - improvements should have 2 short bullets max
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
        const parsed = JSON.parse(response.message.content)

        return {
            score: clamp(Number(parsed.score) || 0, 0, 100),
            confidence: clamp(Number(parsed.confidence) || 0, 0, 100),
            feedback: parsed.feedback || "Keep refining the depth and clarity of your answer.",
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 2) : [],
            improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 2) : []
        }
    }
    catch(err){
        console.log("Scoring error",err)
        throw new Error("Failed to generate answer")
    }
}

module.exports = {evaluateAnswer}
