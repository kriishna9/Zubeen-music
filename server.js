a/* =====================================================
   ZUBEEN MUSIC SERVER
   FINAL API SERVER
===================================================== */

const express = require("express");
const path = require("path");
const rateLimit = require("express-rate-limit");
require("dotenv").config();


/* =====================================================
   APP
===================================================== */

const app = express();

const PORT = process.env.PORT || 5500;

const API_KEY =
    process.env.YOUTUBE_API_KEY;


/* =====================================================
   CONFIGURATION
===================================================== */

const DAILY_LIMIT = 80;

/*
    Cache search results for 10 minutes.

    If multiple users search the same thing,
    we can return the cached result instead of
    making another YouTube API request.
*/

const CACHE_TIME =
    10 * 60 * 1000;


/* =====================================================
   BASIC CHECK
===================================================== */

if (!API_KEY) {

    console.error(
        "❌ YOUTUBE_API_KEY not found in .env"
    );

    process.exit(1);
}


/* =====================================================
   DAILY USAGE
===================================================== */

let usage = {

    date:
        getPacificDate(),

    count:
        0

};


/* =====================================================
   PACIFIC DATE
===================================================== */

function getPacificDate() {

    return new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone:
                "America/Los_Angeles",

            year:
                "numeric",

            month:
                "2-digit",

            day:
                "2-digit"
        }
    ).format(
        new Date()
    );
}


/* =====================================================
   RESET DAILY COUNTER
===================================================== */

function resetDailyUsageIfNeeded() {

    const today =
        getPacificDate();


    if (
        usage.date !== today
    ) {

        usage.date =
            today;

        usage.count =
            0;


        console.log(
            "🔄 Daily YouTube search counter reset"
        );

        console.log(
            `📅 Pacific date: ${today}`
        );

    }

}


/* =====================================================
   CACHE
===================================================== */

const searchCache =
    new Map();


/* =====================================================
   CLEAN OLD CACHE
===================================================== */

function cleanCache() {

    const now =
        Date.now();


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
            CACHE_TIME
        ) {

            searchCache.delete(
                key
            );

        }

    }

}


/* =====================================================
   EXPRESS MIDDLEWARE
===================================================== */

app.use(
    express.json(
        {
            limit:
                "50kb"
        }
    )
);


/* =====================================================
   STATIC WEBSITE
===================================================== */

app.use(
    express.static(
        path.join(
            __dirname
        )
    )
);


/* =====================================================
   GENERAL API RATE LIMIT
===================================================== */

/*
    Prevent one IP from spamming
    the search endpoint.

    30 requests per minute per IP.
*/

const searchRateLimit =
    rateLimit({

        windowMs:
            60 * 1000,

        max:
            30,

        standardHeaders:
            true,

        legacyHeaders:
            false,

        message: {

            error:
                "Too many search requests. Please wait a moment."

        }

    });


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

        resetDailyUsageIfNeeded();


        res.json({

            success:
                true,

            server:
                "online",

            youtubeConfigured:
                Boolean(
                    API_KEY
                ),

            dailyLimit:
                DAILY_LIMIT,

            searchesUsed:
                usage.count,

            searchesRemaining:
                Math.max(
                    0,
                    DAILY_LIMIT -
                    usage.count
                ),

            date:
                usage.date,

            timestamp:
                new Date().toISOString()

        });

    }
);


/* =====================================================
   YOUTUBE SEARCH
===================================================== */

app.get(
    "/api/search",
    searchRateLimit,

    async (req, res) => {

        /* ---------------------------------------------
           RESET CHECK
        --------------------------------------------- */

        resetDailyUsageIfNeeded();


        /* ---------------------------------------------
           QUERY
        --------------------------------------------- */

        const query =
            String(
                req.query.q ||
                ""
            ).trim();


        /* ---------------------------------------------
           EMPTY QUERY
        --------------------------------------------- */

        if (!query) {

            return res
                .status(400)
                .json({

                    error:
                        "Search query is required"

                });

        }


        /* ---------------------------------------------
           QUERY LENGTH
        --------------------------------------------- */

        if (
            query.length >
            100
        ) {

            return res
                .status(400)
                .json({

                    error:
                        "Search query is too long"

                });

        }


        /* ---------------------------------------------
           CACHE CLEANUP
        --------------------------------------------- */

        cleanCache();


        /* ---------------------------------------------
           CACHE KEY
        --------------------------------------------- */

        const cacheKey =
            query
                .toLowerCase()
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();


        /* ---------------------------------------------
           RETURN CACHE
        --------------------------------------------- */

        const cached =
            searchCache.get(
                cacheKey
            );


        if (
            cached &&
            Date.now() -
            cached.timestamp
            <
            CACHE_TIME
        ) {

            console.log(
                `⚡ Cache hit: ${query}`
            );


            return res.json({

                results:
                    cached.results,

                cached:
                    true,

                searchesUsed:
                    usage.count,

                searchesRemaining:
                    Math.max(
                        0,
                        DAILY_LIMIT -
                        usage.count
                    )

            });

        }


        /* ---------------------------------------------
           DAILY LIMIT
        --------------------------------------------- */

        if (
            usage.count >=
            DAILY_LIMIT
        ) {

            console.warn(
                "⚠️ Daily search limit reached"
            );


            return res
                .status(429)
                .json({

                    error:
                        "Daily search limit reached. Please try again tomorrow.",

                    limit:
                        DAILY_LIMIT,

                    searchesUsed:
                        usage.count,

                    searchesRemaining:
                        0,

                    resetDate:
                        usage.date

                });

        }


        /* ---------------------------------------------
           YOUTUBE QUERY
        --------------------------------------------- */

        const youtubeQuery =
            `${query} Zubeen Garg Assamese`;


        console.log(
            `🔎 YouTube search: ${youtubeQuery}`
        );


        /* ---------------------------------------------
           YOUTUBE PARAMETERS
        --------------------------------------------- */

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


        const youtubeURL =
            "https://www.googleapis.com/youtube/v3/search?" +
            params.toString();


        try {

            /* -----------------------------------------
               YOUTUBE REQUEST
            ----------------------------------------- */

            const response =
                await fetch(
                    youtubeURL
                );


            const data =
                await response.json();


            /* -----------------------------------------
               YOUTUBE ERROR
            ----------------------------------------- */

            if (
                !response.ok
            ) {

                console.error(
                    "❌ YouTube API error:",
                    data
                );


                /*
                    Don't count an API request
                    that failed at the HTTP/API level.
                */

                return res
                    .status(
                        response.status ===
                            403
                            ? 503
                            : response.status
                    )
                    .json({

                        error:
                            data
                                ?.error
                                ?.message ||
                            "YouTube API request failed"

                    });

            }


            /* -----------------------------------------
               FILTER RESULTS
            ----------------------------------------- */

            const results =
                (data.items || [])

                    .filter(
                        item =>
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
                                )
                                    .toLowerCase();


                            const channel =
                                String(
                                    item
                                        ?.snippet
                                        ?.channelTitle ||
                                    ""
                                )
                                    .toLowerCase();


                            return (

                                title.includes(
                                    "zubeen"
                                )

                                ||

                                channel.includes(
                                    "zubeen"
                                )

                                ||

                                title.includes(
                                    "garg"
                                )

                                ||

                                channel.includes(
                                    "garg"
                                )

                            );

                        }
                    )

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


            /* -----------------------------------------
               COUNT SUCCESSFUL API CALL
            ----------------------------------------- */

            usage.count++;


            console.log(
                `📊 YouTube usage: ${usage.count}/${DAILY_LIMIT}`
            );


            /* -----------------------------------------
               SAVE CACHE
            ----------------------------------------- */

            searchCache.set(
                cacheKey,
                {

                    results:
                        results,

                    timestamp:
                        Date.now()

                }
            );


            /* -----------------------------------------
               RESPONSE
            ----------------------------------------- */

            return res.json({

                results:
                    results,

                cached:
                    false,

                searchesUsed:
                    usage.count,

                searchesRemaining:
                    Math.max(
                        0,
                        DAILY_LIMIT -
                        usage.count
                    )

            });

        }


        catch (error) {

            console.error(
                "❌ Search failed:",
                error
            );


            return res
                .status(500)
                .json({

                    error:
                        "Could not connect to YouTube"

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

                error:
                    "API route not found"

            });

    }
);


/* =====================================================
   GENERAL ERROR HANDLER
===================================================== */

app.use(
    (
        err,
        req,
        res,
        next
    ) => {

        console.error(
            "❌ Server error:",
            err
        );


        res
            .status(500)
            .json({

                error:
                    "Internal server error"

            });

    }
);


/* =====================================================
   START SERVER
===================================================== */

app.listen(
    PORT,
    () => {

        console.log("");

        console.log(
            "=========================================="
        );

        console.log(
            "🎵 ZUBEEN MUSIC SERVER"
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
            `📊 Daily limit: ${DAILY_LIMIT}`
        );

        console.log(
            `📅 Reset timezone: America/Los_Angeles`
        );

        console.log(
            "=========================================="
        );

    }
);