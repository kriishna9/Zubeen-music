let player = null;

let playerReady = false;

let results = [];

let currentIndex = -1;

let searching = false;


/* =====================================================
   ELEMENTS
===================================================== */

const topSearch =
  document.getElementById("topSearch");

const searchBox =
  document.getElementById("searchBox");

const searchInput =
  document.getElementById("search");

const searchButton =
  document.getElementById("searchButton");

const openSearch =
  document.getElementById("openSearch");

const closeSearch =
  document.getElementById("closeSearch");

const searchStatus =
  document.getElementById("searchStatus");

const songsContainer =
  document.getElementById("songs");

const nowTitle =
  document.getElementById("nowTitle");

const nowArtist =
  document.getElementById("nowArtist");

const playButton =
  document.getElementById("play");

const prevButton =
  document.getElementById("prev");

const nextButton =
  document.getElementById("next");

const progress =
  document.getElementById("progress");

const currentTime =
  document.getElementById("current");

const durationTime =
  document.getElementById("duration");

const volume =
  document.getElementById("volume");


/* =====================================================
   SEARCH OPEN
===================================================== */

openSearch.addEventListener(
  "click",
  () => {

    topSearch.classList.add(
      "search-open"
    );

    setTimeout(
      () => searchInput.focus(),
      400
    );

  }
);


/* =====================================================
   SEARCH CLOSE
===================================================== */

closeSearch.addEventListener(
  "click",
  () => {

    topSearch.classList.remove(
      "search-open"
    );

    searchInput.value = "";

  }
);


/* =====================================================
   ENTER
===================================================== */

searchInput.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      event.preventDefault();

      searchSongs();

    }

    if (
      event.key === "Escape"
    ) {

      topSearch.classList.remove(
        "search-open"
      );

    }

  }
);


/* =====================================================
   BUTTON
===================================================== */

searchButton.addEventListener(
  "click",
  searchSongs
);


/* =====================================================
   YOUTUBE API
===================================================== */

function onYouTubeIframeAPIReady() {

  console.log(
    "YouTube API ready"
  );

  player =
    new YT.Player(
      "yt-player",
      {

        width: "80",

        height: "50",

        videoId: "",

        playerVars: {

          autoplay: 0,

          controls: 1,

          playsinline: 1,

          rel: 0

        },

        events: {

          onReady:
            onPlayerReady,

          onStateChange:
            onPlayerStateChange,

          onError:
            onPlayerError

        }

      }
    );

}


/* =====================================================
   PLAYER READY
===================================================== */

function onPlayerReady() {

  playerReady = true;

  player.setVolume(
    Number(volume.value)
  );

}


/* =====================================================
   PLAYER STATE
===================================================== */

function onPlayerStateChange(
  event
) {

  if (
    event.data ===
    YT.PlayerState.PLAYING
  ) {

    playButton.textContent =
      "⏸";

    renderResults();

  }

  else if (
    event.data ===
    YT.PlayerState.PAUSED
  ) {

    playButton.textContent =
      "▶";

    renderResults();

  }

  else if (
    event.data ===
    YT.PlayerState.ENDED
  ) {

    playButton.textContent =
      "▶";

    playNext();

  }

}


/* =====================================================
   PLAYER ERROR
===================================================== */

function onPlayerError(
  event
) {

  console.error(
    "YouTube player error:",
    event.data
  );

  nowArtist.textContent =
    "This video cannot be played";

}


/* =====================================================
   SEARCH
===================================================== */

async function searchSongs() {

  const query =
    searchInput.value.trim();


  if (!query) {

    searchStatus.textContent =
      "Type a song name first";

    return;

  }


  if (searching) {

    return;

  }


  searching = true;


  searchBox.classList.add(
    "loading"
  );


  searchStatus.textContent =
    `Searching "${query}"...`;


  songsContainer.innerHTML = `

        <div class="empty-state">

            <h3>
                Searching...
            </h3>

            <p>
                Finding Zubeen Garg songs
            </p>

        </div>

    `;


  try {

    /*
     IMPORTANT:
     This request goes to YOUR
     Node.js server.
    */

    const url =
      "/api/search?q=" +
      encodeURIComponent(query);


    console.log(
      "Searching:",
      url
    );


    const response =
      await fetch(url);


    if (!response.ok) {

      const errorText =
        await response.text();

      throw new Error(
        errorText ||
        `Server error ${response.status}`
      );

    }


    const data =
      await response.json();


    console.log(
      "Search response:",
      data
    );


    results =
      Array.isArray(
        data.results
      )
        ? data.results.slice(0, 2)
        : [];


    if (
      results.length === 0
    ) {

      searchStatus.textContent =
        "No Zubeen song found";

      songsContainer.innerHTML = `

                <div class="empty-state">

                    <h3>
                        No results
                    </h3>

                    <p>
                        Try another song name.
                    </p>

                </div>

            `;

      return;

    }


    searchStatus.textContent =
      `${results.length} recommendations`;


    currentIndex = -1;


    renderResults();

  }


  catch (error) {

    console.error(
      "SEARCH ERROR:",
      error
    );


    searchStatus.textContent =
      "Search failed";


    songsContainer.innerHTML = `

            <div class="empty-state">

                <h3>
                    Search unavailable
                </h3>

                <p>
                    ${escapeHTML(
      error.message
    )}
                </p>

            </div>

        `;

  }


  finally {

    searching = false;

    searchBox.classList.remove(
      "loading"
    );

  }

}


/* =====================================================
   RENDER
===================================================== */

function renderResults() {

  songsContainer.innerHTML = "";


  results
    .slice(0, 2)
    .forEach(
      (song, index) => {

        const div =
          document.createElement(
            "div"
          );


        div.className =
          "song";


        if (
          index === currentIndex
        ) {

          div.classList.add(
            "active"
          );

        }


        let icon = "▶";


        if (
          index === currentIndex &&
          playerReady
        ) {

          try {

            if (
              player.getPlayerState() ===
              YT.PlayerState.PLAYING
            ) {

              icon = "⏸";

            }

          }

          catch { }

        }


        div.innerHTML = `

                    <span class="num">

                        ${String(
          index + 1
        ).padStart(
          2,
          "0"
        )}

                    </span>


                    <div class="song-info">

                        <span class="song-title">

                            ${escapeHTML(
          cleanTitle(
            song.title
          )
        )}

                        </span>


                        <span class="song-artist">

                            Zubeen Garg

                        </span>


                        <span class="song-channel">

                            ${escapeHTML(
          song.channel ||
          "YouTube"
        )}

                        </span>

                    </div>


                    <button
                        type="button"
                    >
                        ${icon}
                    </button>

                `;


        div.addEventListener(
          "click",
          () => {

            playSong(index);

          }
        );


        songsContainer.appendChild(
          div
        );

      }
    );

}


/* =====================================================
   PLAY SONG
===================================================== */

function playSong(index) {

  if (!playerReady) {

    nowArtist.textContent =
      "YouTube player loading...";

    return;

  }


  const song =
    results[index];


  if (
    !song ||
    !song.videoId
  ) {

    return;

  }


  currentIndex =
    index;


  nowTitle.textContent =
    cleanTitle(
      song.title
    );


  nowArtist.textContent =
    song.channel ||
    "Zubeen Garg";


  renderResults();


  player.loadVideoById(
    song.videoId
  );

}


/* =====================================================
   PLAY / PAUSE
===================================================== */

playButton.addEventListener(
  "click",
  () => {

    if (!playerReady) {

      return;

    }


    if (
      currentIndex === -1
    ) {

      if (
        results.length
      ) {

        playSong(0);

      }

      return;

    }


    const state =
      player.getPlayerState();


    if (
      state ===
      YT.PlayerState.PLAYING
    ) {

      player.pauseVideo();

    }

    else {

      player.playVideo();

    }

  }
);


/* =====================================================
   NEXT
===================================================== */

function playNext() {

  if (
    !results.length
  ) {

    return;

  }


  let index =
    currentIndex + 1;


  if (
    index >= results.length
  ) {

    index = 0;

  }


  playSong(index);

}


nextButton.addEventListener(
  "click",
  playNext
);


/* =====================================================
   PREVIOUS
===================================================== */

prevButton.addEventListener(
  "click",
  () => {

    if (
      !results.length
    ) {

      return;

    }


    let index =
      currentIndex - 1;


    if (
      index < 0
    ) {

      index =
        results.length - 1;

    }


    playSong(index);

  }
);


/* =====================================================
   VOLUME
===================================================== */

volume.addEventListener(
  "input",
  () => {

    if (
      playerReady
    ) {

      player.setVolume(
        Number(volume.value)
      );

    }

  }
);


/* =====================================================
   PROGRESS
===================================================== */

progress.addEventListener(
  "input",
  () => {

    if (
      !playerReady
    ) {

      return;

    }


    const duration =
      player.getDuration();


    if (
      !duration
    ) {

      return;

    }


    player.seekTo(
      duration *
      Number(progress.value) /
      100,
      true
    );

  }
);


/* =====================================================
   UPDATE PROGRESS
===================================================== */

setInterval(
  () => {

    if (
      !playerReady ||
      !player
    ) {

      return;

    }


    try {

      const duration =
        player.getDuration();


      const current =
        player.getCurrentTime();


      if (
        !duration
      ) {

        return;

      }


      progress.value =
        (
          current /
          duration
        ) * 100;


      currentTime.textContent =
        formatTime(current);


      durationTime.textContent =
        formatTime(duration);

    }

    catch { }

  },
  500
);


/* =====================================================
   CLEAN TITLE
===================================================== */

function cleanTitle(
  title
) {

  return String(
    title || "Unknown Song"
  )
    .replace(
      /\s*\|\s*zubeen garg.*$/i,
      ""
    )
    .replace(
      /\s*-\s*zubeen garg.*$/i,
      ""
    )
    .trim();

}


/* =====================================================
   TIME
===================================================== */

function formatTime(
  seconds
) {

  seconds =
    Math.floor(
      Number(seconds) || 0
    );


  const minutes =
    Math.floor(
      seconds / 60
    );


  const sec =
    seconds % 60;


  return (
    minutes +
    ":" +
    String(sec).padStart(
      2,
      "0"
    )
  );

}


/* =====================================================
   ESCAPE
===================================================== */

function escapeHTML(
  value
) {

  return String(value)
    .replace(
      /[&<>"']/g,
      char => ({

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"

      })[char]
    );

}