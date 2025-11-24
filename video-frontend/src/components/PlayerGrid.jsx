import { useEffect, useRef, useState } from "react";
import HlsPlayer from "./HlsPlayer";

const WS_URL = "ws://localhost:3000";
const STREAMS_API = "http://localhost:3000/streams";

export default function PlayerGrid() {
  const [streams, setStreams] = useState([]);
  const wsRef = useRef(null);
  const serverTimeRef = useRef(null);

  useEffect(() => {
    fetch(STREAMS_API)
      .then((r) => r.json())
      .then((data) => {
        setStreams(data.streams || []);
        serverTimeRef.current = data.serverTime;
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    wsRef.current = new WebSocket(WS_URL);
    wsRef.current.onopen = () => {
      // console.log("WS open");
    };
    wsRef.current.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      serverTimeRef.current = msg.serverTime;
    };
    return () => wsRef.current?.close();
  }, []);

  return (
    <div className="player-grid">
      {(streams.length ? streams : Array.from({ length: 6 })).map(
        (url, index) => (
          <div key={index} className="player-box">
            <HlsPlayer id={`player${index}`} src={url || ""} />
          </div>
        )
      )}
    </div>
  );
}
