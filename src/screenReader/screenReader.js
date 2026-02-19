let announcer = null;
//call speak(text) for screen reader to say text
export function speak(text, priority = "polite"){
    if (!announcer){
        announcer = document.getElementById("sr-announcer");
    }
    if (!announcer) return;
    announcer.setAttribute("aria-live", priority);
    const cleanText = cleanSpeech(text);
    announcer.textContent = "";
    setTimeout(() => {
        announcer.textContent = cleanText;
    }, 50);
}

//function to remove brackets, extra info etc from spoken lines

export function cleanSpeech(text) {
    if (!text) return "";

    let cleaned = text;

    cleaned = cleaned
        .replace(/\bdef\s+(\w+)\((.*?)\):/g, "function $1, parameters $2")
        .replace(/\bfor\s+(.*?)\s+in\s+(.*?):/g, "For $1 in $2")
        .replace(/\bwhile\s+(.*?):/g, "While $1")

        .replace(/\bif\s+(.*?):/g, "If $1")
        .replace(/\belif\s+(.*?):/g, "Else if $1")
        .replace(/\belse:/g, "Else")
        .replace(/\bdef\b/g, "Define")

    cleaned = cleaned
        .replace(/==/g, " equals ")
        .replace(/!=/g, " does not equal ")
        .replace(/<=/g, " is less than or equal to ")
        .replace(/>=/g, " is greater than or equal to ")
        .replace(/</g, " is less than ")
        .replace(/>/g, " is greater than ")
        .replace(/\band\b/g, " and ")
        .replace(/\bor\b/g, " or ")
        .replace(/\bnot\b/g, " not ")

    cleaned = cleaned
        .replace(/\+/g, " plus ")
        .replace(/\-/g, " minus ")
        .replace(/\*\*/g, " to the power of ")
        .replace(/\*/g, " times ")
        .replace(/\//g, " divided by ")

    cleaned = cleaned
        .replace(/_/g, " ")
        .replace(/[{}()\[\]]/g, " ")
        .replace(/:/g, ",")
        .replace(/\s+/g, " ")
        .trim();

    return cleaned;
}

//speak the line given, may not be needed
export function speakLine(lineContent){
    if (!lineContent||lineContent.trim() === ""){
        speak("Empty Line");
        return;
    }
    speak(lineContent);
}

//handling error messages that can be called at any time
export function speakError(type, details = ""){
    let baseMessage;

    switch(type){
        case "file":
            baseMessage = "File Error. ";
            break;
        case "syntax":
            baseMessage = "Syntax Error. ";
            break;
        case "runtime":
            baseMessage = "Runtime Error. ";
            break;
        default:
            baseMessage = "Unknown Error. ";
            break;
    }
    speak(baseMessage + details);
}


//function to play a tone at a given frequency range of 220-440
let audioCtx = null;
export function playTone(freq, duration = 0.5) {

    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    audioCtx.resume().then(() => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(0.6, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);
    });
}