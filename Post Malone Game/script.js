const clientId = "7e4affc97a3c47b2ade0c57322b0a407";
const redirectUri = "https://mystreymusic.github.io/PostleMalone/"; // ✅ Must match Developer Dashboard

let token = localStorage.getItem("spotify_token");
let tokenExpiration = localStorage.getItem("spotify_token_expiration");

let player;
let score = 0;

const scoreDisplay = document.getElementById("score");
const songInput = document.getElementById("song-guess");
const timerBar = document.getElementById("light-bar");
const loginBtn = document.getElementById("login-btn");
const playBtn = document.getElementById("play-btn");

const playlistId = "7LlnI4VRxopojzcvDLvGko"; // Your Post Malone playlist

// ✅ Redirect user to Spotify login
loginBtn.addEventListener("click", () => {
    const authUrl = `https://accounts.spotify.com/authorize` +
        `?client_id=${clientId}` +
        `&response_type=token` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=streaming%20user-read-private%20user-read-email`;

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

        window.history.replaceState({}, document.title, redirectUri); // ✅ Clean URL
        initializePlayer();
    }
}

// ✅ Checks if the token is expired
function isTokenExpired() {
    return !token || !tokenExpiration || Date.now() > tokenExpiration;
}

// ✅ Initialize Spotify Web Playback SDK
window.onSpotifyWebPlaybackSDKReady = () => {
    if (!isTokenExpired()) {
        initializePlayer();
    } else {
        console.warn("Spotify Token Expired. Please log in again.");
        localStorage.removeItem("spotify_token");
        localStorage.removeItem("spotify_token_expiration");
    }
};

function initializePlayer() {
    player = new Spotify.Player({
        name: "Postle Malone Game",
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
    });

    player.addListener("ready", ({ device_id }) => {
        console.log("Spotify Player Ready! Device ID:", device_id);
        playBtn.disabled = false;
        playBtn.dataset.deviceId = device_id;
    });

    player.addListener("not_ready", () => console.error("Spotify Player Not Ready"));

    player.addListener("authentication_error", ({ message }) => {
        console.error("Spotify Authentication Error:", message);
        localStorage.removeItem("spotify_token"); // ✅ Clear invalid token
        alert("Spotify session expired. Please log in again.");
    });

    player.connect();
}

// ✅ Check if user just logged in and extract token
getAccessToken();
