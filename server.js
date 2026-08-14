const express = require("express");
const path = require("path");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();


/* =====================================================
   CONFIG
===================================================== */

const PORT =
    process.env.PORT || 5500;

const API_KEY =
    process.env.YOUTUBE_API_KEY;


/*
    Cache duration

    30 minutes
*/

const CACHE_TIME =
    30 * 60 * 1000;


/*
    Keep old results for fallback

    24 hours
*/

const STALE_CACHE_TIME =
    24 * 60 * 60 * 1000;


/*
    Maximum YouTube search requests
    from this server per day.

    search.list = 100 quota units.

    80 × 100 = 8000 units.
*/

const DAILY_SEARCH_LIMIT = 80;


/* =====================================================
   BASIC CHECK
===================================================== */

if (!API_KEY) {

    console.error("");
    console.error(
        "❌ YOUTUBE_API_KEY not found"
    );

    console.error(
        "Create a .env file with:"
    );

    console.error(
        "YOUTUBE_API_KEY=YOUR_API_KEY"
    );

    console.error("");

    process.exit(1);

}


/* =====================================================
   SEARCH CACHE
===================================================== */

const searchCache =
    new Map();


/* =====================================================
   DAILY SEARCH COUNTER
===================================================== */

let dailySearchCount = 0;

let dailySearchDate =
    new Date()
        .toISOString()
        .slice(0, 10);


/* =====================================================
   RESET DAILY COUNTER
===================================================== */

function resetDailyCounter() {

    const today =
        new Date()
            .toISOString()
            .slice(0, 10);


    if (
        today !==
        dailySearchDate
    ) {

        dailySearchDate =
            today;

        dailySearchCount =
            0;

        console.log(
            "🔄 Daily YouTube search counter reset"
        );

    }

}


/* =====================================================
   CHECK DAILY SEARCH BUDGET
===================================================== */

function canUseYouTubeSearch() {

    resetDailyCounter();


    return (
        dailySearchCount <
        DAILY_SEARCH_LIMIT
    );

}


/* =====================================================
   RECORD YOUTUBE SEARCH
===================================================== */

function recordYouTubeSearch() {

    resetDailyCounter();

    dailySearchCount++;


    console.log(
        `📊 YouTube searches today: ${dailySearchCount}/${DAILY_SEARCH_LIMIT}`
    );

}


/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(
    express.json({
        limit: "10kb"
    })
);


app.use(
    express.static(
        path.join(__dirname)
    )
);


/* =====================================================
   RATE LIMITER
===================================================== */

const searchLimiter =
    rateLimit({

        windowMs:
            60 * 1000,

        /*
            Maximum 20 searches
            per IP per minute.
        */

        max:
            20,

        standardHeaders:
            true,

        legacyHeaders:
            false,

        message: {

            success:
                false,

            error:
                "Too many searches.",

            message:
                "Please wait a minute and try again.",

            results:
                []

        }

    });


/* =====================================================
   CACHE CLEANUP
===================================================== */

setInterval(
    () => {

        const now =
            Date.now();


        let removed =
            0;


        for (
            const [
                key,
                value
            ]
            of searchCache
        ) {

            if (
                now -
                value.timestamp
                >
                STALE_CACHE_TIME
            ) {

                searchCache.delete(
                    key
                );

                removed++;

            }

        }


        if (
            removed > 0
        ) {

            console.log(
                `🧹 Cache cleanup: ${removed} old entries removed`
            );

        }

    },
    30 * 60 * 1000
);


/* =====================================================
   HOME
===================================================== */

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "index.html"
            )
        );

    }
);


/* =====================================================
   HEALTH CHECK
===================================================== */

app.get(
    "/api/health",
    (req, res) => {

        resetDailyCounter();


        res.json({

            success:
                true,

            server:
                "online",

            youtubeConfigured:
                Boolean(API_KEY),

            dailySearchesUsed:
                dailySearchCount,

            dailySearchLimit:
                DAILY_SEARCH_LIMIT,

            cacheEntries:
                searchCache.size,

            timestamp:
                new Date()
                    .toISOString()

        });

    }
);


/* =====================================================
   YOUTUBE FETCH WITH TIMEOUT
===================================================== */

async function fetchYouTube(
    url
) {

    const controller =
        new AbortController();


    /*
        8 second timeout
    */

    const timeout =
        setTimeout(
            () => {

                controller.abort();

            },
            8000
        );


    try {

        const response =
            await fetch(
                url,
                {

                    method:
                        "GET",

                    signal:
                        controller.signal,

                    headers: {

                        Accept:
                            "application/json"

                    }

                }
            );


        return response;

    }

    finally {

        clearTimeout(
            timeout
        );

    }

}


/* =====================================================
   SEARCH
===================================================== */

app.get(
    "/api/search",
    searchLimiter,
    async (req, res) => {

        /* =================================================
           QUERY
        ================================================= */

        let query =
            String(
                req.query.q || ""
            ).trim();


        /* =================================================
           EMPTY QUERY
        ================================================= */

        if (
            !query
        ) {

            return res
                .status(400)
                .json({

                    success:
                        false,

                    error:
                        "Search query is required.",

                    results:
                        []

                });

        }


        /* =================================================
           MINIMUM LENGTH
        ================================================= */

        if (
            query.length < 2
        ) {

            return res
                .status(400)
                .json({

                    success:
                        false,

                    error:
                        "Please enter at least 2 characters.",

                    results:
                        []

                });

        }


        /* =================================================
           MAXIMUM LENGTH
        ================================================= */

        if (
            query.length > 100
        ) {

            return res
                .status(400)
                .json({

                    success:
                        false,

                    error:
                        "Search query is too long.",

                    results:
                        []

                });

        }


        /* =================================================
           CLEAN QUERY
        ================================================= */

        query =
            query
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();


        /*
            Cache key is lowercase.
        */

        const cacheKey =
            query.toLowerCase();


        /* =================================================
           CACHE CHECK
        ================================================= */

        const cached =
            searchCache.get(
                cacheKey
            );


        if (
            cached
        ) {

            const age =
                Date.now() -
                cached.timestamp;


            /*
                Fresh cache
            */

            if (
                age <
                CACHE_TIME
            ) {

                console.log(
                    `⚡ CACHE HIT: ${query}`
                );


                return res.json({

                    success:
                        true,

                    cached:
                        true,

                    stale:
                        false,

                    results:
                        cached.results

                });

            }

        }


        /* =================================================
           DAILY API SAFETY CHECK
        ================================================= */

        if (
            !canUseYouTubeSearch()
        ) {

            console.warn(
                "🛑 Daily YouTube search safety limit reached"
            );


            /*
                Use stale cache if available.
            */

            if (
                cached &&
                cached.results &&
                cached.results.length
            ) {

                return res.json({

                    success:
                        true,

                    cached:
                        true,

                    stale:
                        true,

                    message:
                        "Showing saved results.",

                    results:
                        cached.results

                });

            }


            return res
                .status(503)
                .json({

                    success:
                        false,

                    quota:
                        true,

                    error:
                        "Search temporarily unavailable.",

                    message:
                        "Daily search limit reached. Please try again later.",

                    results:
                        []

                });

        }


        /* =================================================
           YOUTUBE QUERY
        ================================================= */

        const youtubeQuery =
            `${query} Zubeen Garg Assamese`;


        console.log(
            `🔎 YouTube search: ${youtubeQuery}`
        );


        try {

            /* =================================================
               PARAMETERS
            ================================================= */

            const params =
                new URLSearchParams({

                    part:
                        "snippet",

                    q:
                        youtubeQuery,

                    type:
                        "video",

                    maxResults:
                        "10",

                    regionCode:
                        "IN",

                    relevanceLanguage:
                        "en",

                    videoEmbeddable:
                        "true",

                    videoSyndicated:
                        "true",

                    key:
                        API_KEY

                });


            /* =================================================
               URL
            ================================================= */

            const youtubeURL =
                "https://www.googleapis.com/youtube/v3/search?" +
                params.toString();


            /*
                Count ONLY when we are
                actually going to YouTube.
            */

            recordYouTubeSearch();


            /* =================================================
               REQUEST
            ================================================= */

            const response =
                await fetchYouTube(
                    youtubeURL
                );


            /* =================================================
               JSON
            ================================================= */

            let data = {};


            try {

                data =
                    await response.json();

            }

            catch {

                data = {};

            }


            /* =================================================
               API ERROR
            ================================================= */

            if (
                !response.ok
            ) {

                console.error(
                    "❌ YouTube API error:",
                    response.status,
                    data
                );


                const reasons =
                    data
                        ?.error
                        ?.errors
                        ?.map(
                            item =>
                                item.reason
                        ) ||
                    [];


                /* =============================================
                   QUOTA ERROR
                ============================================= */

                if (

                    reasons.includes(
                        "quotaExceeded"
                    )

                    ||

                    reasons.includes(
                        "dailyLimitExceeded"
                    )

                ) {

                    console.warn(
                        "🛑 YouTube quota exceeded"
                    );


                    /*
                        Stale cache fallback
                    */

                    if (
                        cached &&
                        cached.results &&
                        cached.results.length
                    ) {

                        return res.json({

                            success:
                                true,

                            cached:
                                true,

                            stale:
                                true,

                            message:
                                "Showing saved results.",

                            results:
                                cached.results

                        });

                    }


                    return res
                        .status(503)
                        .json({

                            success:
                                false,

                            quota:
                                true,

                            error:
                                "YouTube search is temporarily unavailable.",

                            message:
                                "Please try again later.",

                            results:
                                []

                        });

                }


                /* =============================================
                   INVALID API KEY
                ============================================= */

                if (

                    reasons.includes(
                        "keyInvalid"
                    )

                ) {

                    console.error(
                        "❌ YouTube API key is invalid"
                    );


                    return res
                        .status(500)
                        .json({

                            success:
                                false,

                            error:
                                "YouTube API configuration error.",

                            message:
                                "Please check the API key in the server environment.",

                            results:
                                []

                        });

                }


                /* =============================================
                   OTHER API ERROR
                ============================================= */

                if (
                    cached &&
                    cached.results &&
                    cached.results.length
                ) {

                    return res.json({

                        success:
                            true,

                        cached:
                            true,

                        stale:
                            true,

                        message:
                            "Showing saved results.",

                        results:
                            cached.results

                    });

                }


                return res
                    .status(503)
                    .json({

                        success:
                            false,

                        error:
                            "YouTube search is temporarily unavailable.",

                        message:
                            data
                                ?.error
                                ?.message ||
                            "Please try again later.",

                        results:
                            []

                    });

            }


            /* =================================================
               ITEMS
            ================================================= */

            const items =
                Array.isArray(
                    data.items
                )
                    ? data.items
                    : [];


            /* =================================================
               FILTER ZUBEEN
            ================================================= */

            const results =
                items

                    .filter(
                        item =>
                            item &&
                            item.id &&
                            item.id.videoId
                    )

                    .filter(
                        item => {

                            const title =
                                String(
                                    item
                                        ?.snippet
                                        ?.title ||
                                    ""
                                ).toLowerCase();


                            const channel =
                                String(
                                    item
                                        ?.snippet
                                        ?.channelTitle ||
                                    ""
                                ).toLowerCase();


                            const description =
                                String(
                                    item
                                        ?.snippet
                                        ?.description ||
                                    ""
                                ).toLowerCase();


                            return (

                                title.includes(
                                    "zubeen"
                                )

                                ||

                                title.includes(
                                    "garg"
                                )

                                ||

                                channel.includes(
                                    "zubeen"
                                )

                                ||

                                channel.includes(
                                    "garg"
                                )

                                ||

                                description.includes(
                                    "zubeen garg"
                                )

                            );

                        }
                    )

                    /*
                        Only 2 results.
                    */

                    .slice(
                        0,
                        2
                    )

                    .map(
                        item => ({

                            videoId:
                                item
                                    .id
                                    .videoId,

                            title:
                                item
                                    .snippet
                                    .title,

                            channel:
                                item
                                    .snippet
                                    .channelTitle,

                            thumbnail:
                                item
                                    .snippet
                                    .thumbnails
                                    ?.medium
                                    ?.url ||
                                item
                                    .snippet
                                    .thumbnails
                                    ?.default
                                    ?.url ||
                                ""

                        })
                    );


            /* =================================================
               NO RESULTS
            ================================================= */

            if (
                results.length === 0
            ) {

                console.log(
                    `⚠️ No Zubeen result: ${query}`
                );


                return res.json({

                    success:
                        true,

                    cached:
                        false,

                    results:
                        [],

                    message:
                        "No Zubeen Garg song found."

                });

            }


            /* =================================================
               SAVE CACHE
            ================================================= */

            searchCache.set(
                cacheKey,
                {

                    timestamp:
                        Date.now(),

                    results:
                        results

                }
            );


            /* =================================================
               SUCCESS
            ================================================= */

            console.log(
                `✅ ${results.length} result(s): ${query}`
            );


            return res.json({

                success:
                    true,

                cached:
                    false,

                stale:
                    false,

                results:
                    results

            });

        }


        /* =================================================
           NETWORK / TIMEOUT ERROR
        ================================================= */

        catch (error) {

            console.error(
                "❌ YouTube request failed:",
                error.message
            );


            /*
                Use stale cache.
            */

            if (
                cached &&
                cached.results &&
                cached.results.length
            ) {

                console.log(
                    `🛟 STALE CACHE FALLBACK: ${query}`
                );


                return res.json({

                    success:
                        true,

                    cached:
                        true,

                    stale:
                        true,

                    message:
                        "Showing saved results.",

                    results:
                        cached.results

                });

            }


            return res
                .status(503)
                .json({

                    success:
                        false,

                    error:
                        "Unable to connect to YouTube.",

                    message:
                        "Please check your internet connection and try again.",

                    results:
                        []

                });

        }

    }
);


/* =====================================================
   API 404
===================================================== */

app.use(
    "/api",
    (req, res) => {

        res
            .status(404)
            .json({

                success:
                    false,

                error:
                    "API route not found.",

                results:
                    []

            });

    }
);


/* =====================================================
   GLOBAL ERROR HANDLER
===================================================== */

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "❌ GLOBAL SERVER ERROR:",
            error
        );


        if (
            res.headersSent
        ) {

            return next(
                error
            );

        }


        res
            .status(500)
            .json({

                success:
                    false,

                error:
                    "Internal server error.",

                results:
                    []

            });

    }
);


/* =====================================================
   START SERVER
===================================================== */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");

        console.log(
            "=========================================="
        );

        console.log(
            "🎵 ZUBEEN GARG MUSIC WEBSITE"
        );

        console.log(
            "=========================================="
        );

        console.log(
            `🌐 http://localhost:${PORT}`
        );

        console.log(
            `❤️  Health: http://localhost:${PORT}/api/health`
        );

        console.log(
            `🔎 Search: http://localhost:${PORT}/api/search?q=Anamika`
        );

        console.log(
            "⚡ Cache: 30 minutes"
        );

        console.log(
            "🛡️ Rate limit: 20 searches/min/IP"
        );

        console.log(
            "📊 Daily YouTube limit: 80 searches"
        );

        console.log(
            "⏱️ YouTube timeout: 8 seconds"
        );

        console.log(
            "=========================================="
        );

        console.log("");

    }
);