import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({port: 8080});

//ready state -- 0 connecting, 1 open, 2 closing, 3 closed

wss.on('connection', (socket, request)=>{
    const ip = request.socket.remoteAddress;

    socket.on('message', (rawData)=>{
        const message = rawData.toString();
        console.log({message});

        wss.clients.forEach((client)=>{
            if(client.readyState === 1 || client.readyState === WebSocket.OPEN){
                client.send(`Server broadcasts: ${message}`)
            }
        })

        socket.on('error', (err)=>{
            console.error(`Error: ${err.message} from ${ip}`);
        })

        socket.on('close', ()=>{
            console.log('Client Disconnected');

        })

        console.log(wss.clients.size);


    })
})

console.log("Websocket live over port ws://localhost:8080");

console.log(wss.clients.size);