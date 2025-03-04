import express from 'express'
import pkg from 'pg'

const port = process.env.PORT || 8005

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const {Pool} = pkg

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
    try{
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
            'INSERT INTO shortcodes (short_code, url_id) VALUES ($1, $2)', [shortCodeUrl, urlId]
        )

    
        res.status(201).json({shortUrl: shortCodeUrl})

    } catch (error){
        console.error(error)
        res.status(500).json({message: 'Server error'})
    }
    
})

// testing
// this GET endpoint is just to see the original urls and generated urls
app.get('/url/all', async(req, res) => {
    
   const result = await pool.query(
        'SELECT * FROM shortcodes' 
    )

    res.json(result.rows)
    // res.json({allShortCodes, allUrls})
})

// GET /url/{shortCode}
// this is to redirect the generated short url to the original url

app.get('/url/:shortCode', async(req, res) => {
    try{
        const shortCode = req.params.shortCode.trim()
        console.log(shortCode)
    
           const result = await pool.query(
            `SELECT original_url FROM urls
            INNER JOIN shortcodes ON urls.id = shortcodes.url_id
            WHERE shortcodes.short_code = $1
            ` [shortCode]
           )
        // const code = allShortCodes.find((aCode) => aCode.newCode === shortCode)
    
        // if (!code) {
        //     res.status(400).json({ message: `this url: ${shortCode} can't be found in the db` })
        // } else {
    
        //     res.status(200).json({ message: `you have been redirected to ${code.original}` })
        // }

        if (result.rows.length === 0){
            return res.status(404).json({message: 'provide an existing short url'})
        }

        res.redirect(result.rows[0].original_url)
    } catch(error){
         console.error(error)
         res.status(500).json({message: `Server error`})
    }

})


app.listen(port, () => console.log(`Server has started on port ${port}`))