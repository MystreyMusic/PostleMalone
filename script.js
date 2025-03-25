let currentScore = 0; // Track current score
let highScore = localStorage.getItem("high_score") || 0;
let currentSongTitle = "";
let roundTimeout;
let audioPlayer = new Audio();

const musicFolder = "music"; // Folder where the MP3s are stored
const playBtn = document.getElementById("play-btn");
const songInput = document.getElementById("song-guess");
const datalist = document.getElementById("song-list");
const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("high-score");
const correctAnswerDisplay = document.getElementById("correct-answer");
const answerText = document.getElementById("answer-text");
const submitBtn = document.getElementById("submit-btn");
const lightBar = document.getElementById("light-bar"); // Light bar element for countdown

let songList = []; // Store the song list dynamically

// 🎉 Confetti Effect
function triggerConfetti() {
    confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
}

// ✅ Load the song list from the music folder
function loadSongList() {
    // Fetch all the MP3 files in the music folder dynamically
    fetch(musicFolder)
        .then(response => response.text())
        .then(data => {
            // Assuming your server lists the MP3 files in the folder
            const songs = data.split("\n").filter(song => song.endsWith(".mp3"));
            songList = songs.map(song => song.replace(".mp3", ""));
            console.log("✅ Song list loaded:", songList);

            // Enable play button after loading songs
            playBtn.disabled = false;
        })
        .catch(error => {
            console.error("Error loading song list:", error);
        });
}

// ✅ Play a random song from the list
function playRandomSong() {
    if (songList.length === 0) return; // Ensure the song list is not empty

    // Select a random song from the list
    const randomIndex = Math.floor(Math.random() * songList.length);
    const randomSong = songList[randomIndex];

    currentSongTitle = randomSong; // Set the current song title

    // Update the audio source and play it
    audioPlayer.src = `${musicFolder}/${randomSong}.mp3`;
    audioPlayer.play();

    // Show the light bar (timing of the 15-second countdown)
    lightBar.style.transition = "none";
    lightBar.style.width = "100%";
    setTimeout(() => {
        lightBar.style.transition = "width 15s linear";
        lightBar.style.width = "0%";
    }, 50);

    // Set timeout to stop the song after 15 seconds
    clearTimeout(roundTimeout);
    roundTimeout = setTimeout(stopSong, 15000);
}

// ✅ Stop the song and show correct answer
function stopSong() {
    audioPlayer.pause();
    answerText.textContent = `Correct Answer: ${currentSongTitle}`;
    correctAnswerDisplay.style.display = "block";

    // Trigger confetti
    triggerConfetti();

    // Update high score if needed
    if (currentScore > highScore) {
        highScore = currentScore;
        localStorage.setItem("high_score", highScore);
        highScoreDisplay.textContent = highScore;
    }
}

// ✅ Submit Guess
function checkAnswer() {
    if (songInput.value.trim().toLowerCase() === currentSongTitle.toLowerCase()) {
        currentScore++; // Only increment score if the guess is correct
        scoreDisplay.textContent = currentScore;
        stopSong();
        setTimeout(playRandomSong, 3000); // Start the next round after a 3-second delay
    }

    // Clear the input box after every attempt (correct or incorrect)
    songInput.value = "";
}

// ✅ Update autocomplete suggestions (Only matching beginning letters)
songInput.addEventListener("input", () => {
    const inputText = songInput.value.trim().toLowerCase();
    datalist.innerHTML = "";

    if (inputText.length === 0) return;

    const matchingSongs = songList.filter(song => song.toLowerCase().startsWith(inputText));

    matchingSongs.forEach(song => {
        let option = document.createElement("option");
        option.value = song; // Suggest the song title without the .mp3 extension
        datalist.appendChild(option);
    });
});

// ✅ Listen for Enter key and Submit button
songInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") checkAnswer();
});

submitBtn.addEventListener("click", checkAnswer); // ✅ Fixes submit button

playBtn.addEventListener("click", playRandomSong); // Activate play button

// Load the song list once the page is loaded
window.onload = loadSongList;
