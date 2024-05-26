const express = require('express')
const fs = require('fs');
var amqp = require('amqplib/callback_api');

const app = express()
const port = process.env.PORT || 3000

const rabbitmqUrl = `amqp://${process.env.RABBITMQ_USERNAME || 'user'}:${process.env.RABBITMQ_PASSWORD || 'password'}@${process.env.RABBITMQ_HOST || 'localhost'}:${process.env.RABBITMQ_PORT || 5672}`;
const queue = process.env.QUEUE_NAME || 'file-reader-node';

// Connect to RabbitMQ server
amqp.connect(rabbitmqUrl, (error0, connection) => {
    if (error0) {
        throw error0;
    }

    // Create a channel
    connection.createChannel((error1, channel) => {
        if (error1) {
            throw error1;
        }

        console.log(`[*] Waiting for messages in ${queue}. To exit press CTRL+C`);

        // Consume messages from the queue
        channel.consume(queue, (msg) => {
            if (msg !== null) {
                console.log(`[x] Received: ${msg.content.toString()}`);
                // Acknowledge the message
                channel.ack(msg);
            }
        });
    });
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