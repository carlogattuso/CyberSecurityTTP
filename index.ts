'use strict';
const WebSocketServer = require('ws').Server;
const express = require('express');
const path = require('path');
const server = require('http').createServer();
const PubSubManager = require('./models/pubsub');

const pubSubManager = new PubSubManager();

const app = express();

import bodyParser from 'body-parser';
import router from './routes/index';
import cors from 'cors';

const wss = new WebSocketServer({ server: server });

app.use(cors({origin:'http://localhost:4200'}));
app.use( express.json() );
app.use( '', router );
app.use( bodyParser.json() );

wss.on('connection', (ws, req) => {
    console.log(`Connection request from: ${req.connection.remoteAddress}`);
    ws.on('message', (data) => {
        const json = JSON.parse(data);

        const request = json.request;
        const message = json.message;
        const channel = json.channel;

        switch (request) {
            case 'PUBLISH':
                pubSubManager.publish(ws, channel, message);
                break;
            case 'SUBSCRIBE':
                pubSubManager.subscribe(ws, channel);
                break;
        }
    });
    ws.on('close', () => {
        console.log('Stopping client connection.');
    });
});

server.on('request', app);
server.listen(50001, () => {
    console.log('Server listening on http://localhost:50001');
});
