import express from 'express'

const port = process.env.PORT || 8005

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

let allUrls = [
    // {id: "", originalUrl: ""}
    // {id: 1, originalUrl: "hello there"}

]

let allShortCodes = [
    // {newCode: "", original: ""}
]

// POST /url/shorten
app.post('/url/shorten', async (req, res) => {
    console.log(req.body)

    if (!req.body.originalUrl) {
        res.status(400).json({ message: "Please include a url" })

    }
    console.log(req.body.originalUrl)


    const newUrl = {
        id: allUrls.length + 1,
        originalUrl: req.body.originalUrl
    }

    allUrls.push(newUrl)


    const generateShortUrl = (url) => {
        const newShortCode = url.replace(url, `http://localhost:3000/url/${url.slice(20, 26)}`)

        // console.log(req.body.originalUrl)
        allShortCodes.push({ newCode: newShortCode, original: url })
        return newShortCode
    }
    res.status(201).json({ shortUrl: generateShortUrl(req.body.originalUrl) })

})

// app.get('/', (req, res) => {
//      res.json(allUrls)
// })

app.listen(port, () => console.log(`Server has started on port ${port}`))