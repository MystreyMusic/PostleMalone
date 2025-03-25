let currentScore = 0; // Track current score
let highScore = localStorage.getItem("high_score") || 0;
let currentSongTitle = "";
let roundTimeout;
let audioPlayer = new Audio();
let playedSongs = []; // Store songs that have already been played to avoid repeats

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

// 🎶 Manually defined song list (update with your actual song names)
let songList = [
    "song1",  // Replace with your actual song names (without the file extension)
    "song2",
    "song3",
    // Add more songs here...
];

// 🎉 Confetti Effect
function triggerConfetti() {
    confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
}

// ✅ Play a random song from the list and random 15-second interval
function playRandomSong() {
    if (songList.length === 0) return; // Ensure the song list is not empty

    let randomSong = getRandomSong(); // Get a random song that hasn't been played yet

    if (!randomSong) return; // If there are no songs left, stop the game

    currentSongTitle = randomSong; // Set the current song title

    // Select a random start time for the 15-second segment (to avoid memorization)
    audioPlayer.src = `${musicFolder}/${randomSong}.mp3`;
    audioPlayer.load(); // Ensure the audio is properly loaded

    // Wait until the audio is loaded and then set the random start time
    audioPlayer.oncanplaythrough = () => {
        const randomStartTime = Math.floor(Math.random() * (audioPlayer.duration - 15));

        console.log("Playing song:", randomSong);
        console.log("Song URL:", audioPlayer.src);

        audioPlayer.currentTime = randomStartTime; // Set the start time for the song
        audioPlayer.play().then(() => {
            console.log("Song is playing!");
        }).catch(error => {
            console.error("Error playing the song:", error);
        });

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
    };
}

// ✅ Stop the song and show correct answer
function stopSong() {
    audioPlayer.pause();
    answerText.textContent = `Correct Answer: ${currentSongTitle}`;
    correctAnswerDisplay.style.display = "block";

    // Trigger confetti
    triggerConfetti();

    // Mark the song as played
    playedSongs.push(currentSongTitle);

    // Update high score if needed
    if (currentScore > highScore) {
        highScore = currentScore;
        localStorage.setItem("high_score", highScore);
        highScoreDisplay.textContent = highScore;
    }

    setTimeout(playRandomSong, 3000); // Move to the next round after 3 seconds
}

// ✅ Get a random song from the song list, ensuring no repeats
function getRandomSong() {
    // Filter out songs that have already been played
    const remainingSongs = songList.filter(song => !playedSongs.includes(song));

    if (remainingSongs.length === 0) {
        alert("All songs have been played! Resetting the game.");
        playedSongs = []; // Reset played songs if all songs have been played
        return getRandomSong(); // Recursively call to start again
    }

    const randomIndex = Math.floor(Math.random() * remainingSongs.length);
    return remainingSongs[randomIndex];
}

// ✅ Submit Guess
function checkAnswer() {
    if (songInput.value.trim().toLowerCase() === currentSongTitle.toLowerCase()) {
        currentScore++; // Only increment score if the guess is correct
        scoreDisplay.textContent = currentScore;
        stopSong();
    } else {
        songInput.value = ""; // Clear input if the guess is incorrect
        songInput.style.backgroundColor = "red"; // Flash the input red
        setTimeout(() => songInput.style.backgroundColor = "", 500); // Reset the input box color after 500ms
    }
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
window.onload = () => {
    // Song list is already loaded manually above, so no need for fetch anymore
    playBtn.disabled = false; // Enable play button
};
