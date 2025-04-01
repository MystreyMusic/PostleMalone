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

// 🎶 Manually Define the Song List (without .mp3 extension)
let songList = [
    "Congratulations (feat. Quavo)", "I Fall Apart", "White Iverson", "Big Lie",
    "Broken Whiskey Glass", "Cold", "Deja Vu (feat. Justin Bieber)", "Feel (feat. Kehlani)",
    "Feeling Whitney", "Go Flex", "Hit This Hard", "Leave", "Money Made Me Do It (feat. 2 Chainz)",
    "No Option", "Patient", "Too Young", "Up There", "Yours Truly, Austin Post"
];

// 🎶 Confetti Effect
function triggerConfetti() {
    confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
}

// ✅ Play a random song from the list
function playRandomSong() {
    if (songList.length === 0) return;
    let randomSong = getRandomSong();
    if (!randomSong) return;
    currentSongTitle = randomSong;
    
    // Construct the song URL
    let songUrl = `${musicFolder}/${randomSong}.mp3`;
    console.log(`Attempting to load song: ${songUrl}`);
    
    audioPlayer.src = songUrl;
    audioPlayer.load();
    
    // Remove previous event listeners to prevent multiple triggers
    audioPlayer.oncanplaythrough = null;
    audioPlayer.onerror = null;

    audioPlayer.oncanplaythrough = () => {
        if (!audioPlayer.duration || audioPlayer.duration < 15) {
            console.error("Error: Song duration is too short or not available.");
            return;
        }
        const maxStartTime = Math.max(0, audioPlayer.duration - 15);
        const randomStartTime = Math.floor(Math.random() * maxStartTime);
        audioPlayer.currentTime = randomStartTime;

        audioPlayer.play().then(() => {
            console.log("Playing song:", randomSong);
            startTimer();
        }).catch(error => {
            console.error("Error playing the song:", error);
        });
    };

    audioPlayer.onerror = (error) => {
        console.error("Error loading audio:", error);
    };
}

// ✅ Start 15-second countdown
function startTimer() {
    lightBar.style.transition = "none";
    lightBar.style.width = "100%";
    setTimeout(() => {
        lightBar.style.transition = "width 15s linear";
        lightBar.style.width = "0%";
    }, 50);
    clearTimeout(roundTimeout);
    roundTimeout = setTimeout(stopSong, 15000);
}

// ✅ Stop the song and show the correct answer
function stopSong() {
    audioPlayer.pause();
    answerText.textContent = `Correct Answer: ${currentSongTitle}`;
    correctAnswerDisplay.style.display = "block";
    triggerConfetti();
    playedSongs.push(currentSongTitle);
    if (currentScore > highScore) {
        highScore = currentScore;
        localStorage.setItem("high_score", highScore);
        highScoreDisplay.textContent = highScore;
    }
    setTimeout(() => {
        audioPlayer.src = "";
        playRandomSong();
    }, 3000);
}

// ✅ Get a random song ensuring no repeats
function getRandomSong() {
    const remainingSongs = songList.filter(song => !playedSongs.includes(song));
    if (remainingSongs.length === 0) {
        playedSongs = [];
        return getRandomSong();
    }
    return remainingSongs[Math.floor(Math.random() * remainingSongs.length)];
}

// ✅ Submit Guess
function checkAnswer() {
    if (songInput.value.trim().toLowerCase() === currentSongTitle.toLowerCase()) {
        currentScore++;
        scoreDisplay.textContent = currentScore;
        stopSong();
    } else {
        songInput.value = "";
        songInput.style.backgroundColor = "red";
        setTimeout(() => songInput.style.backgroundColor = "", 500);
    }
}

// ✅ Update autocomplete suggestions
songInput.addEventListener("input", () => {
    const inputText = songInput.value.trim().toLowerCase();
    datalist.innerHTML = "";
    if (inputText.length === 0) return;
    songList.filter(song => song.toLowerCase().startsWith(inputText))
        .forEach(song => {
            let option = document.createElement("option");
            option.value = song;
            datalist.appendChild(option);
        });
});

// ✅ Listen for Enter key and Submit button
songInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") checkAnswer();
});
submitBtn.addEventListener("click", checkAnswer);
playBtn.addEventListener("click", playRandomSong);

// ✅ Load the game
window.onload = () => {
    playBtn.disabled = false;
};
