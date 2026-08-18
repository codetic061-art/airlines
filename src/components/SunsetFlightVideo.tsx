import React, { useEffect, useRef, useState } from 'react';

interface SunsetFlightVideoProps {
  className?: string;
  isLooping?: boolean;
}

export const SunsetFlightVideo: React.FC<SunsetFlightVideoProps> = ({ 
  className = '',
  isLooping = true 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback
      });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let startTime = performance.now();

    // Set canvas dimensions with device pixel ratio for crystal sharpness
    const resizeCanvas = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Birds flock setup flying across towards the glowing sun
    const birds = [
      { xOffset: 0.52, yOffset: 0.38, scale: 1.05, speed: 0.022, flapSpeed: 5.5, phase: 0 },
      { xOffset: 0.56, yOffset: 0.36, scale: 0.9, speed: 0.022, flapSpeed: 5.8, phase: 0.5 },
      { xOffset: 0.60, yOffset: 0.35, scale: 0.78, speed: 0.022, flapSpeed: 6.0, phase: 1.0 },
      { xOffset: 0.64, yOffset: 0.37, scale: 0.68, speed: 0.022, flapSpeed: 6.4, phase: 1.5 },
      { xOffset: 0.68, yOffset: 0.34, scale: 0.58, speed: 0.022, flapSpeed: 6.8, phase: 2.0 },
      { xOffset: 0.72, yOffset: 0.33, scale: 0.48, speed: 0.022, flapSpeed: 7.2, phase: 2.5 },
      { xOffset: 0.58, yOffset: 0.40, scale: 0.82, speed: 0.022, flapSpeed: 5.9, phase: 0.7 },
      { xOffset: 0.62, yOffset: 0.41, scale: 0.62, speed: 0.022, flapSpeed: 6.6, phase: 1.3 },
    ];

    const render = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000;
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Subtle atmospheric flight camera drift
      const wobbleX = Math.sin(elapsed * 0.5) * 2.0;
      const wobbleY = Math.cos(elapsed * 0.4) * 2.5;

      // 1. Cinematic Sky Gradient (Matching exact user video colors)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.58);
      skyGrad.addColorStop(0.0, '#0f1738'); // Deep Royal Indigo Top
      skyGrad.addColorStop(0.18, '#1e295d'); // Midnight Blue
      skyGrad.addColorStop(0.38, '#702d68'); // Deep Purple Magenta
      skyGrad.addColorStop(0.55, '#c8386b'); // Radiant Sunset Pink / Fuchsia
      skyGrad.addColorStop(0.72, '#f25c69'); // Coral Pink
      skyGrad.addColorStop(0.88, '#fb965c'); // Warm Golden Orange
      skyGrad.addColorStop(1.0, '#fed180'); // Radiant Golden Horizon

      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Setting Golden Sun on Right Horizon
      const sunX = w * 0.79 + wobbleX * 0.2;
      const sunY = h * 0.47 + wobbleY * 0.2;
      const sunRadius = Math.max(18, h * 0.038);

      // Vast Atmospheric Radial Sun Flare & Bloom
      const sunAtmosphere = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.1, sunX, sunY, w * 0.6);
      sunAtmosphere.addColorStop(0.0, 'rgba(255, 255, 235, 0.95)');
      sunAtmosphere.addColorStop(0.06, 'rgba(255, 215, 120, 0.8)');
      sunAtmosphere.addColorStop(0.18, 'rgba(255, 130, 95, 0.45)');
      sunAtmosphere.addColorStop(0.4, 'rgba(210, 60, 110, 0.18)');
      sunAtmosphere.addColorStop(0.7, 'rgba(120, 30, 90, 0.06)');
      sunAtmosphere.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = sunAtmosphere;
      ctx.fillRect(0, 0, w, h);

      // Intense White-Hot Sun Disk
      const sunCore = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 1.5);
      sunCore.addColorStop(0.0, '#ffffff');
      sunCore.addColorStop(0.35, '#fff7dc');
      sunCore.addColorStop(0.7, '#ffca58');
      sunCore.addColorStop(1.0, 'rgba(255, 180, 60, 0)');

      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = sunCore;
      ctx.fill();

      // Horizontal Golden Anamorphic Lens Flare
      const flareGrad = ctx.createLinearGradient(sunX - w * 0.45, sunY, sunX + w * 0.45, sunY);
      flareGrad.addColorStop(0, 'rgba(255, 220, 150, 0)');
      flareGrad.addColorStop(0.5, 'rgba(255, 255, 240, 0.55)');
      flareGrad.addColorStop(1, 'rgba(255, 220, 150, 0)');
      
      ctx.fillStyle = flareGrad;
      ctx.fillRect(sunX - w * 0.45, sunY - 3, w * 0.9, 6);

      // 3. Vast Cloud Bed below flight level
      const cloudBaseY = h * 0.48;
      
      // Far deep horizon base
      const horizonGrad = ctx.createLinearGradient(0, cloudBaseY, 0, h);
      horizonGrad.addColorStop(0.0, '#f99e7b');
      horizonGrad.addColorStop(0.18, '#ca4e78');
      horizonGrad.addColorStop(0.45, '#6a2c68');
      horizonGrad.addColorStop(0.8, '#2b1638');
      horizonGrad.addColorStop(1.0, '#150a1e');
      
      ctx.fillStyle = horizonGrad;
      ctx.fillRect(0, cloudBaseY, w, h - cloudBaseY);

      // Procedural Cloud Puffs with dynamic volumetric shading
      const drawCloud = (cx: number, cy: number, rx: number, ry: number, baseCol: string, rimLight: boolean) => {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        
        if (rimLight) {
          const cloudGrad = ctx.createRadialGradient(cx, cy - ry * 0.4, 0, cx, cy, rx);
          cloudGrad.addColorStop(0.0, 'rgba(255, 220, 180, 0.95)');
          cloudGrad.addColorStop(0.4, 'rgba(245, 120, 110, 0.85)');
          cloudGrad.addColorStop(1.0, baseCol);
          ctx.fillStyle = cloudGrad;
          ctx.shadowColor = 'rgba(255, 200, 140, 0.4)';
          ctx.shadowBlur = 12;
        } else {
          ctx.fillStyle = baseCol;
        }
        
        ctx.fill();
        ctx.restore();
      };

      // 3 Layers of volumetric clouds
      const layers = [
        { count: 20, yMin: 0.49, yMax: 0.60, speed: 10, col: 'rgba(235, 115, 105, 0.75)', rx: 110, ry: 48 },
        { count: 16, yMin: 0.58, yMax: 0.75, speed: 20, col: 'rgba(180, 65, 105, 0.85)', rx: 150, ry: 65 },
        { count: 12, yMin: 0.72, yMax: 0.96, speed: 34, col: 'rgba(85, 30, 75, 0.92)', rx: 200, ry: 90 },
      ];

      layers.forEach((layer, lIdx) => {
        for (let i = 0; i < layer.count; i++) {
          const seed = i * 149.3 + lIdx * 67;
          const drift = (elapsed * layer.speed + seed * 8) % (w * 1.6) - w * 0.3;
          const cy = h * (layer.yMin + ((Math.sin(seed * 0.7) + 1) / 2) * (layer.yMax - layer.yMin)) + wobbleY * 0.3 * (lIdx + 1);
          const rx = layer.rx * (0.8 + ((Math.cos(seed * 1.5) + 1) / 2) * 0.45);
          const ry = layer.ry * (0.8 + ((Math.sin(seed * 2.1) + 1) / 2) * 0.45);

          const distToSun = Math.abs(drift - sunX) / w;
          const isSunlit = distToSun < 0.38 && cy < h * 0.64;

          drawCloud(drift, cy, rx, ry, layer.col, isSunlit);
        }
      });

      // 4. Soaring Flock of Birds Flying Towards the Sunset
      birds.forEach((bird) => {
        const loopProgress = (elapsed * bird.speed + bird.phase) % 1.0;
        const bx = (bird.xOffset + loopProgress * 0.4) * w;
        const by = (bird.yOffset + Math.sin(elapsed * 1.2 + bird.phase * 2.5) * 0.012) * h + wobbleY * 0.3;
        const scale = (bird.scale * Math.min(w, h)) / 850;
        const flap = Math.sin(elapsed * bird.flapSpeed + bird.phase * 4.0) * 3.8 * scale;

        ctx.save();
        ctx.translate(bx, by);
        ctx.fillStyle = '#221128';
        ctx.strokeStyle = '#221128';
        ctx.lineWidth = Math.max(1.5, 2.0 * scale);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(-11 * scale, -2.5 * scale - flap);
        ctx.quadraticCurveTo(-5 * scale, -6 * scale + flap * 0.5, 0, 0);
        ctx.quadraticCurveTo(5 * scale, -6 * scale + flap * 0.5, 11 * scale, -2.5 * scale - flap);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(0, 0, 2.4 * scale, 1.1 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 5. Airplane Wing in Foreground (Left cabin window perspective)
      ctx.save();
      ctx.translate(wobbleX, wobbleY);

      const wingTipX = w * 0.30;
      const wingTipY = h * 0.53;
      const wingletTopY = h * 0.47;
      const wingBaseY = h * 1.02;
      const wingTrailingY = h * 0.80;

      // Realistic Metallic Wing Shading
      const wingGrad = ctx.createLinearGradient(0, wingTipY, wingTipX, wingBaseY);
      wingGrad.addColorStop(0.0, '#ebd4cb'); // Warm rose reflection on tip
      wingGrad.addColorStop(0.18, '#baa8b8'); // Mid metallic
      wingGrad.addColorStop(0.5, '#786d82'); // Body shadow
      wingGrad.addColorStop(0.85, '#52495c'); // Deep underside
      wingGrad.addColorStop(1.0, '#362e40');

      // Main Wing
      ctx.beginPath();
      ctx.moveTo(-20, h * 0.60);
      ctx.lineTo(wingTipX - 12, wingTipY);
      ctx.lineTo(wingTipX, wingTipY + 7);
      ctx.lineTo(wingTipX - 35, wingTrailingY);
      ctx.lineTo(-20, wingBaseY);
      ctx.closePath();
      ctx.fillStyle = wingGrad;
      ctx.fill();

      // Wing Leading Edge Sun Glimmer
      ctx.beginPath();
      ctx.moveTo(-20, h * 0.60);
      ctx.lineTo(wingTipX - 12, wingTipY);
      ctx.strokeStyle = 'rgba(255, 240, 220, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Winglet / Sharklet (Upward curved aerofoil tip)
      const wingletGrad = ctx.createLinearGradient(wingTipX - 22, wingletTopY, wingTipX, wingTipY);
      wingletGrad.addColorStop(0.0, '#fedecd');
      wingletGrad.addColorStop(0.5, '#ba94a8');
      wingletGrad.addColorStop(1.0, '#7d5c74');

      ctx.beginPath();
      ctx.moveTo(wingTipX - 20, wingTipY + 4);
      ctx.lineTo(wingTipX - 10, wingletTopY);
      ctx.lineTo(wingTipX + 3, wingletTopY + 12);
      ctx.lineTo(wingTipX - 4, wingTipY + 6);
      ctx.closePath();
      ctx.fillStyle = wingletGrad;
      ctx.fill();

      // Red Navigation Light on Winglet Tip
      const navGlow = ctx.createRadialGradient(wingTipX - 10, wingletTopY, 0, wingTipX - 10, wingletTopY, 8);
      navGlow.addColorStop(0.0, '#ff3344');
      navGlow.addColorStop(0.5, 'rgba(255, 50, 50, 0.6)');
      navGlow.addColorStop(1.0, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = navGlow;
      ctx.beginPath();
      ctx.arc(wingTipX - 10, wingletTopY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Panel Flap Seams
      ctx.strokeStyle = 'rgba(40, 30, 50, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(w * 0.10, h * 0.67);
      ctx.lineTo(w * 0.06, h * 0.89);
      ctx.moveTo(w * 0.18, h * 0.62);
      ctx.lineTo(w * 0.14, h * 0.83);
      ctx.stroke();

      // Cabin Window Curvature Vignette
      const cabinGrad = ctx.createRadialGradient(0, h, 0, 0, h, Math.max(w * 0.20, 150));
      cabinGrad.addColorStop(0.0, 'rgba(15, 10, 20, 0.98)');
      cabinGrad.addColorStop(0.65, 'rgba(28, 18, 36, 0.55)');
      cabinGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = cabinGrad;
      ctx.beginPath();
      ctx.arc(0, h, Math.max(w * 0.20, 150), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isLooping]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* HTML5 Video Layer */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          videoLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        autoPlay
        loop
        muted
        playsInline
        onLoadedData={() => setVideoLoaded(true)}
      >
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>

      {/* Ultra High Resolution Procedural Canvas Visualizer */}
      <canvas 
        ref={canvasRef} 
        className={`w-full h-full object-cover block absolute inset-0 transition-opacity duration-700 ${
          videoLoaded ? 'opacity-90 mix-blend-screen' : 'opacity-100'
        }`}
      />
    </div>
  );
};
