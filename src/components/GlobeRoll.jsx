import { useEffect, useRef, useCallback } from 'react'
import Globe from 'globe.gl'
import { destinations } from '../data/destinations.js'

// Interactive 3D globe. Idles with a slow rotation; roll() spins it hard,
// decelerates, then flies to the landed destination.
export default function GlobeRoll({ onLanded, apiRef, height = 420 }) {
  const mountRef = useRef(null)
  const globeRef = useRef(null)
  const spinTimer = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const globe = Globe()(mount)
      .width(mount.clientWidth)
      .height(height)
      .backgroundColor('rgba(0,0,0,0)')
      .globeImageUrl('/earth-blue-marble.jpg')
      .bumpImageUrl('/earth-topology.png')
      .atmosphereColor('#2ec4c9')
      .atmosphereAltitude(0.18)
      .pointsData(destinations)
      .pointLat('lat')
      .pointLng('lng')
      .pointColor(() => '#f5b942')
      .pointAltitude(0.015)
      .pointRadius(0.55)
      .pointsMerge(true)

    globe.controls().autoRotate = true
    globe.controls().autoRotateSpeed = 0.6
    globe.controls().enableZoom = false
    globe.pointOfView({ lat: 20, lng: -40, altitude: 2.1 })

    globeRef.current = globe

    const onResize = () => globe.width(mount.clientWidth)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      clearInterval(spinTimer.current)
      globe._destructor && globe._destructor()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const roll = useCallback((trip) => {
    const globe = globeRef.current
    if (!globe) return
    clearInterval(spinTimer.current)

    let speed = 34
    globe.controls().autoRotate = true
    globe.controls().autoRotateSpeed = speed

    spinTimer.current = setInterval(() => {
      speed *= 0.9
      globe.controls().autoRotateSpeed = speed
      if (speed < 1.4) {
        clearInterval(spinTimer.current)
        globe.controls().autoRotate = false
        globe.pointOfView({ lat: trip.dest.lat, lng: trip.dest.lng, altitude: 1.5 }, 1400)
        globe.ringsData([{ lat: trip.dest.lat, lng: trip.dest.lng }])
          .ringLat('lat').ringLng('lng')
          .ringColor(() => '#ff6b57')
          .ringMaxRadius(5).ringPropagationSpeed(2).ringRepeatPeriod(800)
        setTimeout(() => {
          onLanded && onLanded(trip)
          setTimeout(() => {
            globe.controls().autoRotate = true
            globe.controls().autoRotateSpeed = 0.6
          }, 2500)
        }, 1500)
      }
    }, 120)
  }, [onLanded])

  useEffect(() => {
    if (apiRef) apiRef.current = { roll }
  }, [apiRef, roll])

  return <div ref={mountRef} className="globe-wrap mx-auto w-full" style={{ height, maxWidth: 640 }} />
}
