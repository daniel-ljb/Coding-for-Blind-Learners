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

export function verboseString(line) {
  const ordered = [
    { r: /=/g, w: ' equals ' },
    { r: />/g, w: ' greater than ' },
    { r: /</g, w: ' less than ' },
    { r: /\+/g, w: ' plus ' },
    { r: /-/g, w: ' minus ' },
    { r: /\*/g, w: ' star ' },
    { r: /\//g, w: ' slash ' },
    { r: /%/g, w: ' percent ' },
    { r: /:/g, w: ' colon ' },
    { r: /,/g, w: ' comma ' },
    { r: /\./g, w: ' dot ' },
    { r: /\(/g, w: ' left paren' },
    { r: /\)/g, w: ' right paren ' },
    { r: /\[/g, w: ' left square ' },
    { r: /\]/g, w: ' right square ' },
    { r: /\{/g, w: ' left curly ' },
    { r: /\}/g, w: ' right curly ' },
    { r: /#/g, w: ' hash ' },
    { r: /"/g, w: ' double quote ' },
    { r: /'/g, w: ' single quote ' }
  ];

  let result = line;

  for (const { r, w } of ordered) {
    result = result.replace(r, w);
  }

  return result.replace(/\s+/g, ' ').trim();
}

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

const SFX = {
  'confirm1': '/Coding-for-Blind-Learners/sounds/confirm1.mp3',
  'confirm2': '/Coding-for-Blind-Learners/sounds/confirm2.mp3',
  'confirm3': '/Coding-for-Blind-Learners/sounds/confirm3.mp3',
  'error1':   '/Coding-for-Blind-Learners/sounds/error1.mp3'
};

const audioCache = new Map();
const lastPlayTime = new Map(); // store last play timestamp

export function playSfx(name, { volume = 1, rate = 1, overlap = true } = {}) {
    const src = SFX[name];
    if (!src) return;

    const now = performance.now(); // high-resolution timestamp
    const last = lastPlayTime.get(name) || 0;

    if (now - last < 0.2) return; // skip if played in the last 0.2ms
    lastPlayTime.set(name, now);

    let audio;
    if (overlap) {
        audio = new Audio(src);
    } else {
        audio = audioCache.get(name);
        if (!audio) {
            audio = new Audio(src);
            audioCache.set(name, audio);
        }
        audio.currentTime = 0;
    }

    audio.volume = volume;
    audio.playbackRate = rate;
    audio.play().catch(err => console.error(err));
}