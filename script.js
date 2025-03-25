const clientId = "7e4affc97a3c47b2ade0c57322b0a407";
const redirectUri = "https://mystreymusic.github.io/PostleMalone/";

let token = localStorage.getItem("spotify_token");
let tokenExpiration = localStorage.getItem("spotify_token_expiration");
let highScore = localStorage.getItem("high_score") || 0;
let currentScore = 0; // Track current score

const loginBtn = document.getElementById("login-btn");
const playBtn = document.getElementById("play-btn");
const songInput = document.getElementById("song-guess");
const datalist = document.getElementById("song-list");
const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("high-score");
const lightBar = document.getElementById("light-bar");
const correctAnswerDisplay = document.getElementById("correct-answer");
const answerText = document.getElementById("answer-text");
const submitBtn = document.getElementById("submit-btn"); // ✅ Added submit button reference

let player;
let deviceId = null;
let currentSongTitle = "";
let songList = [];
let playerConnected = false;
let roundTimeout;

const playlistId = "7LlnI4VRxopojzcvDLvGko"; // Post Malone playlist ✅

// 🎉 Confetti Effect
function triggerConfetti() {
    confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
}

// ✅ Redirect user to Spotify login
loginBtn.addEventListener("click", () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=streaming%20user-read-private%20user-read-email%20user-modify-playback-state%20playlist-read-private%20user-read-playback-state`;
    window.location.href = authUrl;
});

// ✅ Extract and store access token
function getAccessToken() {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const expiresIn = hashParams.get("expires_in");

    if (accessToken) {
        token = accessToken;
        tokenExpiration = Date.now() + parseInt(expiresIn) * 1000;

        localStorage.setItem("spotify_token", token);
        localStorage.setItem("spotify_token_expiration", tokenExpiration);

        window.history.replaceState({}, document.title, redirectUri);
        loginBtn.textContent = "Login Successful";
        fetchPlaylistSongs();
    }
}

// ✅ Check if token is expired
function isTokenExpired() {
    return !token || !tokenExpiration || Date.now() > tokenExpiration;
}

// ✅ Prevent Login Loop
function ensureToken() {
    if (isTokenExpired()) {
        console.warn("Spotify Token Expired. Redirecting to login...");
        localStorage.removeItem("spotify_token");
        localStorage.removeItem("spotify_token_expiration");
        loginBtn.textContent = "Login to Spotify";  
    }
}

// ✅ Initialize Spotify Web Playback SDK
window.onSpotifyWebPlaybackSDKReady = () => {
    console.log("✅ Spotify Web Playback SDK is ready.");
    ensureToken();
    if (!playerConnected) {
        initializePlayer();
    }
};

// ✅ Fetch playlist songs for autocomplete
async function fetchPlaylistSongs() {
    if (!token) return;
    try {
        const response = await fetch("songs_list.txt");
        const text = await response.text();
        songList = text.split("\n").map(song => song.trim()).filter(song => song.length > 0);

        console.log("✅ Songs list loaded:", songList);
    } catch (error) {
        console.error("❌ Error loading songs list:", error);
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
        option.value = song;
        datalist.appendChild(option);
    });
});

// ✅ Initialize Spotify Player
function initializePlayer() {
    if (!token || playerConnected) return;

    player = new Spotify.Player({
        name: "Postle Malone Game",
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
    });

    player.addListener("ready", ({ device_id }) => {
        if (!playerConnected) {
            deviceId = device_id;
            console.log("✅ Player is ready. Device ID:", deviceId);
            playBtn.disabled = false;
            transferPlayback();
            playerConnected = true;
        }
    });

    player.connect().then(success => {
        if (success) {
            console.log("✅ Spotify Player connected successfully.");
        } else {
            console.error("❌ ERROR: Failed to connect player.");
        }
    });
}

// ✅ Transfer Playback to Browser
async function transferPlayback() {
    if (!token || !deviceId) return;

    try {
        console.log(`🔄 Transferring playback to browser (Device ID: ${deviceId})...`);

        await fetch("https://api.spotify.com/v1/me/player/pause", {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` }
        });

        await fetch("https://api.spotify.com/v1/me/player", {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ device_ids: [deviceId], play: false }) 
        });

        console.log("✅ Playback transferred successfully.");
    } catch (error) {
        console.error("❌ Error transferring playback:", error);
    }
}

// ✅ Play a random song from the playlist
async function playRandomSong() {
    if (!token || !deviceId) return;

    try {
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error();

        const data = await response.json();
        const tracks = data.items;
        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];

        const durationMs = randomTrack.track.duration_ms;
        const randomStartMs = Math.floor(Math.random() * (durationMs - 15000)); // Ensures start position allows full 15s

        currentSongTitle = randomTrack.track.name;

        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ uris: [`spotify:track:${randomTrack.track.id}`], position_ms: randomStartMs })
        });

        lightBar.style.transition = "none";
        lightBar.style.width = "100%";
        setTimeout(() => {
            lightBar.style.transition = "width 15s linear";
            lightBar.style.width = "0%";
        }, 50);

        clearTimeout(roundTimeout);
        roundTimeout = setTimeout(stopSong, 15000);
    } catch (error) {
        console.error("❌ Error playing track:", error);
    }
}

// ✅ Stop song and show correct answer
function stopSong() {
    fetch("https://api.spotify.com/v1/me/player/pause", {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
    });

    answerText.textContent = `Correct Answer: ${currentSongTitle}`;
    correctAnswerDisplay.style.display = "block";

    // Update the score
    currentScore++;
    scoreDisplay.textContent = currentScore;

    // Trigger confetti
    triggerConfetti();

    // Update high score if needed
    if (currentScore > highScore) {
        highScore = currentScore;
        localStorage.setItem("high_score", highScore);
        highScoreDisplay.textContent = highScore;
    }
}

// ✅ Submit Guess (Now works with button)
function checkAnswer() {
    if (songInput.value.trim().toLowerCase() === currentSongTitle.toLowerCase()) {
        stopSong();
        setTimeout(playRandomSong, 3000);
    }
    songInput.value = "";
}

songInput.addEventListener("keypress", (e) => { if (e.key === "Enter") checkAnswer(); });
submitBtn.addEventListener("click", checkAnswer); // ✅ Fixes submit button

playBtn.addEventListener("click", playRandomSong);
getAccessToken();
