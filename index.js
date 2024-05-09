const express = require('express')
const fs = require('fs');

const app = express()
const port = process.env.PORT || 3000


app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`)
    next()
})

//route
app.get('/', (req, res) => {
    const { ping } = req.params
    if(ping) res.json({message: ping})
    res.json({message: "PONG"})
})

app.get('/details', (req, res) => {

    const filename = 'package.json';
    let lines = 0, words = 0, letters = 0;

    fs.readFile(filename, 'utf8', (err, data) => {
        if (err) res.status(500).json({message: err.message});

        lines = data.split('\n').length;
        words = data.split(/\s+/).length;
        letters = data.replace(/\s/g, '').length;

        console.log(`File ${filename} has been Processed with Lines: ${lines} Words: ${words} Letters: ${letters}`);
        res.json({
            lines: lines,
            words: words,
            letters: letters
        })
    });
})

app.listen(port, () => {
  console.log(`file-reader-node application listening on port ${port}`)
})