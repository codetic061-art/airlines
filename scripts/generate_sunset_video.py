#!/usr/bin/env python3
import math
import subprocess
import sys

width = 1280
height = 720
fps = 30
duration = 6 # 6 second seamless loop
total_frames = fps * duration

# FFmpeg subprocess to encode directly to high quality H.264 MP4
cmd = [
    'ffmpeg', '-y',
    '-f', 'rawvideo',
    '-vcodec', 'rawvideo',
    '-s', f'{width}x{height}',
    '-pix_fmt', 'rgb24',
    '-r', str(fps),
    '-i', '-',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    'public/sunset-clouds.mp4'
]

process = subprocess.Popen(cmd, stdin=subprocess.PIPE)

# Pre-generate cloud noise grid for fast rendering
def lerp(a, b, t):
    return a + (b - a) * t

def clamp(v, min_v=0, max_v=255):
    return max(min_v, min(max_v, int(v)))

sun_x = int(width * 0.78)
sun_y = int(height * 0.48)

# Birds flock positions
birds = [
    {'x': 0.65, 'y': 0.44, 'scale': 1.0, 'speed': 0.05, 'offset': 0},
    {'x': 0.68, 'y': 0.43, 'scale': 0.85, 'speed': 0.05, 'offset': 0.2},
    {'x': 0.71, 'y': 0.42, 'scale': 0.75, 'speed': 0.05, 'offset': 0.5},
    {'x': 0.64, 'y': 0.46, 'scale': 0.7, 'speed': 0.05, 'offset': 0.8},
    {'x': 0.73, 'y': 0.41, 'scale': 0.6, 'speed': 0.05, 'offset': 1.1},
    {'x': 0.75, 'y': 0.40, 'scale': 0.5, 'speed': 0.05, 'offset': 1.4},
    {'x': 0.62, 'y': 0.47, 'scale': 0.65, 'speed': 0.05, 'offset': 0.4},
]

for frame_idx in range(total_frames):
    t_loop = frame_idx / total_frames
    time_sec = frame_idx / fps
    frame_bytes = bytearray(width * height * 3)

    cloud_drift = t_loop * 2.0 * math.pi

    for y in range(height):
        ny = y / height
        # Sky gradient from deep blue (top) -> pink/magenta (mid-high) -> vibrant orange/gold (horizon) -> purple/pink cloud bed
        if ny < 0.48:
            # Upper sky
            st = ny / 0.48
            if st < 0.4:
                # Deep royal blue to rich purple
                sub_t = st / 0.4
                r = lerp(26, 95, sub_t)
                g = lerp(45, 60, sub_t)
                b = lerp(110, 165, sub_t)
            elif st < 0.75:
                # Purple to bright magenta/pink
                sub_t = (st - 0.4) / 0.35
                r = lerp(95, 235, sub_t)
                g = lerp(60, 85, sub_t)
                b = lerp(165, 140, sub_t)
            else:
                # Magenta to fiery orange/gold
                sub_t = (st - 0.75) / 0.25
                r = lerp(235, 255, sub_t)
                g = lerp(85, 160, sub_t)
                b = lerp(140, 60, sub_t)
        else:
            # Lower cloud region
            ct = (ny - 0.48) / 0.52
            # Golden horizon rim -> violet-pink under-cloud sea
            r = lerp(245, 130, ct)
            g = lerp(145, 75, ct)
            b = lerp(90, 145, ct)

        row_offset = y * width * 3

        for x in range(width):
            nx = x / width

            # Radial distance to sun
            dx = (x - sun_x) / (width * 0.5)
            dy = (y - sun_y) / (height * 0.5)
            dist_sq = dx * dx + dy * dy * 1.6
            sun_glow = math.exp(-dist_sq * 4.5) * 1.2
            sun_core = math.exp(-dist_sq * 55.0)

            # Cloud texture modulation (procedural wave sines)
            if ny >= 0.45:
                wave1 = math.sin(nx * 14.0 + cloud_drift + ny * 6.0) * 0.5 + 0.5
                wave2 = math.sin(nx * 28.0 - cloud_drift * 0.5 + ny * 12.0) * 0.5 + 0.5
                wave3 = math.sin(nx * 52.0 + cloud_drift * 1.5 + ny * 20.0) * 0.5 + 0.5
                cloud_density = (wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2)
                
                # Cloud highlight based on proximity to sun
                cloud_highlight = (1.0 - min(1.0, math.sqrt(dist_sq))) * 0.6

                cr = r + cloud_density * 45 + cloud_highlight * 60
                cg = g + cloud_density * 25 + cloud_highlight * 40
                cb = b + cloud_density * 50 - cloud_highlight * 20
            else:
                # Sky subtle banding reduction & atmospheric haze
                cr = r
                cg = g
                cb = b

            # Apply Sun Glow and Core
            cr = cr + sun_glow * 140 + sun_core * 255
            cg = cg + sun_glow * 105 + sun_core * 245
            cb = cb + sun_glow * 45 + sun_core * 220

            # Airplane Wing in the left / bottom-left
            # Approximate wing polygon: leading edge from (0, 0.58) to (0.35, 0.55), trailing edge to (0.28, 0.78), base (0, 0.95)
            # Wing geometry check
            is_wing = False
            wing_shade = 0.0

            # Wing tip / main wing surface
            wing_top_y = 0.55 + (0.32 - nx) * 0.18 if nx <= 0.34 else 999
            wing_bot_y = 0.76 + (0.32 - nx) * 0.45 if nx <= 0.34 else 999
            
            # Winglet / vertical wingtip
            winglet_top = 0.50 + (nx - 0.28) * 0.6 if 0.28 <= nx <= 0.34 else 999

            if nx <= 0.33 and ny >= wing_top_y and ny <= wing_bot_y:
                is_wing = True
                # Metallic gradient on wing (reflects sky pink/gold on top, metallic gray on body)
                wing_depth = (ny - wing_top_y) / max(0.01, (wing_bot_y - wing_top_y))
                # Wing panel lines & reflections
                panel = 1.0 - 0.12 * math.sin(nx * 40.0)
                cr = (180 * (1.0 - wing_depth * 0.4) + 60 * sun_glow) * panel
                cg = (185 * (1.0 - wing_depth * 0.4) + 40 * sun_glow) * panel
                cb = (200 * (1.0 - wing_depth * 0.3) + 20 * sun_glow) * panel

            elif 0.28 <= nx <= 0.34 and ny >= winglet_top and ny <= wing_top_y + 0.05:
                # Winglet tip
                is_wing = True
                cr = 200 + 40 * sun_glow
                cg = 205 + 30 * sun_glow
                cb = 215 + 10 * sun_glow

            # Wing window frame curved border on very bottom-left
            if nx <= 0.08 and ny >= 0.82:
                corner_d = math.sqrt((nx/0.08)**2 + ((1.0-ny)/0.18)**2)
                if corner_d < 0.6:
                    cr = cr * 0.25
                    cg = cg * 0.25
                    cb = cb * 0.3

            pixel_idx = row_offset + x * 3
            frame_bytes[pixel_idx] = clamp(cr)
            frame_bytes[pixel_idx + 1] = clamp(cg)
            frame_bytes[pixel_idx + 2] = clamp(cb)

    # Draw soaring birds
    for bird in birds:
        # Loop bird motion from left to right towards the sun
        bx_norm = (bird['x'] + (t_loop * bird['speed'] * 3.0)) % 0.3 + 0.58
        by_norm = bird['y'] + math.sin(t_loop * 2.0 * math.pi * 2.0 + bird['offset']) * 0.012

        bx = int(bx_norm * width)
        by = int(by_norm * height)
        b_scale = bird['scale']

        # Wing flap oscillation
        flap = math.sin(time_sec * 8.0 + bird['offset'] * 4.0) * 2.5 * b_scale

        for b_dx in range(int(-4 * b_scale), int(5 * b_scale)):
            b_dy = int(-abs(b_dx) * 0.6 + (flap if b_dx != 0 else 0))
            px = bx + b_dx
            py = by + b_dy
            if 0 <= px < width and 0 <= py < height:
                p_idx = (py * width + px) * 3
                frame_bytes[p_idx] = 40
                frame_bytes[p_idx + 1] = 25
                frame_bytes[p_idx + 2] = 45

    process.stdin.write(frame_bytes)

process.stdin.close()
process.wait()
print("Sunset flight loop generated successfully!")
