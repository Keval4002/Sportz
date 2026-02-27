import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet/arcjet.js";


function sendJson(socket, payload) {
    if(socket.readyState !== WebSocket.OPEN){
        return;
    }
    socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload){
    for(const client of wss.clients){
        if(client.readyState!==WebSocket.OPEN){
            continue;
        }
        client.send(JSON.stringify(payload));
    }
}

export function attachWebsocketServer(server){
    const wss = new WebSocketServer({server, path:"/ws", maxPayload: 1024*1024});
    
    wss.on('connection', async (socket, request)=>{

        if(wsArcjet){
            try {
                const decision = await wsArcjet.protect(request);
                if(decision.isDenied()){
                    const code = decision.reason.isRateLimit()?1013:1008;
                    const reason = decision.reason.isRateLimit()?'Rate limited':'Access Denied';
                    socket.close(code, reason);
                    return;
                }
            } catch (error) {
                console.error('Ws connection error', e);
                socket.close(1011, 'Server security error');
                return;
            }
        }

        socket.isAlive = true;
        sendJson(socket, {type: "connection_upgraded"});
        socket.on('error', console.error);

        socket.on('pong', ()=>{
            socket.isAlive = true;
            // sendJson(socket, {type: "pong"});
        })
    });

    const interval = setInterval(()=>{
        wss.clients.forEach((client)=>{
            if(!client.isAlive){
                return socket.terminate();
            }

            client.isAlive=false;
            // sendJson(client, {type: "ping"});
            client.ping();
        });
    }, 30000);

    wss.on('close', ()=>clearInterval(interval));

    function broadcastMatchCreated(match){
        broadcast(wss, {type:'match_created', data: match});
    }

    return {broadcastMatchCreated};
}

