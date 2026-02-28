import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet/arcjet.js";

const matchSubscribers = new Map();

const subscribe = (matchId, socket)=>{
    if(!matchSubscribers.has(matchId)){
        matchSubscribers.set(matchId, new Set());
    }

    matchSubscribers.get(matchId).add(socket);
}

const unsubscribe = (matchId, socket)=>{
    const subscribers = matchSubscribers.get(matchId);
    if(!subscribers) return;

    subscribers.delete(socket);

    if(subscribers.size===0){
        matchSubscribers.delete(matchId);
    }
}

const cleanupSubscriptions = (socket)=>{
    for(const matchId of socket.subscriptions){
        unsubscribe(matchId, socket);
    }
}

function broadcastToMatch(matchId, payload){
    const subscribers = matchSubscribers.get(matchId);

    if(!subscribers||subscribers.size===0) return;

    const message = JSON.stringify(payload);

    for(const client of subscribers){
        if(client.readyState === WebSocket.OPEN){
            client.send(message);
        }
    }
}


function sendJson(socket, payload) {
    if(socket.readyState !== WebSocket.OPEN){
        return;
    }
    socket.send(JSON.stringify(payload));
}

function broadcastToAll(wss, payload){
    for(const client of wss.clients){
        if(client.readyState!==WebSocket.OPEN){
            continue;
        }
        client.send(JSON.stringify(payload));
    }
}

function handleMessage(socket, data){
    let message;

    try {
        message = JSON.parse(data.toString());
    } catch (error) {
        sendJson(socket, {type: 'error', message: "Invalid Json."});
        return;
    }

    if(message?.type === "subscribe" && Number.isInteger(message.matchId)){
        subscribe(message.matchId, socket);
        socket.subscriptions.add(message.matchId);
        sendJson(socket, {type:'subscribed', matchId: message.matchId});
        return;
    }

    if(message?.type === "unsubscribe" && Number.isInteger(message.matchId)){
        unsubscribe(message.matchId, socket);
        socket.subscriptions.delete(message.matchId);
        sendJson(socket, {type:"unsubscribed", matchId: message.matchId});
        return;
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
                console.error('Ws connection error', error);
                socket.close(1011, 'Server security error');
                return;
            }
        }

        socket.isAlive = true;

        socket.subscriptions = new Set();
        
        sendJson(socket, {type: "connection_upgraded"});

        socket.on('error', ()=>{
            socket.terminate();
        });

        socket.on('pong', ()=>{
            socket.isAlive = true;
            // sendJson(socket, {type: "pong"});
        })

        socket.on('message', (data)=>{
            handleMessage(socket, data);
        })

        socket.on('close', ()=>{
            cleanupSubscriptions(socket)
        })
    });

    const interval = setInterval(()=>{
        wss.clients.forEach((client)=>{
            if(!client.isAlive){
                cleanupSubscriptions(client);
                return client.terminate();
            }

            client.isAlive=false;
            // sendJson(client, {type: "ping"});
            client.ping();
        });
    }, 30000);

    wss.on('close', ()=>clearInterval(interval));

    function broadcastMatchCreated(match){
        broadcastToAll(wss, {type:'match_created', data: match});
    }

    function broadcastCommentary(matchId, comment){
        broadcastToMatch(matchId, {type: 'commentary', data: comment});
    }

    return {broadcastMatchCreated, broadcastCommentary};
}

