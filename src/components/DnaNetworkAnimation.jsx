import { useEffect, useRef } from 'react'

/**
 * DnaNetworkAnimation
 *
 * Renders a high-tech 3D rotating DNA double helix integrated with an
 * interconnected bio-molecular particle network (neural/data plexus).
 * Features glowing bioluminescent nodes, base-pair hydrogen bonds,
 * depth sorting, and smooth responsive mouse parallax.
 */
export default function DnaNetworkAnimation({ className = '' }) {
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

    // Mouse parallax lerp targets
    const mouse = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
    }

    // Config parameters
    const BASE_PAIRS = 40
    const TURNS = 2.4
    const NETWORK_COUNT = 36
    const SPEED = 0.016

    let rotation = 0

    // Initialize floating network particles
    const networkParticles = Array.from({ length: NETWORK_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0007,
      vy: (Math.random() - 0.5) * 0.0005,
      radius: 1.4 + Math.random() * 2.2,
      baseAlpha: 0.25 + Math.random() * 0.55,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.03,
    }))

    // Small glowing energy packets traveling along the DNA rungs
    const energyPackets = Array.from({ length: 6 }, (_, i) => ({
      pairIndex: Math.floor((i / 6) * BASE_PAIRS),
      progress: Math.random(),
      speed: 0.008 + Math.random() * 0.012,
      direction: Math.random() > 0.5 ? 1 : -1,
      color: i % 2 === 0 ? '#14f1e3' : '#38bdf8',
    }))

    // Track mouse over promo section
    const parentSection =
      canvas.closest('.login-promo') ||
      canvas.closest('.auth-visual') ||
      canvas.parentElement

    const handleResize = () => {
      if (!canvas) return false
      const rect = canvas.getBoundingClientRect()
      const parentRect = parentSection ? parentSection.getBoundingClientRect() : null

      const nextW = Math.round(
        rect.width ||
        parentRect?.width ||
        canvas.clientWidth ||
        parentSection?.clientWidth ||
        0
      )
      const nextH = Math.round(
        rect.height ||
        parentRect?.height ||
        canvas.clientHeight ||
        parentSection?.clientHeight ||
        0
      )

      if (nextW <= 0 || nextH <= 0) {
        return false
      }

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

    const resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    resizeObserver.observe(canvas)
    if (parentSection) {
      resizeObserver.observe(parentSection)
    }
    window.addEventListener('resize', handleResize)
    handleResize()

    const handleMouseMove = (e) => {
      if (!parentSection) return
      const rect = parentSection.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const nx = (e.clientX - rect.left) / rect.width - 0.5
      const ny = (e.clientY - rect.top) / rect.height - 0.5
      mouse.targetX = nx * 35
      mouse.targetY = ny * 25
    }

    const handleMouseLeave = () => {
      mouse.targetX = 0
      mouse.targetY = 0
    }

    if (parentSection) {
      parentSection.addEventListener('mousemove', handleMouseMove)
      parentSection.addEventListener('mouseleave', handleMouseLeave)
    }

    let lastTime = performance.now()

    const render = (now) => {
      if (!isVisible) {
        animationFrameId = null
        return
      }

      // Auto-recover dimensions if zero on initial route transition
      if (width <= 0 || height <= 0) {
        handleResize()
        lastTime = now
        if (width <= 0 || height <= 0) {
          animationFrameId = requestAnimationFrame(render)
          return
        }
      }

      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now

      // Smooth mouse lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.06
      mouse.y += (mouse.targetY - mouse.y) * 0.06

      rotation += SPEED * (dt * 60)

      ctx.clearRect(0, 0, width, height)

      if (width === 0 || height === 0) {
        animationFrameId = requestAnimationFrame(render)
        return
      }

      // Responsive positioning:
      // On wide screens, position gracefully in the right-center of the promo panel
      // On smaller screens, center it
      const isWide = width >= 640
      const centerX = isWide ? width * 0.68 + mouse.x * 0.8 : width * 0.5 + mouse.x * 0.6
      const centerY = height * 0.5 + mouse.y * 0.8

      // DNA dimensions
      const helixRadius = isWide
        ? Math.min(width * 0.22, 105)
        : Math.min(width * 0.32, 90)
      const helixHeight = height * 1.18
      const tiltAngle = isWide ? -0.26 : -0.15 // ~15-18 deg tilt

      // Calculate 3D points for DNA strands
      const strandA = []
      const strandB = []
      const basePairs = []

      for (let i = 0; i < BASE_PAIRS; i++) {
        const t = i / (BASE_PAIRS - 1)
        const yOffset = (t - 0.5) * helixHeight
        const angle = t * TURNS * Math.PI * 2 + rotation

        // 3D coordinates in helix local frame
        const xA_local = Math.cos(angle) * helixRadius
        const zA = Math.sin(angle) * helixRadius

        const xB_local = -xA_local
        const zB = -zA

        // Apply tilt rotation around center
        const cosT = Math.cos(tiltAngle)
        const sinT = Math.sin(tiltAngle)

        const xA = centerX + (xA_local * cosT - yOffset * sinT)
        const yA = centerY + (xA_local * sinT + yOffset * cosT)

        const xB = centerX + (xB_local * cosT - yOffset * sinT)
        const yB = centerY + (xB_local * sinT + yOffset * cosT)

        // Depth projection & weights (range 0..1, 1 is closest)
        const depthA = (zA + helixRadius) / (2 * helixRadius)
        const depthB = (zB + helixRadius) / (2 * helixRadius)
        const avgDepth = (depthA + depthB) / 2

        const nodeA = { x: xA, y: yA, z: zA, depth: depthA, strand: 'A', index: i }
        const nodeB = { x: xB, y: yB, z: zB, depth: depthB, strand: 'B', index: i }

        strandA.push(nodeA)
        strandB.push(nodeB)

        basePairs.push({
          nodeA,
          nodeB,
          avgDepth,
          avgZ: (zA + zB) / 2,
          index: i,
        })
      }

      // 1. Update and draw Network (Plexus / Molecular Nodes)
      const screenParticles = networkParticles.map((p) => {
        p.x += p.vx * (dt * 60)
        p.y += p.vy * (dt * 60)

        // Wrap around borders
        if (p.x < -0.05) p.x = 1.05
        if (p.x > 1.05) p.x = -0.05
        if (p.y < -0.05) p.y = 1.05
        if (p.y > 1.05) p.y = -0.05

        p.phase += p.pulseSpeed * (dt * 60)
        const alphaPulse = Math.sin(p.phase) * 0.2 + 0.8
        const curAlpha = p.baseAlpha * alphaPulse

        const px = p.x * width + mouse.x * 0.3
        const py = p.y * height + mouse.y * 0.3

        return { x: px, y: py, radius: p.radius, alpha: curAlpha }
      })

      // Draw lines between network particles
      const maxConnDist = 95
      for (let i = 0; i < screenParticles.length; i++) {
        for (let j = i + 1; j < screenParticles.length; j++) {
          const pi = screenParticles[i]
          const pj = screenParticles[j]
          const dx = pi.x - pj.x
          const dy = pi.y - pj.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < maxConnDist) {
            const lineAlpha = (1 - dist / maxConnDist) * 0.22 * Math.min(pi.alpha, pj.alpha)
            ctx.beginPath()
            ctx.moveTo(pi.x, pi.y)
            ctx.lineTo(pj.x, pj.y)
            ctx.strokeStyle = `rgba(33, 206, 196, ${lineAlpha})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }

      // Connect network particles to nearby DNA nodes
      const maxDnaConnDist = 115
      for (let i = 0; i < screenParticles.length; i++) {
        const p = screenParticles[i]
        for (let j = 0; j < strandA.length; j += 2) {
          const node = strandA[j]
          const dx = p.x - node.x
          const dy = p.y - node.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < maxDnaConnDist) {
            const connAlpha = (1 - dist / maxDnaConnDist) * 0.25 * node.depth
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(node.x, node.y)
            ctx.strokeStyle = `rgba(20, 241, 227, ${connAlpha})`
            ctx.lineWidth = 0.7
            ctx.stroke()
          }
        }
      }

      // Draw network particles
      screenParticles.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(34, 201, 195, ${p.alpha * 0.6})`
        ctx.fill()
      })

      // 2. Sort base-pair rungs and nodes for realistic 3D depth rendering
      const sortedPairs = [...basePairs].sort((a, b) => a.avgZ - b.avgZ)

      // Draw base pairs (rungs)
      sortedPairs.forEach((pair) => {
        const { nodeA, nodeB, avgDepth, index } = pair

        const isAT = index % 2 === 0
        const colStrandA = isAT ? 'rgba(20, 241, 227,' : 'rgba(56, 189, 248,'
        const colStrandB = isAT ? 'rgba(16, 185, 129,' : 'rgba(6, 182, 212,'

        const rungAlpha = 0.22 + avgDepth * 0.72
        const rungWidth = 0.9 + avgDepth * 1.5

        const midX = (nodeA.x + nodeB.x) / 2
        const midY = (nodeA.y + nodeB.y) / 2

        // Strand A to midpoint
        const grad1 = ctx.createLinearGradient(nodeA.x, nodeA.y, midX, midY)
        grad1.addColorStop(0, `${colStrandA} ${rungAlpha})`)
        grad1.addColorStop(1, `${colStrandA} ${rungAlpha * 0.4})`)

        ctx.beginPath()
        ctx.moveTo(nodeA.x, nodeA.y)
        ctx.lineTo(midX, midY)
        ctx.strokeStyle = grad1
        ctx.lineWidth = rungWidth
        ctx.stroke()

        // Strand B to midpoint
        const grad2 = ctx.createLinearGradient(midX, midY, nodeB.x, nodeB.y)
        grad2.addColorStop(0, `${colStrandB} ${rungAlpha * 0.4})`)
        grad2.addColorStop(1, `${colStrandB} ${rungAlpha})`)

        ctx.beginPath()
        ctx.moveTo(midX, midY)
        ctx.lineTo(nodeB.x, nodeB.y)
        ctx.strokeStyle = grad2
        ctx.lineWidth = rungWidth
        ctx.stroke()

        // Central hydrogen bond junction dot
        const dotRadius = 1.2 + avgDepth * 1.3
        ctx.beginPath()
        ctx.arc(midX, midY, dotRadius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${rungAlpha * 0.85})`
        ctx.fill()
      })

      // 3. Draw backbone continuous curves for Strand A & Strand B
      const drawBackbone = (strand, baseColor) => {
        for (let i = 0; i < strand.length - 1; i++) {
          const p1 = strand[i]
          const p2 = strand[i + 1]
          const avgDepth = (p1.depth + p2.depth) / 2

          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.strokeStyle = `${baseColor} ${0.32 + avgDepth * 0.68})`
          ctx.lineWidth = 1.2 + avgDepth * 2.2
          ctx.stroke()
        }
      }

      drawBackbone(strandA, 'rgba(20, 241, 227,')
      drawBackbone(strandB, 'rgba(56, 189, 248,')

      // 4. Draw Strand Nodes with Bioluminescent Glow & 3D Depth
      const allNodes = [...strandA, ...strandB].sort((a, b) => a.z - b.z)

      allNodes.forEach((node) => {
        const { x, y, depth, strand } = node
        const isA = strand === 'A'

        const radius = 2.4 + depth * 3.8
        const alpha = 0.35 + depth * 0.65

        // Glowing halo for front-facing nodes
        if (depth > 0.55) {
          const glowRadius = radius * 3.4
          const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, glowRadius)
          const glowColor = isA ? '20, 241, 227' : '56, 189, 248'
          glowGrad.addColorStop(0, `rgba(${glowColor}, ${alpha * 0.5})`)
          glowGrad.addColorStop(0.5, `rgba(${glowColor}, ${alpha * 0.18})`)
          glowGrad.addColorStop(1, `rgba(${glowColor}, 0)`)

          ctx.beginPath()
          ctx.arc(x, y, glowRadius, 0, Math.PI * 2)
          ctx.fillStyle = glowGrad
          ctx.fill()
        }

        // Inner core
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = isA
          ? `rgba(22, 238, 225, ${alpha})`
          : `rgba(96, 165, 250, ${alpha})`
        ctx.fill()

        // Center specular highlight
        if (depth > 0.7) {
          ctx.beginPath()
          ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.4, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${depth * 0.9})`
          ctx.fill()
        }
      })

      // 5. Draw dynamic energy pulses along the DNA
      energyPackets.forEach((pkt) => {
        pkt.progress += pkt.speed * pkt.direction * (dt * 60)
        if (pkt.progress > 1) {
          pkt.progress = 1
          pkt.direction = -1
        } else if (pkt.progress < 0) {
          pkt.progress = 0
          pkt.direction = 1
        }

        const pair = basePairs[pkt.pairIndex]
        if (!pair) return

        const ex = pair.nodeA.x + (pair.nodeB.x - pair.nodeA.x) * pkt.progress
        const ey = pair.nodeA.y + (pair.nodeB.y - pair.nodeA.y) * pkt.progress
        const pulseRadius = 2.2 + pair.avgDepth * 2.5

        ctx.beginPath()
        ctx.arc(ex, ey, pulseRadius, 0, Math.PI * 2)
        ctx.fillStyle = pkt.color
        ctx.shadowColor = pkt.color
        ctx.shadowBlur = 8
        ctx.fill()
        ctx.shadowBlur = 0
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
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (parentSection) {
        parentSection.removeEventListener('mousemove', handleMouseMove)
        parentSection.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`dna-network-canvas ${className}`}
      aria-hidden="true"
    />
  )
}
