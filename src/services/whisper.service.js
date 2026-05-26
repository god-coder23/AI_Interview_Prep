const {exec, execFile} = require("child_process")
const {promisify} = require("util")

const run = promisify(execFile)

async function transcribeAudio(audioPath) {
    const {stdout} = await run (
        "./whisper.cpp/build/bin/whisper-cli",
        [
        "-m",
        "./whisper.cpp/models/ggml-base.en.bin",
        "-f",
        audioPath
        ]
    )
    return stdout
}

module.exports = { transcribeAudio };