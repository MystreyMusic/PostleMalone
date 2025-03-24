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

let player;
let deviceId = null;
let currentSongTitle = "";

// 🎵 Song Titles List
const songList = [
    "92 Explorer", "A Thousand Bad Times", "Ain’t How It Ends", "Allergic",
    "Back To Texas", "Ball For Me (feat. Nicki Minaj)", "Better Now", "Big Lie",
    "Blame It On Me", "Broken Whiskey Glass", "Buyer Beware", "California Sober (Feat. Chris Stapleton)",
    "Candy Paint", "Chemical", "Circles", "Cold", "Congratulations (feat. Quavo)",
    "Cooped Up (with Roddy Ricch)", "Dead At The Honky Tonk", "Deja Vu", "Devil I've Been (Feat. ERNEST)",
    "Die For Me (feat. Future & Halsey)", "Don't Understand", "Enemies (feat. DaBaby)", 
    "Enough Is Enough", "Euthanasia", "Fallin’ In Love", "Feeling Whitney", "Go Flex", 
    "Goodbyes (feat. Young Thug)", "Hollywood's Bleeding", "I Fall Apart", "I Had Some Help (Feat. Morgan Wallen)",
    "I Like You (A Happier Song) (with Doja Cat)", "Insane", "Jonestown (Interlude)", 
    "Love/Hate Letter To Alcohol (with Fleet Foxes)", "Mourning", "Overdrive", "Psycho (feat. Ty Dolla $ign)", 
    "Sunflower - Spider-Man: Into the Spider-Verse", "Take What You Want (feat. Ozzy Osbourne & Travis Scott)",
    "White Iverson", "Wow.", "rockstar (feat. 21 Savage)"
];

// 🎉 Confetti Effect
function triggerConfetti() {
    confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
}

// ✅ Redirect user to Spotify login
loginBtn.addEventListener("click", () => {
    console.log("Login button clicked. Redirecting to Spotify...");
    const authUrl = `https://accounts.spotify.com/authorize` +
        `?client_id=${clientId}` +
        `&response_type=token` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=streaming%20user-read-private%20user-read-email%20user-modify-playback-state%20playlist-read-private%20user-read-playback-state`;

    window.location.href = authUrl;
});

// ✅ Extract and store access token
function getAccessToken() {
    console.log("Checking for access token...");
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
        console.log("Access token obtained.");
    }
}

// ✅ Check if the token is expired
function isTokenExpired() {
    return !token || !tokenExpiration || Date.now() > tokenExpiration;
}

// ✅ Prevent Login Loop
function ensureToken() {
    if (isTokenExpired()) {
        localStorage.removeItem("spotify_token");
        localStorage.removeItem("spotify_token_expiration");
        loginBtn.textContent = "Login to Spotify";  
    }
}

// ✅ Initialize Spotify Web Playback SDK
window.onSpotifyWebPlaybackSDKReady = () => {
    console.log("Spotify Web Playback SDK is ready.");
    ensureToken();
    initializePlayer();
};

// ✅ Initialize Spotify Player
function initializePlayer() {
    if (!token) return;

    console.log("Initializing Spotify player...");
    player = new Spotify.Player({
        name: "Postle Malone Game",
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
    });

    player.addListener("ready", ({ device_id }) => {
        deviceId = device_id;
        console.log(`Spotify Player connected with device ID: ${deviceId}`);
        playBtn.disabled = false;
        transferPlayback(); // ✅ Transfer playback to the web player
    });

    player.connect().then(success => {
        if (success) {
            console.log("Spotify player connected successfully.");
        } else {
            console.error("Spotify player connection failed.");
        }
    });
}

// ✅ Transfer Playback to Web Player
function transferPlayback() {
    fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ device_ids: [deviceId], play: false })
    })
    .then(response => {
        if (response.status === 204) {
            console.log("Playback transferred to web player.");
        } else {
            console.error("Failed to transfer playback.", response);
        }
    })
    .catch(error => console.error("Error transferring playback:", error));
}

// ✅ Fetch songs from the playlist and play a random one
function fetchPlaylistTracks() {
    fetch("https://api.spotify.com/v1/playlists/7LlnI4VRxopojzcvDLvGko/tracks", {
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        if (!data.items || data.items.length === 0) {
            console.error("No songs found in the playlist.");
            return;
        }
        
        let trackUris = data.items.map(item => item.track.uri);
        let randomTrackUri = trackUris[Math.floor(Math.random() * trackUris.length)];
        playTrack(randomTrackUri);
    })
    .catch(error => console.error("Error fetching playlist tracks:", error));
}

// ✅ Play a track by URI
function playTrack(trackUri) {
    if (!deviceId) {
        console.error("Device ID not set. Cannot play song.");
        return;
    }

    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ uris: [trackUri], position_ms: Math.floor(Math.random() * 15000) })
    })
    .then(response => response.status === 204 ? console.log("Song is playing!") : console.error("Failed to play song:", response))
    .catch(error => console.error("Error playing song:", error));
}

// ✅ Play button event
playBtn.addEventListener("click", () => {
    console.log("Play button clicked. Fetching a song from the playlist...");
    fetchPlaylistTracks();
});

getAccessToken();
