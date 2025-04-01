let currentScore = 0;
let highScore = localStorage.getItem("high_score") || 0;
let currentSongTitle = "";
let roundTimeout;
let audioPlayer = new Audio();
let playedSongs = [];
const musicFolder = "music";
const playBtn = document.getElementById("play-btn");
const songInput = document.getElementById("song-guess");
const datalist = document.getElementById("song-list");
const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("high-score");
const correctAnswerDisplay = document.getElementById("correct-answer");
const answerText = document.getElementById("answer-text");
const submitBtn = document.getElementById("submit-btn");
const lightBar = document.getElementById("light-bar");

let songList = [
    "Congratulations (feat. Quavo)", "I Fall Apart", "White Iverson", "Big Lie",
    "Broken Whiskey Glass", "Cold", "Deja Vu (feat. Justin Bieber)", "Feel (feat. Kehlani)",
    "Feeling Whitney", "Go Flex", "Hit This Hard", "Leave", "Money Made Me Do It (feat. 2 Chainz)",
    "No Option", "Patient", "Too Young", "Up There", "Yours Truly, Austin Post"
];

function triggerConfetti(duration) {
    let end = Date.now() + duration;
    (function frame() {
        confetti({
            particleCount: 10,  
            spread: 60,         
            origin: { y: 1.0 }, 
            scalar: 0.6,        
            gravity: 0.7        
        });
        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    })();
}

function playRandomSong() {
    correctAnswerDisplay.style.display = "none"; // Hide correct answer at the start of a new round

    if (songList.length === 0) return;
    let randomSong = getRandomSong();
    if (!randomSong) return;
    currentSongTitle = randomSong;
    
    let songUrl = `${musicFolder}/${randomSong}.mp3`;
    console.log(`Attempting to load song: ${songUrl}`);
    
    audioPlayer.pause();
    audioPlayer.src = songUrl;
    audioPlayer.load();

    audioPlayer.oncanplaythrough = () => {
        if (!audioPlayer.duration || audioPlayer.duration < 15) {
            console.error("Error: Song duration is too short or not available.");
            return;
        }
        const maxStartTime = Math.max(0, audioPlayer.duration - 15);
        const randomStartTime = Math.floor(Math.random() * maxStartTime);
    
        audioPlayer.currentTime = randomStartTime;
        audioPlayer.play().then(() => {
            console.log(`Playing song: ${randomSong} from ${randomStartTime}s`);
            startTimer();
        }).catch(error => {
            console.error("Error playing the song:", error);
        });
    };

    audioPlayer.onerror = (error) => {
        console.error("Error loading audio:", error);
    };
}

function startTimer() {
    lightBar.style.transition = "none";
    lightBar.style.width = "100%";
    setTimeout(() => {
        lightBar.style.transition = "width 15s linear";
        lightBar.style.width = "0%";
    }, 50);
    clearTimeout(roundTimeout);
    roundTimeout = setTimeout(endRound, 15000);
}

function pauseTimer() {
    clearTimeout(roundTimeout);
    lightBar.style.transition = "none";
}

function resetTimer() {
    startTimer();
}

function endRound() {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;

    // Display the correct answer when the timer expires
    answerText.textContent = `Correct Answer: ${currentSongTitle}`;
    correctAnswerDisplay.style.display = "block";

    if (currentScore > highScore) {
        highScore = currentScore;
        localStorage.setItem("high_score", highScore);
        highScoreDisplay.textContent = highScore;
        
        // Play "Congratulations" and trigger confetti
        audioPlayer.src = `${musicFolder}/Congratulations (feat. Quavo).mp3`;
        audioPlayer.load();
        audioPlayer.oncanplaythrough = () => {
            audioPlayer.currentTime = 107;
            audioPlayer.play();
            triggerConfetti(23000);
            setTimeout(() => { audioPlayer.pause(); }, 23000);
        };
    }

    // Reset the current score
    currentScore = 0;
    scoreDisplay.textContent = currentScore;
}

function stopSong(correct = false) {
    audioPlayer.pause();
    pauseTimer(); 
    playedSongs.push(currentSongTitle); // Always mark the song as played

    if (correct) {
        // If correct, start the next song after a 3-second delay
        setTimeout(() => {
            playRandomSong();
        }, 3000);
    }
}

function getRandomSong() {
    let remainingSongs = songList.filter(song => !playedSongs.includes(song));
    if (remainingSongs.length === 0) {
        playedSongs = [];
        remainingSongs = [...songList];
    }
    return remainingSongs[Math.floor(Math.random() * remainingSongs.length)];
}

function checkAnswer() {
    if (songInput.value.trim().toLowerCase() === currentSongTitle.toLowerCase()) {
        currentScore++;
        scoreDisplay.textContent = currentScore;
        triggerConfetti(1000); // Confetti when correct answer
        stopSong(true); // Next song starts after 3 seconds
    } else {
        songInput.value = "";
        songInput.style.backgroundColor = "red";
        setTimeout(() => songInput.style.backgroundColor = "", 500);
    }
    songInput.value = "";
}

window.onload = () => {
    highScoreDisplay.textContent = highScore;
    playBtn.disabled = false;
};

songInput.addEventListener("input", () => {
    const inputText = songInput.value.trim().toLowerCase();
    datalist.innerHTML = "";
    if (inputText.length === 0) return;
    let suggestions = songList.filter(song => song.toLowerCase().startsWith(inputText));
    suggestions.forEach(song => {
        let option = document.createElement("option");
        option.value = song;
        datalist.appendChild(option);
    });
});

songInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") checkAnswer();
});
submitBtn.addEventListener("click", checkAnswer);
playBtn.addEventListener("click", playRandomSong);
