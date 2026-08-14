/* =====================================================
   ZUBEEN MUSIC
   FULL PLAYER SCRIPT
===================================================== */


/* =====================================================
   STATE
===================================================== */

let player = null;

let playerReady = false;

let results = [];

let currentIndex = -1;

let searching = false;


/* =====================================================
   SVG ICONS
===================================================== */

const ICONS = {

  play: `
        <svg
            class="icon icon-play"
            viewBox="0 0 24 24"
            aria-hidden="true">

            <path d="M8 5v14l11-7z"></path>

        </svg>
    `,


  pause: `
        <svg
            class="icon"
            viewBox="0 0 24 24"
            aria-hidden="true">

            <path d="M8 5v14"></path>

            <path d="M16 5v14"></path>

        </svg>
    `,


  next: `
        <svg
            class="icon"
            viewBox="0 0 24 24"
            aria-hidden="true">

            <path d="M5 5l10 7-10 7z"></path>

            <path d="M19 5v14"></path>

        </svg>
    `,


  previous: `
        <svg
            class="icon"
            viewBox="0 0 24 24"
            aria-hidden="true">

            <path d="M19 5l-10 7 10 7z"></path>

            <path d="M5 5v14"></path>

        </svg>
    `,


  search: `
        <svg
            class="icon"
            viewBox="0 0 24 24"
            aria-hidden="true">

            <circle
                cx="11"
                cy="11"
                r="6.5">
            </circle>

            <path d="M16 16l5 5"></path>

        </svg>
    `,


  close: `
        <svg
            class="icon icon-small"
            viewBox="0 0 24 24"
            aria-hidden="true">

            <path d="M6 6l12 12"></path>

            <path d="M18 6L6 18"></path>

        </svg>
    `

};


/* =====================================================
   ELEMENTS
===================================================== */

const topSearch =
  document.getElementById(
    "topSearch"
  );


const searchBox =
  document.getElementById(
    "searchBox"
  );


const searchInput =
  document.getElementById(
    "search"
  );


const searchButton =
  document.getElementById(
    "searchButton"
  );


const openSearch =
  document.getElementById(
    "openSearch"
  );


const closeSearch =
  document.getElementById(
    "closeSearch"
  );


const searchStatus =
  document.getElementById(
    "searchStatus"
  );


const songsContainer =
  document.getElementById(
    "songs"
  );


const nowTitle =
  document.getElementById(
    "nowTitle"
  );


const nowArtist =
  document.getElementById(
    "nowArtist"
  );


const playButton =
  document.getElementById(
    "play"
  );


const prevButton =
  document.getElementById(
    "prev"
  );


const nextButton =
  document.getElementById(
    "next"
  );


const progress =
  document.getElementById(
    "progress"
  );


const currentTime =
  document.getElementById(
    "current"
  );


const durationTime =
  document.getElementById(
    "duration"
  );


const volume =
  document.getElementById(
    "volume"
  );


/* =====================================================
   SAFE CHECK
===================================================== */

function exists(element) {

  return (
    element !== null &&
    element !== undefined
  );

}


/* =====================================================
   INITIAL ICONS
===================================================== */

function setupIcons() {

  if (
    exists(openSearch)
  ) {

    openSearch.innerHTML =
      ICONS.search;

  }


  if (
    exists(searchButton)
  ) {

    searchButton.innerHTML =
      ICONS.search;

  }


  if (
    exists(closeSearch)
  ) {

    closeSearch.innerHTML =
      ICONS.close;

  }


  if (
    exists(prevButton)
  ) {

    prevButton.innerHTML =
      ICONS.previous;

  }


  if (
    exists(playButton)
  ) {

    playButton.innerHTML =
      ICONS.play;

  }


  if (
    exists(nextButton)
  ) {

    nextButton.innerHTML =
      ICONS.next;

  }

}


setupIcons();


/* =====================================================
   SEARCH OPEN
===================================================== */

if (
  exists(openSearch)
) {

  openSearch.addEventListener(
    "click",
    () => {

      if (
        exists(topSearch)
      ) {

        topSearch.classList.add(
          "search-open"
        );

      }


      setTimeout(
        () => {

          if (
            exists(searchInput)
          ) {

            searchInput.focus();

          }

        },
        350
      );

    }
  );

}


/* =====================================================
   SEARCH CLOSE
===================================================== */

if (
  exists(closeSearch)
) {

  closeSearch.addEventListener(
    "click",
    closeSearchPanel
  );

}


function closeSearchPanel() {

  if (
    exists(topSearch)
  ) {

    topSearch.classList.remove(
      "search-open"
    );

  }


  if (
    exists(searchInput)
  ) {

    searchInput.value =
      "";

  }


  if (
    exists(searchStatus)
  ) {

    searchStatus.textContent =
      "";

  }

}


/* =====================================================
   ENTER SEARCH
===================================================== */

if (
  exists(searchInput)
) {

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

        closeSearchPanel();

      }

    }
  );

}


/* =====================================================
   SEARCH BUTTON
===================================================== */

if (
  exists(searchButton)
) {

  searchButton.addEventListener(
    "click",
    searchSongs
  );

}


/* =====================================================
   YOUTUBE API READY
===================================================== */

function onYouTubeIframeAPIReady() {

  console.log(
    "YouTube API ready"
  );


  try {

    player =
      new YT.Player(
        "yt-player",
        {

          width:
            "80",

          height:
            "50",

          videoId:
            "",

          playerVars: {

            autoplay:
              0,

            controls:
              1,

            playsinline:
              1,

            rel:
              0,

            modestbranding:
              1

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

  catch (
  error
  ) {

    console.error(
      "Player initialization error:",
      error
    );

  }

}


/* =====================================================
   PLAYER READY
===================================================== */

function onPlayerReady() {

  playerReady =
    true;


  console.log(
    "YouTube player ready"
  );


  if (
    exists(volume)
  ) {

    try {

      player.setVolume(
        Number(
          volume.value
        )
      );

    }

    catch (
    error
    ) {

      console.error(
        error
      );

    }

  }

}


/* =====================================================
   PLAYER STATE
===================================================== */

function onPlayerStateChange(
  event
) {

  if (
    !window.YT
  ) {

    return;

  }


  if (
    event.data ===
    YT.PlayerState.PLAYING
  ) {

    setPlayIcon(
      true
    );

    renderResults();

  }


  else if (
    event.data ===
    YT.PlayerState.PAUSED
  ) {

    setPlayIcon(
      false
    );

    renderResults();

  }


  else if (
    event.data ===
    YT.PlayerState.ENDED
  ) {

    setPlayIcon(
      false
    );

    playNext();

  }

}


/* =====================================================
   PLAY ICON
===================================================== */

function setPlayIcon(
  playing
) {

  if (
    !exists(playButton)
  ) {

    return;

  }


  playButton.innerHTML =
    playing
      ? ICONS.pause
      : ICONS.play;

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


  setPlayIcon(
    false
  );


  let message =
    "This video cannot be played";


  switch (
  Number(
    event.data
  )
  ) {

    case 2:

      message =
        "Invalid video";

      break;


    case 5:

      message =
        "HTML5 player error";

      break;


    case 100:

      message =
        "Video unavailable";

      break;


    case 101:

    case 150:

      message =
        "Embedding not allowed";

      break;

  }


  if (
    exists(nowArtist)
  ) {

    nowArtist.textContent =
      message;

  }


  /*
     Try next recommendation
  */

  if (
    results.length > 1 &&
    currentIndex <
    results.length - 1
  ) {

    setTimeout(
      playNext,
      1200
    );

  }

}


/* =====================================================
   SEARCH
===================================================== */

async function searchSongs() {

  if (
    !exists(searchInput)
  ) {

    return;

  }


  const query =
    searchInput.value.trim();


  if (
    !query
  ) {

    searchStatus.textContent =
      "Type a song name first";

    return;

  }


  if (
    query.length < 2
  ) {

    searchStatus.textContent =
      "Enter at least 2 characters";

    return;

  }


  if (
    query.length > 100
  ) {

    searchStatus.textContent =
      "Search is too long";

    return;

  }


  if (
    searching
  ) {

    return;

  }


  searching =
    true;


  if (
    exists(searchBox)
  ) {

    searchBox.classList.add(
      "loading"
    );

  }


  if (
    exists(searchStatus)
  ) {

    searchStatus.textContent =
      `Searching "${query}"...`;

  }


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

    const response =
      await fetch(
        "/api/search?q=" +
        encodeURIComponent(
          query
        ),
        {

          method:
            "GET",

          headers: {

            Accept:
              "application/json"

          },

          cache:
            "no-store"

        }
      );


    let data = {};


    try {

      data =
        await response.json();

    }

    catch {

      throw new Error(
        "Invalid server response"
      );

    }


    if (
      response.status === 429
    ) {

      throw new Error(
        "Too many searches. Please wait a minute."
      );

    }


    if (
      !response.ok
    ) {

      throw new Error(

        data.message ||
        data.error ||
        `Server error ${response.status}`

      );

    }


    results =
      Array.isArray(
        data.results
      )
        ? data.results
          .filter(
            song =>
              song &&
              song.videoId
          )
          .slice(
            0,
            2
          )
        : [];


    if (
      results.length === 0
    ) {

      currentIndex =
        -1;


      searchStatus.textContent =
        "No Zubeen song found";


      songsContainer.innerHTML = `

                <div class="empty-state">

                    <h3>
                        No results found
                    </h3>

                    <p>
                        Try another Zubeen song name.
                    </p>

                </div>

            `;


      return;

    }


    if (
      data.cached
    ) {

      searchStatus.textContent =
        "Results loaded from cache";

    }

    else if (
      data.stale
    ) {

      searchStatus.textContent =
        "Showing saved results";

    }

    else {

      searchStatus.textContent =
        `${results.length} recommendations`;

    }


    currentIndex =
      -1;


    renderResults();

  }

  catch (
  error
  ) {

    console.error(
      "Search error:",
      error
    );


    results =
      [];


    currentIndex =
      -1;


    searchStatus.textContent =
      "Search unavailable";


    songsContainer.innerHTML = `

            <div class="empty-state">

                <h3>
                    Search temporarily unavailable
                </h3>

                <p>
                    ${escapeHTML(
      error.message ||
      "Please try again."
    )}
                </p>

                <br>

                <button
                    id="retrySearch"
                    class="retry-button"
                    type="button">

                    Try Again

                </button>

            </div>

        `;


    const retry =
      document.getElementById(
        "retrySearch"
      );


    if (
      retry
    ) {

      retry.addEventListener(
        "click",
        searchSongs
      );

    }

  }

  finally {

    searching =
      false;


    if (
      exists(searchBox)
    ) {

      searchBox.classList.remove(
        "loading"
      );

    }

  }

}


/* =====================================================
   RENDER RESULTS
===================================================== */

function renderResults() {

  if (
    !exists(songsContainer)
  ) {

    return;

  }


  songsContainer.innerHTML =
    "";


  results
    .slice(
      0,
      2
    )
    .forEach(
      (song, index) => {

        const div =
          document.createElement(
            "div"
          );


        div.className =
          "song";


        if (
          index ===
          currentIndex
        ) {

          div.classList.add(
            "active"
          );

        }


        let icon =
          ICONS.play;


        if (
          index ===
          currentIndex &&
          playerReady &&
          player
        ) {

          try {

            if (
              player.getPlayerState() ===
              YT.PlayerState.PLAYING
            ) {

              icon =
                ICONS.pause;

            }

          }

          catch {

            icon =
              ICONS.play;

          }

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
                        aria-label="Play song">

                        ${icon}

                    </button>

                `;


        div.addEventListener(
          "click",
          () => {

            playSong(
              index
            );

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

function playSong(
  index
) {

  if (
    !playerReady ||
    !player
  ) {

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


  try {

    player.loadVideoById(
      song.videoId
    );

  }

  catch (
  error
  ) {

    console.error(
      error
    );

    nowArtist.textContent =
      "Unable to play this video";

  }

}


/* =====================================================
   PLAY / PAUSE
===================================================== */

if (
  exists(playButton)
) {

  playButton.addEventListener(
    "click",
    () => {

      if (
        !playerReady ||
        !player
      ) {

        return;

      }


      if (
        currentIndex === -1
      ) {

        if (
          results.length
        ) {

          playSong(
            0
          );

        }

        return;

      }


      try {

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

      catch (
      error
      ) {

        console.error(
          error
        );

      }

    }
  );

}


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
    index >=
    results.length
  ) {

    index =
      0;

  }


  playSong(
    index
  );

}


if (
  exists(nextButton)
) {

  nextButton.addEventListener(
    "click",
    playNext
  );

}


/* =====================================================
   PREVIOUS
===================================================== */

function playPrevious() {

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


  playSong(
    index
  );

}


if (
  exists(prevButton)
) {

  prevButton.addEventListener(
    "click",
    playPrevious
  );

}


/* =====================================================
   VOLUME
===================================================== */

if (
  exists(volume)
) {

  volume.addEventListener(
    "input",
    () => {

      if (
        !playerReady ||
        !player
      ) {

        return;

      }


      try {

        player.setVolume(
          Number(
            volume.value
          )
        );

      }

      catch (
      error
      ) {

        console.error(
          error
        );

      }

    }
  );

}


/* =====================================================
   PROGRESS SEEK
===================================================== */

if (
  exists(progress)
) {

  progress.addEventListener(
    "input",
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


        if (
          !duration
        ) {

          return;

        }


        player.seekTo(

          duration *
          Number(
            progress.value
          ) /
          100,

          true

        );

      }

      catch (
      error
      ) {

        console.error(
          error
        );

      }

    }
  );

}


/* =====================================================
   PROGRESS UPDATE
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
        ) *
        100;


      currentTime.textContent =
        formatTime(
          current
        );


      durationTime.textContent =
        formatTime(
          duration
        );

    }

    catch {

      /* Player temporarily unavailable */

    }

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
    title ||
    "Unknown Song"
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
   FORMAT TIME
===================================================== */

function formatTime(
  seconds
) {

  seconds =
    Math.floor(
      Number(
        seconds
      ) || 0
    );


  const minutes =
    Math.floor(
      seconds /
      60
    );


  const sec =
    seconds %
    60;


  return (

    minutes +
    ":" +
    String(
      sec
    ).padStart(
      2,
      "0"
    )

  );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(
  value
) {

  return String(
    value ||
    ""
  )

    .replace(
      /[&<>"']/g,
      char => {

        const map = {

          "&":
            "&amp;",

          "<":
            "&lt;",

          ">":
            "&gt;",

          '"':
            "&quot;",

          "'":
            "&#039;"

        };


        return (
          map[char] ||
          char
        );

      }
    );

}


/* =====================================================
   GLOBAL ERROR
===================================================== */

window.addEventListener(
  "error",
  event => {

    console.error(
      "Global error:",
      event.error ||
      event.message
    );

  }
);


/* =====================================================
   PROMISE ERROR
===================================================== */

window.addEventListener(
  "unhandledrejection",
  event => {

    console.error(
      "Unhandled promise:",
      event.reason
    );

  }
);


/* =====================================================
   READY
===================================================== */

console.log(
  "Zubeen Music UI loaded"
);