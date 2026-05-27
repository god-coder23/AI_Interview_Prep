const ollama = require("ollama").default

const generateInterviewQuestion = async (resume, jd) =>{
   try{
        const prompt = `You are a Professional AI Interviewer this is Candidate Resume ${resume} and this is the job description ${jd} generate 5 interview question like real interviewer Mix: technical questions, behavioral questions, follow-up questions
        `
         const response = await ollama.chat({
            model: "llama3",
            messages: [{role: "user", content: prompt }]
        })
        return response.message.content
   }
   catch(err){
    console.log("Ollama error",err)
    throw new Error("Failed to generate interview questions")
   }
}

module.exports = {generateInterviewQuestion}