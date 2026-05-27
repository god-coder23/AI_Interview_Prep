const { KokoroTTS, TextSplitterStream } = require("kokoro-js")

let tts = null

const loadtts = async() => {
    if (!tts){
        tts = await KokoroTTS.from_pretrained(
            "onnx-community/Kokoro-82M-v1.0-ONNX",
            {
                dtype: "q4",
                device: "cpu"
            }
        )
    }
    return tts
}

const warmTTS = async () => {
    try {
        await loadtts()
        console.log("TTS model warmed")
    } catch (error) {
        console.log("Failed to warm TTS model", error)
    }
}

const generateSpeech = async(text, filename) => {
    const model = await loadtts()
    const audio = await model.generate(text,{
        voice: "af_heart"
    })
    await audio.save(`public/audio/${filename}`)
    return filename
}

module.exports = {generateSpeech, warmTTS}
