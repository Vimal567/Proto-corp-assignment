const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const HLS_BASE = process.env.HLS_BASE_URL || 'http://localhost:8080/hls';

// Example: return the 6 HLS URLs
app.get('/streams', (req, res) => {
    const urls = Array.from({ length: 6 }, (_, i) => `${HLS_BASE}/stream${i + 1}/index.m3u8`);
    res.json({ serverTime: Date.now(), streams: urls });
});

// Return server time in ms
app.get('/time', (req, res) => {
    res.json({ serverTime: Date.now() });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Broadcast utility
function broadcast(obj) {
    const msg = JSON.stringify(obj);
    wss.clients.forEach((c) => {
        if (c.readyState === WebSocket.OPEN) c.send(msg);
    });
}

wss.on('connection', (socket) => {
    console.log('WS client connected');
    // send serverTime on connect
    socket.send(JSON.stringify({ type: 'serverTime', serverTime: Date.now() }));

    socket.on('message', (raw) => {
        try {
            const data = JSON.parse(raw);
            if (data && data.type === 'requestPlayAt') {
                // client asked server to schedule a play_at time
                // server chooses T0 slightly in the future and broadcasts
                const now = Date.now();
                const T0 = now + 1500; // 1.5s in future (tune as needed)
                broadcast({ type: 'playAt', t0: T0 });
            }
            if (data && data.type === 'adminPlayNow') {
                broadcast({ type: 'playNow' });
            }
        } catch (e) {
            console.error('Invalid ws message', e);
        }
    });

    socket.on('close', () => console.log('WS client disconnected'));
});

server.listen(PORT, () => {
    console.log(`Sync server listening on ${PORT}`);
});