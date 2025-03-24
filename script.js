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
    const authUrl = `https://accounts.spotify.com/authorize` +
        `?client_id=${clientId}` +
        `&response_type=token` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=streaming%20user-read-private%20user-read-email%20user-modify-playback-state%20playlist-read-private%20user-read-playback-state`;

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
    ensureToken();
    initializePlayer();
};

// ✅ Initialize Spotify Player
function initializePlayer() {
    if (!token) return;

    player = new Spotify.Player({
        name: "Postle Malone Game",
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
    });

    player.addListener("ready", ({ device_id }) => {
        deviceId = device_id;
        playBtn.disabled = false;
    });

    player.connect();
}

// ✅ Play a random song for 15 seconds
async function playRandomSong() {
    if (!deviceId) return;

    const response = await fetch(`https://api.spotify.com/v1/playlists/7LlnI4VRxopojzcvDLvGko/tracks`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await response.json();
    const randomTrack = data.items[Math.floor(Math.random() * data.items.length)];
    const randomStartMs = Math.floor(Math.random() * 30000);
    currentSongTitle = randomTrack.track.name;

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ uris: [`spotify:track:${randomTrack.track.id}`], position_ms: randomStartMs })
    });

    // Set a timer to stop the song after 15 seconds
    setTimeout(() => stopSong(currentSongTitle), 15000);
}

// ✅ Stop Song and Show Correct Answer
async function stopSong(correctTitle) {
    await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
    });

    answerText.textContent = correctTitle;
    correctAnswerDisplay.style.visibility = "visible";

    // Clear the text box immediately after the round ends
    songInput.value = "";

    // Reset the game or proceed to the next round
    setTimeout(() => {
        correctAnswerDisplay.style.visibility = "hidden"; // Hide the correct answer for next round
        playRandomSong();
    }, 3000); // Start a new song after a 3-second delay
}

// ✅ Check answer
function checkAnswer() {
    let guessedSong = songInput.value.trim().toLowerCase();
    if (guessedSong === currentSongTitle.toLowerCase()) {
        triggerConfetti();

        let currentScore = parseInt(scoreDisplay.textContent) + 1;
        scoreDisplay.textContent = currentScore;

        if (currentScore > highScore) {
            highScore = currentScore;
            localStorage.setItem("high_score", highScore);
            highScoreDisplay.textContent = highScore;
            new Audio("congratulations.mp3").play();
        }

        songInput.value = "";
        setTimeout(() => {
            correctAnswerDisplay.style.visibility = "hidden"; // Hide the correct answer for next round
            playRandomSong();
        }, 3000); // Start new song after 3-second delay
    } else {
        songInput.classList.add("shake");
        setTimeout(() => songInput.classList.remove("shake"), 500);
        songInput.value = "";
    }
}

// ✅ Autocomplete for song input
songInput.addEventListener("input", () => {
    let inputText = songInput.value.toLowerCase();
    datalist.innerHTML = songList.filter(song => song.toLowerCase().startsWith(inputText))
        .map(song => `<option value="${song}"></option>`).join("");
});

getAccessToken();

// ✅ Handle Enter key and submit button
document.getElementById("submit-btn").addEventListener("click", checkAnswer);
songInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") checkAnswer();
});
