const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();

const PORT = 5500;
const API_KEY = process.env.YOUTUBE_API_KEY;


/* =====================================================
   BASIC CHECK
===================================================== */

if (!API_KEY) {
    console.error("❌ YOUTUBE_API_KEY not found in .env");
    process.exit(1);
}


/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(express.json());

app.use(
    express.static(
        path.join(__dirname)
    )
);


/* =====================================================
   HOME
===================================================== */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "index.html"
        )
    );

});


/* =====================================================
   YOUTUBE SEARCH
===================================================== */

app.get(
    "/api/search",
    async (req, res) => {

        const query =
            String(
                req.query.q || ""
            ).trim();


        /* Empty search */

        if (!query) {

            return res.status(400).json({

                error:
                    "Search query is required"

            });

        }


        try {

            /*
             * Search specifically around
             * Zubeen Garg.
             */

            const youtubeQuery =
                `${query} Zubeen Garg Assamese`;


            const params =
                new URLSearchParams({

                    part: "snippet",

                    q: youtubeQuery,

                    type: "video",

                    maxResults: "10",

                    regionCode: "IN",

                    relevanceLanguage: "en",

                    videoEmbeddable: "true",

                    videoSyndicated: "true",

                    key: API_KEY

                });


            const youtubeURL =
                "https://www.googleapis.com/youtube/v3/search?" +
                params.toString();


            console.log(
                `🔎 YouTube search: ${youtubeQuery}`
            );


            const response =
                await fetch(
                    youtubeURL
                );


            const data =
                await response.json();


            /* YouTube API error */

            if (!response.ok) {

                console.error(
                    "YouTube API error:",
                    data
                );


                return res
                    .status(response.status)
                    .json({

                        error:
                            data.error?.message ||
                            "YouTube API request failed"

                    });

            }


            /* =================================================
               FILTER ZUBEEN RESULTS
            ================================================= */

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
                                (
                                    item.snippet
                                        ?.title || ""
                                ).toLowerCase();


                            const channel =
                                (
                                    item.snippet
                                        ?.channelTitle || ""
                                ).toLowerCase();


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

                    .slice(0, 2)

                    .map(
                        item => ({

                            videoId:
                                item.id.videoId,

                            title:
                                item.snippet.title,

                            channel:
                                item.snippet.channelTitle,

                            thumbnail:
                                item.snippet
                                    .thumbnails
                                    ?.medium
                                    ?.url || ""

                        })
                    );


            console.log(
                `✅ Results found: ${results.length}`
            );


            /* =================================================
               RESPONSE
            ================================================= */

            res.json({

                results: results

            });

        }


        catch (error) {

            console.error(
                "❌ Search failed:",
                error
            );


            res.status(500).json({

                error:
                    "Could not connect to YouTube"

            });

        }

    }
);


/* =====================================================
   404 API
===================================================== */

app.use(
    "/api",
    (req, res) => {

        res.status(404).json({

            error:
                "API route not found"

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
            "================================"
        );

        console.log(
            "🎵 ZUBEEN MUSIC WEBSITE"
        );

        console.log(
            "================================"
        );

        console.log(
            `🌐 http://localhost:${PORT}`
        );

        console.log(
            `🔎 http://localhost:${PORT}/api/search?q=Anamika`
        );

        console.log(
            "================================"
        );

    }
);