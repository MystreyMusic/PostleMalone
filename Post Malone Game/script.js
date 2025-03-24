const clientId = "7e4affc97a3c47b2ade0c57322b0a407";
const redirectUri = "https://mystreymusic.github.io/PostleMalone/"; // Update if needed

let token = localStorage.getItem("spotify_token");
let player;
let score = 0;

const scoreDisplay = document.getElementById("score");
const songInput = document.getElementById("song-guess");
const timerBar = document.getElementById("light-bar");
const loginBtn = document.getElementById("login-btn");
const playBtn = document.getElementById("play-btn");

const playlistId = "7LlnI4VRxopojzcvDLvGko"; // Your Post Malone playlist

// 🔥 Redirects user to Spotify login
loginBtn.addEventListener("click", () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=streaming user-read-private user-read-email`;
    window.location.href = authUrl;
});

// 🔥 Retrieves Access Token from URL
function getAccessToken() {
    const hash = window.location.hash.substring(1).split("&").reduce((acc, item) => {
        let parts = item.split("=");
        acc[parts[0]] = decodeURIComponent(parts[1]);
        return acc;
    }, {});
    if (hash.access_token) {
        token = hash.access_token;
        localStorage.setItem("spotify_token", token);
        window.history.replaceState({}, document.title, "/"); // Removes token from URL
        initializePlayer();
    }
}

// 🔥 Initialize Spotify Web Playback SDK
window.onSpotifyWebPlaybackSDKReady = () => {
    if (token) {
        initializePlayer();
    }
};

function initializePlayer() {
    player = new Spotify.Player({
        name: "Postle Malone Game",
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
    });

    player.addListener("ready", ({ device_id }) => {
        console.log("Spotify Player Ready!", device_id);
        playBtn.disabled = false;
        playBtn.dataset.deviceId = device_id;
    });

    player.connect();
}

// 🔥 Fetches Playlist Tracks
async function fetchPlaylistTracks() {
    if (!token) return [];
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    return data.items.map(item => ({
        title: item.track.name,
        uri: item.track.uri
    }));
}

// 🔥 Plays a random 15-second clip
async function playRandomSong() {
    if (!token || !player) return;
    
    const tracks = await fetchPlaylistTracks();
    if (tracks.length === 0) return;

    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
    const positionMs = Math.floor(Math.random() * 30000); // Random start position

    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${playBtn.dataset.deviceId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ uris: [randomTrack.uri], position_ms: positionMs })
    });

    startTimer();
}

// 🔥 Starts Light Bar Timer
function startTimer() {
    timerBar.style.width = "100%";
    timerBar.style.transition = "none";
    setTimeout(() => {
        timerBar.style.transition = "width 15s linear";
        timerBar.style.width = "0%";
    }, 50);
}

// 🔥 Checks Answer
function checkAnswer() {
    let guess = songInput.value.trim().toLowerCase();
    fetchPlaylistTracks().then(tracks => {
        if (tracks.some(song => song.title.toLowerCase() === guess)) {
            score++;
            scoreDisplay.textContent = score;
            playRandomSong();
        }
    });
}

// 🔥 Event Listeners
playBtn.addEventListener("click", playRandomSong);
document.getElementById("submit-btn").addEventListener("click", checkAnswer);

// 🔥 Check if the user just logged in
getAccessToken();
