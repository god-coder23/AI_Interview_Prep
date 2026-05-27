require("dotenv").config()
const app = require("./src/app")
const connectDB = require("./src/db/db")
const { warmTTS } = require("./src/services/tts.service")

connectDB()
warmTTS()

app.listen(3000,()=>{
    console.log("Server runnning on port 3000")
})
