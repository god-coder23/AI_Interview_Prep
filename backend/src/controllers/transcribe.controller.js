const {transcribeAudio} = require("../services/whisper.service")

const transcribe = async(req, res) => {
    try{
        const audioPath = req.file.path

        const transcript = await transcribeAudio(audioPath)

        res.status(200).json({
            success: true,
            transcript
        })
        console.log(req.file)
        
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            success: false,
            message: "Failed to transcribe audio"
        })
    }
}

module.exports = transcribe