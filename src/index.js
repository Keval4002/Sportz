import express from 'express'
import { matchRouter } from './routes/matches.js';
import 'dotenv/config'
import {attachWebsocketServer} from './ws/server.js'
import http from 'http'

const app = express();

const PORT = process.env.PORT||8000;
const HOST = process.env.HOST||'0.0.0.0';

const server = http.createServer(app);

app.use(express.json());

app.get('/', (req, res)=>{
    console.log("Hello from express server");
});

app.use('/matches', matchRouter);

const {broadcastMatchCreated} = attachWebsocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

server.listen(PORT, ()=>{
    const baseUrl = HOST === '0.0.0.0'? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`
    console.log(`Running server on ${baseUrl}`);
    console.log(`Websocket running on ${baseUrl.replace('http', 'ws')}/ws`);
})