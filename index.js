const { channel } = require('diagnostics_channel');
const express = require('express')
const fs = require('fs');
const redis = require('redis')
const WebSocket = require('ws');
const EventEmitter = require('events');
// Initialize EventEmitter to act as a sink
const messageSink = new EventEmitter();

const app = express()
const port = process.env.PORT || 3000

const processFile = (fileName, callback) => {
    let lines = 0, words = 0, letters = 0;

    fs.readFile(fileName, 'utf8', (err, data) => {
        if (err) callback(err,null)

        lines = data.split('\n').length;
        words = data.split(/\s+/).length;
        letters = data.replace(/\s/g, '').length;

        console.log(`File ${fileName} has been Processed with Lines: ${lines} Words: ${words} Letters: ${letters}`);
        callback(null, {
            lines: lines,
            words: words,
            letters: letters
        })        
    });
}

const client = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
})

client.on('error', err => console.log('Redis Client Error', err));

client.connect().then(r => console.log(`Redis Connected`)).catch(e => console.error(`Redis connection error`));

client.subscribe('channel', (message) => {
    console.log(`[*] Received message ${message}`);
    messageSink.emit('message', "Received Message, Processing it! ...");
    console.log(`Message type ${typeof message}`)

    processFile(message, (e, r) => {
        console.log(`Message: ${message}, e: ${e}, r: ${r}`)
        if(e) messageSink.emit('message', "ERROR occured")
        messageSink.emit('message', JSON.stringify(r))
    })
    
});


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
    const filename = req.params.fileName || 'package.json'
    processFile(filename, (e, r) => {
        if(!e) res.json(r)
        console.log(e)
    })
})

app.listen(port, () => {
    console.log(`file-reader-node application listening on port ${port}`)
})

const server = new WebSocket.Server({ port: 3001 });

server.on('connection', ws => {
    const messageListener = (message) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
        }
    };

    ws.send('Welcome to the server!');
    console.log('file-reader-node application listning on port 3001');
    
    messageSink.on('message', messageListener);

    ws.on('message', message => {
        messageSink.emit('message', message);
    });

    ws.on('close', () => {
        messageSink.off('message', messageListener);
        console.log('Connection closed');
    });
});