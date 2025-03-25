const clientId = "7e4affc97a3c47b2ade0c57322b0a407";
const redirectUri = "https://mystreymusic.github.io/PostleMalone/";

let token = localStorage.getItem("spotify_token");
let tokenExpiration = localStorage.getItem("spotify_token_expiration");
let highScore = localStorage.getItem("high_score") || 0;

const loginBtn = document.getElementById("login-btn");
const playBtn = document.getElementById("play-btn");
const songInput = document.getElementById("song-guess");
const datalist = document.getElementById("song-list");
const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("high-score");
const lightBar = document.getElementById("light-bar");
const correctAnswerDisplay = document.getElementById("correct-answer");
const answerText = document.getElementById("answer-text");
const submitBtn = document.getElementById("submit-btn");

let player;
let deviceId = null;
let currentSongTitle = "";
let songList = [];
let playerConnected = false;
let roundTimeout;

const playlistId = "7LlnI4VRxopojzcvDLvGko";

// ✅ Confetti Effect
function triggerConfetti() {
    confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
}

// ✅ Redirect to Spotify Login
loginBtn.addEventListener("click", () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=streaming%20user-read-private%20user-read-email%20user-modify-playback-state%20playlist-read-private%20user-read-playback-state`;
    window.location.href = authUrl;
});

// ✅ Extract & Store Token
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

// ✅ Check Token Expiry
function isTokenExpired() {
    return !token || !tokenExpiration || Date.now() > tokenExpiration;
}

// ✅ Prevent Login Loop & Expired Token Errors
function ensureToken() {
    if (isTokenExpired()) {
        console.warn("Spotify Token Expired. Redirecting to login...");
        localStorage.removeItem("spotify_token");
        localStorage.removeItem("spotify_token_expiration");
        loginBtn.textContent = "Login to Spotify";  
    } else {
        loginBtn.textContent = "Login Successful";
    }
}

// ✅ Stop Song Function (Moved Above to Fix Undefined Error)
function stopSong() {
    fetch("https://api.spotify.com/v1/me/player/pause", {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
    });

    answerText.textContent = `Correct Answer: ${currentSongTitle}`;
    correctAnswerDisplay.style.display = "block";
}

// ✅ Initialize Spotify Web Playback SDK
window.onSpotifyWebPlaybackSDKReady = () => {
    console.log("✅ Spotify Web Playback SDK is ready.");
    ensureToken();
    if (!playerConnected) {
        initializePlayer();
    }
};

// ✅ Fetch Playlist Songs for Autocomplete
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

// ✅ Autocomplete (Fixed Matching Only Beginning)
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
        }
    });
}

// ✅ Play a Random Song (Fixed Timer & Logging)
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
        const randomStartMs = Math.floor(Math.random() * (durationMs - 15000));

        currentSongTitle = randomTrack.track.name;
        console.log("🎵 Current Song:", currentSongTitle); // ✅ Log song title

        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ uris: [`spotify:track:${randomTrack.track.id}`], position_ms: randomStartMs })
        });

        lightBar.style.transform = "translateX(100%)";
        setTimeout(() => {
            lightBar.style.transition = "transform 15s linear";
            lightBar.style.transform = "translateX(0%)";
        }, 50);

        clearTimeout(roundTimeout);
        roundTimeout = setTimeout(stopSong, 15000);
    } catch (error) {
        console.error("❌ Error playing track:", error);
    }
}

// ✅ Submit Guess
submitBtn.addEventListener("click", checkAnswer);
songInput.addEventListener("keypress", (e) => { if (e.key === "Enter") checkAnswer(); });

playBtn.addEventListener("click", playRandomSong);
getAccessToken();
