import { useEffect, useRef } from 'react'

/**
 * DnaFloatingParticles
 *
 * Lightweight canvas overlay that renders tiny floating DNA helices
 * and glowing particles in the background of the auth-visual panel.
 * Creates a subtle microscopic / futuristic depth effect.
 */
export default function DnaFloatingParticles({ className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId
    let width = 0
    let height = 0
    let dpr = 1
    let isVisible = true

    const isMobile = window.matchMedia('(max-width: 800px)').matches
    const DNA_COUNT = isMobile ? 4 : 8
    const PARTICLE_COUNT = isMobile ? 14 : 28

    // Generate mini DNA helix descriptors
    const miniDnas = Array.from({ length: DNA_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      basePairs: 6 + Math.floor(Math.random() * 5),
      helixRadius: 4 + Math.random() * 6,
      helixHeight: 28 + Math.random() * 34,
      speed: 0.003 + Math.random() * 0.005,
      rotSpeed: 0.008 + Math.random() * 0.012,
      phase: Math.random() * Math.PI * 2,
      driftX: (Math.random() - 0.5) * 0.00015,
      driftY: -0.00008 - Math.random() * 0.0002,
      opacity: 0.12 + Math.random() * 0.28,
      depth: 0.3 + Math.random() * 0.7,
      rotAngle: Math.random() * Math.PI * 2,
      tilt: (Math.random() - 0.5) * 0.4,
    }))

    // Generate floating particles
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      radius: 0.8 + Math.random() * 2,
      speed: 0.002 + Math.random() * 0.004,
      driftX: (Math.random() - 0.5) * 0.0003,
      driftY: -0.00005 - Math.random() * 0.00015,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.02,
      opacity: 0.15 + Math.random() * 0.45,
    }))

    const handleResize = () => {
      const parent = canvas.parentElement
      if (!parent) return false

      const rect = parent.getBoundingClientRect()
      const nextW = Math.round(rect.width)
      const nextH = Math.round(rect.height)

      if (nextW <= 0 || nextH <= 0) return false

      width = nextW
      height = nextH
      dpr = Math.min(window.devicePixelRatio || 1, 2)

      const targetW = Math.floor(width * dpr)
      const targetH = Math.floor(height * dpr)

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW
        canvas.height = targetH
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      return true
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(canvas.parentElement || canvas)
    window.addEventListener('resize', handleResize)
    handleResize()

    let lastTime = performance.now()

    const render = (now) => {
      if (!isVisible) {
        animationFrameId = null
        return
      }

      if (width <= 0 || height <= 0) {
        handleResize()
        lastTime = now
        animationFrameId = requestAnimationFrame(render)
        return
      }

      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now

      ctx.clearRect(0, 0, width, height)

      // --- Draw mini DNA helixes ---
      miniDnas.forEach((dna) => {
        // Drift position
        dna.x += dna.driftX * (dt * 60)
        dna.y += dna.driftY * (dt * 60)

        // Vertical float (sine wave)
        dna.phase += dna.speed * (dt * 60)
        const floatY = Math.sin(dna.phase) * 12

        // Wrap
        if (dna.y < -0.12) { dna.y = 1.12; dna.x = Math.random() }
        if (dna.y > 1.12) { dna.y = -0.12; dna.x = Math.random() }
        if (dna.x < -0.1) dna.x = 1.1
        if (dna.x > 1.1) dna.x = -0.1

        const cx = dna.x * width
        const cy = dna.y * height + floatY

        // Slow rotation for 3D feel
        dna.rotAngle += dna.rotSpeed * (dt * 60)

        const cosR = Math.cos(dna.tilt)
        const sinR = Math.sin(dna.tilt)

        const strandACol = [20, 241, 227]
        const strandBCol = [56, 189, 248]

        // Build 3D helix points
        const pointsA = []
        const pointsB = []

        for (let i = 0; i < dna.basePairs; i++) {
          const t = i / (dna.basePairs - 1)
          const yOff = (t - 0.5) * dna.helixHeight
          const angle = t * Math.PI * 2 + dna.rotAngle

          const xA_local = Math.cos(angle) * dna.helixRadius
          const zA = Math.sin(angle) * dna.helixRadius
          const xB_local = -xA_local
          const zB = -zA

          // Apply tilt
          const xA = cx + (xA_local * cosR - yOff * sinR)
          const yA = cy + (xA_local * sinR + yOff * cosR)
          const xB = cx + (xB_local * cosR - yOff * sinR)
          const yB = cy + (xB_local * sinR + yOff * cosR)

          const depthA = (zA + dna.helixRadius) / (2 * dna.helixRadius)
          const depthB = (zB + dna.helixRadius) / (2 * dna.helixRadius)

          pointsA.push({ x: xA, y: yA, depth: depthA })
          pointsB.push({ x: xB, y: yB, depth: depthB })
        }

        // Sort by z for proper depth rendering
        const indices = Array.from({ length: dna.basePairs }, (_, i) => i)
        indices.sort((a, b) => {
          const zA = Math.sin(a / (dna.basePairs - 1) * Math.PI * 2 + dna.rotAngle)
          const zB = Math.sin(b / (dna.basePairs - 1) * Math.PI * 2 + dna.rotAngle)
          return zA - zB
        })

        // Draw rungs (base pairs)
        indices.forEach((i) => {
          const pA = pointsA[i]
          const pB = pointsB[i]
          const avgDepth = (pA.depth + pB.depth) / 2
          const alpha = dna.opacity * (0.3 + avgDepth * 0.7)

          const midX = (pA.x + pB.x) / 2
          const midY = (pA.y + pB.y) / 2

          ctx.beginPath()
          ctx.moveTo(pA.x, pA.y)
          ctx.lineTo(midX, midY)
          ctx.strokeStyle = `rgba(${strandACol[0]}, ${strandACol[1]}, ${strandACol[2]}, ${alpha * 0.7})`
          ctx.lineWidth = 0.6 + avgDepth * 0.8
          ctx.stroke()

          ctx.beginPath()
          ctx.moveTo(midX, midY)
          ctx.lineTo(pB.x, pB.y)
          ctx.strokeStyle = `rgba(${strandBCol[0]}, ${strandBCol[1]}, ${strandBCol[2]}, ${alpha * 0.7})`
          ctx.lineWidth = 0.6 + avgDepth * 0.8
          ctx.stroke()

          // Central dot
          ctx.beginPath()
          ctx.arc(midX, midY, 0.8 + avgDepth * 0.6, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`
          ctx.fill()
        })

        // Draw backbones
        const drawStrand = (pts, col) => {
          for (let i = 0; i < pts.length - 1; i++) {
            const p1 = pts[i]
            const p2 = pts[i + 1]
            const avgDepth = (p1.depth + p2.depth) / 2
            const alpha = dna.opacity * (0.25 + avgDepth * 0.75)

            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${alpha})`
            ctx.lineWidth = 0.6 + avgDepth * 1
            ctx.stroke()
          }
        }

        drawStrand(pointsA, strandACol)
        drawStrand(pointsB, strandBCol)

        // Draw node dots on strands
        const drawNodes = (pts, col) => {
          pts.forEach((p) => {
            const alpha = dna.opacity * (0.2 + p.depth * 0.8)
            const r = 0.8 + p.depth * 1.2

            ctx.beginPath()
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${alpha})`
            ctx.fill()
          })
        }

        drawNodes(pointsA, strandACol)
        drawNodes(pointsB, strandBCol)
      })

      // --- Draw floating particles ---
      particles.forEach((p) => {
        p.x += p.driftX * (dt * 60)
        p.y += p.driftY * (dt * 60)

        // Horizontal float
        p.phase += p.pulseSpeed * (dt * 60)
        const floatX = Math.sin(p.phase * 0.7) * 6

        if (p.y < -0.05) { p.y = 1.05; p.x = Math.random() }
        if (p.y > 1.05) { p.y = -0.05; p.x = Math.random() }
        if (p.x < -0.05) p.x = 1.05
        if (p.x > 1.05) p.x = -0.05

        const px = p.x * width + floatX
        const py = p.y * height

        const pulse = Math.sin(p.phase) * 0.3 + 0.7
        const alpha = p.opacity * pulse

        // Glow
        const glowR = p.radius * 4
        const glow = ctx.createRadialGradient(px, py, 0, px, py, glowR)
        glow.addColorStop(0, `rgba(20, 241, 227, ${alpha * 0.5})`)
        glow.addColorStop(0.5, `rgba(20, 241, 227, ${alpha * 0.12})`)
        glow.addColorStop(1, 'rgba(20, 241, 227, 0)')

        ctx.beginPath()
        ctx.arc(px, py, glowR, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()

        // Core dot
        ctx.beginPath()
        ctx.arc(px, py, p.radius * pulse, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(180, 245, 240, ${alpha})`
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(render)
    }

    const handleVisibilityChange = () => {
      isVisible = !document.hidden
      if (isVisible && !animationFrameId) {
        lastTime = performance.now()
        handleResize()
        animationFrameId = requestAnimationFrame(render)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    lastTime = performance.now()
    animationFrameId = requestAnimationFrame(render)

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`dna-floating-particles ${className}`}
      aria-hidden="true"
    />
  )
}
