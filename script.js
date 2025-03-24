const clientId = "7e4affc97a3c47b2ade0c57322b0a407";
const redirectUri = "https://mystreymusic.github.io/PostleMalone/";

let token = localStorage.getItem("spotify_token");
let tokenExpiration = localStorage.getItem("spotify_token_expiration");

const loginBtn = document.getElementById("login-btn");
const playBtn = document.getElementById("play-btn");
const songInput = document.getElementById("song-guess");
const scoreDisplay = document.getElementById("score");
const lightBar = document.getElementById("light-bar");

let player;
let deviceId = null;

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

    player.connect();
}

// ✅ **Play a random song at a random timestamp for 15 seconds**
playBtn.addEventListener("click", async () => {
    if (!deviceId) {
        console.error("❌ No Spotify device ID available.");
        alert("Spotify Player not ready. Try logging in again.");
        return;
    }

    console.log("🎵 Fetching playlist tracks...");

    // 🔥 **Get playlist tracks**
    try {
        const playlistResponse = await fetch(`https://api.spotify.com/v1/playlists/7LlnI4VRxopojzcvDLvGko/tracks`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!playlistResponse.ok) throw new Error(`❌ Failed to fetch playlist tracks`);

        const playlistData = await playlistResponse.json();
        const tracks = playlistData.items.map(item => item.track.id);

        if (tracks.length === 0) {
            console.error("❌ No tracks found in the playlist.");
            return;
        }

        // 🎶 **Pick a random track**
        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
        const randomStartMs = Math.floor(Math.random() * 30000); // Start at a random point within the first 30 sec

        console.log(`🎵 Playing track: ${randomTrack} at ${randomStartMs}ms`);

        // ✅ **Start playback**
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ uris: [`spotify:track:${randomTrack}`], position_ms: randomStartMs })
        });

        // 🔥 **Light Bar Animation**
        lightBar.style.transition = "width 15s linear";
        lightBar.style.width = "0%";

        // ⏳ **Stop playback after 15 seconds**
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

// ✅ **Submit button click event - Check answer and trigger confetti**
document.getElementById("submit-btn").addEventListener("click", () => {
    const guessedSong = songInput.value.trim().toLowerCase();
    const correctSong = "congratulations"; // Replace this with dynamic checking

    if (guessedSong === correctSong) {
        triggerConfetti(); // 🎉 Confetti on correct answer
        scoreDisplay.textContent = parseInt(scoreDisplay.textContent) + 1;
        songInput.value = ""; // Clear input after correct guess
    }
});

// ✅ **Check if user just logged in and extract token**
getAccessToken();
