let announcer = null;


export function initSR(){
    announcer = document.getElementByID("sr-announcer");


}

//function that can be called for screen reader to say anything desired
export function speak(text){
    if (!announcer) return;
    announcer.textContent = "";
    setTimeout(() => {
        announcer.textContent = text;
    }, 50);
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
/*
export function playTone(freq, duration = 0.2){

    const audio = new (window.AudioContext)();
    const oscillator = audio.createOscillator();
    const node = audio.createGain();

    oscillator.connect(node);
    node.connect(audio.destionation);

    oscillator.frequency.value = freq;
    oscillator.type = "sine";

    

}
*/