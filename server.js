import express from 'express'
import pkg from 'pg'

const port = process.env.PORT || 8005

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const { Pool } = pkg

const pool = new Pool({
    user: 'myuser',
    host: 'localhost',
    database: 'url_shortener',
    password: 'mypassword',
    port: 5432
})


let allUrls = [
    // {id: "", originalUrl: ""}
]

let allShortCodes = [
    // {newCode: "", original: ""}
]

const generateShortCode = () => Math.random().toString(36).substring(2, 8)

// POST /url/shorten
app.post('/url/shorten', async (req, res) => {
    try {
        if (!req.body.originalUrl) {
            res.status(400).json({ message: "Please include a url" })
        }


        const urlResult = await pool.query(
            'INSERT INTO urls (original_url) VALUES ($1) RETURNING id', [req.body.originalUrl]
        )

        const urlId = urlResult.rows[0].id
        const shortCode = generateShortCode()
        const shortCodeUrl = `http://localhost:3000/${shortCode}`

        await pool.query(
            'INSERT INTO shortcodes (short_code, url_id) VALUES ($1, $2)', [shortCode, urlId]
        )


        res.status(201).json({ shortUrl: shortCodeUrl })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Server error' })
    }

})

// testing
// this GET endpoint is just to see the original urls and generated urls
app.get('/url/all', async (req, res) => {

    const result = await pool.query(
        'SELECT * FROM shortcodes'
    )

    res.json(result.rows)
    // res.json({allShortCodes, allUrls})
})

// GET /url/{shortCode}
// this is to redirect the generated short url to the original url

app.get('/url/:shortCode', async (req, res) => {
    try {
        const shortCode = req.params.shortCode.trim()
        // console.log("Short code received:", shortCode)

        const result = await pool.query(
            `SELECT original_url FROM urls
            INNER JOIN shortcodes ON urls.id = shortcodes.url_id
            WHERE shortcodes.short_code = $1`, [shortCode]
        )

        //    console.log("Databas result:", result.rows)

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'provide an existing short url' })
        }

        // res.json({redirectTo: result.rows[0].original_url})
        res.redirect(result.rows[0].original_url)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: `Server error` })
    }

})

// PATCH /url/{shortCode}
app.patch('/url/:shortCode', async (req, res) => {

    try {
        const shortCode = req.params.shortCode.trim()
        const { newUrl } = req.body
        if (!newUrl) {
            return res.status(400).json({ message: "You haven't provided a url" })
        }


        const result = await pool.query(`
             SELECT urls.id FROM urls
             INNER JOIN shortcodes ON urls.id = shortcodes.url_id
             WHERE shortcodes.short_code = $1`, [shortCode])

        if (result.rows.length === 0) {
            return res.status(404).json({ message: `this ${shortCode} does not exist on the db` })
        }

        const urlId = result.rows[0].id

        await pool.query(`
            UPDATE urls
            SET original_url = $1
            WHERE id = $2`, [newUrl, urlId])

        res.json({ message: `URL updated successfully for short code: ${shortCode}` })

    } catch (error) {
        res.status(500).json({ message: `Server error` })
    }

}
)


// PUT /url/{shortCode}
app.put('/url/:shortCode', async (req, res) => {

    try {
        const shortCode = req.params.shortCode.trim()
        const { newUrl } = req.body
        if (!newUrl) {
            return res.status(400).json({ message: "You haven't provided a url" })
        }


        const result = await pool.query(`
             SELECT urls.id FROM urls
             INNER JOIN shortcodes ON urls.id = shortcodes.url_id
             WHERE shortcodes.short_code = $1`, [shortCode])

        if (result.rows.length === 0) {
            return res.status(404).json({ message: `this ${shortCode} does not exist on the db` })
        }

        const urlId = result.rows[0].id

        await pool.query(`
            UPDATE urls
            SET original_url = $1
            WHERE id = $2`, [newUrl, urlId])

        res.json({ message: `URL updated successfully for short code: ${shortCode}` })

    } catch (error) {
        res.status(500).json({ message: `Server error` })
    }

}
)

// DELETE url{shortCode}
app.delete('/url/:shortCode', async (req, res) => {
    try {
        const shortCode = req.params.shortCode.trim()

        const result = await pool.query(`
        SELECT urls.id FROM urls
        INNER JOIN shortcodes ON urls.id = shortcodes.url_id
        WHERE shortcodes.short_code = $1`, [shortCode])

        if ( result.rows.length === 0) {
            return res.status(404).json({ message: `this shortcode ${shortCode} does not exist` })
        }

        const urlId = result.rows[0].id

        await pool.query(`DELETE FROM shortcodes WHERE short_code = $1`, [shortCode])

        await pool.query(`DELETE FROM urls WHERE id = $1`, [urlId])

        res.json({message: `Short code ${shortCode} deleted successfully`})

    } catch (error) {
       console.log(error)
       res.status(500).json({message: `Server error`})
    }

})


app.listen(port, () => console.log(`Server has started on port ${port}`))