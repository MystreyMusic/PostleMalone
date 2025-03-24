const clientId = "7e4affc97a3c47b2ade0c57322b0a407";
const redirectUri = "https://mystreymusic.github.io/PostleMalone/";

let token = localStorage.getItem("spotify_token");
let tokenExpiration = localStorage.getItem("spotify_token_expiration");
let highScore = localStorage.getItem("high_score") || 0;

const loginBtn = document.getElementById("login-btn");
const playBtn = document.getElementById("play-btn");
const songInput = document.getElementById("song-guess");
const scoreDisplay = document.getElementById("score");
const lightBar = document.getElementById("light-bar");
const datalist = document.getElementById("song-list");

let player;
let deviceId = null;
let currentSongTitle = "";
let songList = [];

// 🎉 **Confetti Effect**
function triggerConfetti() {
    confetti({
        particleCount: 200,
        spread: 70,
        origin: { y: 0.6 }
    });
}

// ✅ **Redirect user to Spotify login**
loginBtn.addEventListener("click", () => {
    const authUrl = `https://accounts.spotify.com/authorize` +
        `?client_id=${clientId}` +
        `&response_type=token` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=streaming%20user-read-private%20user-read-email%20user-modify-playback-state%20playlist-read-private%20user-read-playback-state`;

    window.location.href = authUrl;
});

// ✅ **Extract and store access token**
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
        fetchPlaylistSongs();
    } else {
        console.error("Failed to get Spotify token.");
    }
}

// ✅ **Check if the token is expired**
function isTokenExpired() {
    return !token || !tokenExpiration || Date.now() > tokenExpiration;
}

// ✅ **Ensure token is valid**
function ensureToken() {
    if (isTokenExpired()) {
        console.warn("Spotify Token Expired. Redirecting to login...");
        localStorage.removeItem("spotify_token");
        localStorage.removeItem("spotify_token_expiration");
        alert("Your session expired. Please log in again.");
        window.location.href = redirectUri;
    }
}

// ✅ **Initialize Spotify Web Playback SDK**
window.onSpotifyWebPlaybackSDKReady = () => {
    console.log("✅ Spotify Web Playback SDK is ready.");
    ensureToken();
    initializePlayer();
};

// ✅ **Fetch playlist songs for autocomplete**
async function fetchPlaylistSongs() {
    try {
        const response = await fetch(`https://api.spotify.com/v1/playlists/7LlnI4VRxopojzcvDLvGko/tracks`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("❌ Failed to fetch playlist songs");

        const data = await response.json();
        songList = data.items.map(item => item.track.name.toLowerCase());
        console.log("🎵 Fetched song list for autocomplete:", songList);
    } catch (error) {
        console.error(error);
    }
}

function initializePlayer() {
    if (!token) {
        console.error("❌ Spotify token is missing. Please log in.");
        return;
    }

    if (typeof Spotify === "undefined") {
        console.error("❌ Spotify SDK not loaded.");
        return;
    }

    player = new Spotify.Player({
        name: "Postle Malone Game",
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
    });

    player.addListener("ready", ({ device_id }) => {
        console.log("🎵 Spotify Player Ready! Device ID:", device_id);
        deviceId = device_id;
        playBtn.disabled = false;
    });

    player.addListener("not_ready", () => console.error("❌ Spotify Player Not Ready"));
    player.addListener("authentication_error", ({ message }) => {
        console.error("❌ Spotify Authentication Error:", message);
        alert("Spotify session expired. Please log in again.");
        localStorage.removeItem("spotify_token");
        window.location.href = redirectUri;
    });

    player.connect().then(success => {
        if (success) {
            console.log("✅ Successfully connected to Spotify!");
        } else {
            console.error("❌ Failed to connect to Spotify.");
        }
    });
}

// ✅ **Play a random song at a random timestamp for 15 seconds**
playBtn.addEventListener("click", async () => {
    if (!deviceId) {
        console.error("❌ No Spotify device ID available.");
        alert("Spotify Player not ready. Try logging in again.");
        return;
    }

    console.log("🎵 Fetching playlist tracks...");

    try {
        const response = await fetch(`https://api.spotify.com/v1/playlists/7LlnI4VRxopojzcvDLvGko/tracks`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("❌ Failed to fetch playlist tracks");

        const data = await response.json();
        const tracks = data.items;

        if (tracks.length === 0) {
            console.error("❌ No tracks found in the playlist.");
            return;
        }

        // 🎶 **Pick a random track**
        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
        const randomStartMs = Math.floor(Math.random() * 30000);
        currentSongTitle = randomTrack.track.name.toLowerCase();

        console.log(`🎵 Now Playing: ${currentSongTitle} at ${randomStartMs}ms`);

        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ uris: [`spotify:track:${randomTrack.track.id}`], position_ms: randomStartMs })
        });

        lightBar.style.transition = "width 15s linear";
        lightBar.style.width = "0%";

        setTimeout(async () => {
            await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            console.log("⏹️ Stopped playback after 15 seconds");
        }, 15000);

    } catch (error) {
        console.error("❌ Error fetching or playing track:", error);
    }
});

// ✅ **Autocomplete Function**
songInput.addEventListener("input", () => {
    let inputValue = songInput.value.toLowerCase();
    let suggestions = songList.filter(song => song.startsWith(inputValue));

    datalist.innerHTML = "";
    suggestions.forEach(song => {
        let option = document.createElement("option");
        option.value = song;
        datalist.appendChild(option);
    });
});

// ✅ **Check answer on submit or Enter key**
function checkAnswer() {
    let guessedSong = songInput.value.trim().toLowerCase();
    if (guessedSong === currentSongTitle) {
        triggerConfetti();
        let currentScore = parseInt(scoreDisplay.textContent) + 1;
        scoreDisplay.textContent = currentScore;

        if (currentScore > highScore) {
            highScore = currentScore;
            localStorage.setItem("high_score", highScore);
        }

        songInput.value = "";
    }
}

document.getElementById("submit-btn").addEventListener("click", checkAnswer);
songInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") checkAnswer();
});

// ✅ **Check user login and extract token**
getAccessToken();
