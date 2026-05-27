const express = require("express")
const interviewRoutes = require("./routes/interview.routes")
const path = require("path")
const transcribeRoutes = require("./routes/transcribe.routes")
const cors = require("cors");

const app = express()

app.use(cors());

app.use(express.json())

app.use("/api/interview",interviewRoutes)

app.use("/audio",express.static(
    path.join(__dirname,"../public/audio")
))

app.use("/audio/transcribe",transcribeRoutes)


module.exports = app