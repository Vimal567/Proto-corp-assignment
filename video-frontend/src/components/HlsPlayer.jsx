import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

// drift-correction params
const DRIFT_CHECK_INTERVAL = 800 // ms
const MAX_DRIFT_BEFORE_SEEK = 0.5 // seconds
const ADJUSTMENT_PLAYBACK_RATE = 1.02

export default function HlsPlayer({ id, src }) {
    const videoRef = useRef(null)
    const hlsRef = useRef(null)
    const [ready, setReady] = useState(false)
    const scheduledStartRef = useRef(null)

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        if (Hls.isSupported()) {
            const hls = new Hls({ lowLatencyMode: true })
            hls.attachMedia(video)
            hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                if (src) hls.loadSource(src)
            })
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setReady(true)
                // prebuffer a little
                video.muted = true
                video.play().then(() => {
                    video.pause()
                    video.muted = false
                }).catch(() => { })
            })
            hlsRef.current = hls
        } else {
            video.src = src
        }

        return () => {
            hlsRef.current?.destroy()
        }
    }, [src])

    // playAt listener
    useEffect(() => {
        function onPlayAt(e) {
            const t0 = e.detail
            schedulePlay(t0)
        }
        function onPlayNow() {
            // immediate play
            videoRef.current?.play().catch(() => { })
        }
        window.addEventListener('playAt', onPlayAt)
        window.addEventListener('playNow', onPlayNow)
        return () => {
            window.removeEventListener('playAt', onPlayAt)
            window.removeEventListener('playNow', onPlayNow)
        }
    }, [ready])

    // scheduling logic
    function schedulePlay(t0ms) {
        const video = videoRef.current
        if (!video) return
        const now = Date.now()
        const delay = Math.max(0, t0ms - now)
        scheduledStartRef.current = Date.now() + delay
        setTimeout(() => {
            const desiredPosition = (Date.now() - t0ms) / 1000
            try {
                if (Math.abs(video.currentTime - desiredPosition) > 1.0) {
                    video.currentTime = Math.max(0, desiredPosition)
                }
            } catch (e) { console.warn('seek error', e) }
            video.play().catch(() => { })
        }, delay)
        // start drift monitor
        startDriftMonitor()
    }

    // drift monitor
    let driftInterval = useRef(null)
    function startDriftMonitor() {
        if (driftInterval.current) return
        driftInterval.current = setInterval(() => {
            const video = videoRef.current
            if (!video || !scheduledStartRef.current) { return };
            const expectedPos = (Date.now() - scheduledStartRef.current) / 1000
            const current = video.currentTime || 0
            const drift = current - expectedPos
            // small drift: adjust playbackRate briefly
            if (Math.abs(drift) > 0.15 && Math.abs(drift) < MAX_DRIFT_BEFORE_SEEK) {
                // speed up or slow down
                video.playbackRate = drift > 0 ? 0.98 : ADJUSTMENT_PLAYBACK_RATE
                setTimeout(() => { if (video) video.playbackRate = 1 }, 300)
            } else if (Math.abs(drift) >= MAX_DRIFT_BEFORE_SEEK) {
                // bigger drift -> seek
                try { video.currentTime = expectedPos } catch (e) { }
            }
        }, DRIFT_CHECK_INTERVAL)
    }

    // cleanup
    useEffect(() => {
        return () => {
            if (driftInterval.current) clearInterval(driftInterval.current)
        }
    }, [])

    return (
        <div className='player-container'>
            <video
                id={id}
                ref={videoRef}
                className='player'
                controls
                playsInline
            />
        </div>
    )
}
