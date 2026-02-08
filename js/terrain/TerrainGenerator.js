import { Config } from '../core/Config.js';
import { Utils } from '../core/Utils.js';

export class TerrainGenerator {
    static generate(width, height, theme) {
        const heightmap = TerrainGenerator.generateHeightmap(width, height);
        const imageData = new ImageData(width, height);
        const data = imageData.data;

        // Fill terrain based on heightmap
        for (let x = 0; x < width; x++) {
            const surfaceY = heightmap[x];
            for (let y = 0; y < height; y++) {
                const idx = (y * width + x) * 4;
                if (y < surfaceY) {
                    data[idx + 3] = 0;
                } else {
                    const depth = y - surfaceY;
                    const color = TerrainGenerator.getTerrainColor(theme, depth);
                    const n = TerrainGenerator._hash(x, y);
                    const noise = (n * 10 - 5) | 0;
                    data[idx] = Utils.clamp(color.r + noise, 0, 255);
                    data[idx + 1] = Utils.clamp(color.g + noise, 0, 255);
                    data[idx + 2] = Utils.clamp(color.b + noise, 0, 255);
                    data[idx + 3] = 255;
                }
            }
        }

        // Carve caverns
        TerrainGenerator.carveCaverns(imageData, width, height, heightmap);

        // Add surface edge color (bright grass/sand/snow line)
        TerrainGenerator.addSurfaceEdge(data, width, height, theme);

        // THE KEY VISUAL: thick dark border around ALL terrain edges
        TerrainGenerator.addTerrainBorder(data, width, height, theme);

        // Add grass tufts for applicable themes
        if (theme.hasTufts) {
            TerrainGenerator.addGrassTufts(data, width, height, theme);
        }

        return { imageData, heightmap };
    }

    static _hash(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return n - Math.floor(n);
    }

    static generateHeightmap(width, height, shape = null) {
        const heightmap = new Float64Array(width);

        // Pick a random shape if not specified
        if (!shape) {
            const shapes = ['hills', 'hills', 'islands', 'bridge', 'valley'];
            shape = shapes[Math.floor(Math.random() * shapes.length)];
        }

        if (shape === 'islands') {
            // Floating islands - several separate landmasses
            const numIslands = Utils.randomInt(3, 5);
            const baseHeight = height * 0.65; // Default = sky (below water)
            for (let x = 0; x < width; x++) heightmap[x] = baseHeight;

            for (let i = 0; i < numIslands; i++) {
                const islandCx = Utils.randomInt(120, width - 120);
                const islandW = Utils.randomInt(120, 300);
                const islandH = height * Utils.randomRange(0.3, 0.55);

                for (let x = islandCx - islandW / 2; x < islandCx + islandW / 2; x++) {
                    if (x < 0 || x >= width) continue;
                    const dist = Math.abs(x - islandCx) / (islandW / 2);
                    const curve = Math.pow(1 - dist * dist, 1.5);
                    const surfY = islandH + Math.sin(x * 0.03 + i * 2) * 20;
                    heightmap[Math.round(x)] = Math.min(heightmap[Math.round(x)], surfY * curve + islandH * (1 - curve));
                }
            }
        } else if (shape === 'bridge') {
            // Two land masses connected by a thin bridge
            const baseHeight = height * 0.45;
            const bridgeY = height * 0.38;
            const leftEnd = width * 0.3;
            const rightStart = width * 0.7;

            for (let x = 0; x < width; x++) {
                const amplitude = height * 0.15;
                const base = baseHeight + Math.sin(x * 0.004 + 1.5) * amplitude * 0.3;

                if (x < leftEnd || x > rightStart) {
                    // Main land masses
                    heightmap[x] = base + Math.sin(x * 0.01) * 30;
                } else {
                    // Bridge area - thin strip
                    const bridgeDist = Math.min(x - leftEnd, rightStart - x) / (rightStart - leftEnd) * 2;
                    const bridgeThick = 0.15 + Math.sin(x * 0.02) * 0.03;
                    heightmap[x] = bridgeY + Math.sin(x * 0.008) * 15;
                }
            }
        } else if (shape === 'valley') {
            // Deep V-shaped valley
            const baseHeight = height * 0.3;
            const valleyCenter = width / 2;

            for (let x = 0; x < width; x++) {
                const distFromCenter = Math.abs(x - valleyCenter) / (width / 2);
                const valleyDepth = height * 0.35 * (1 - distFromCenter * distFromCenter);
                const noise = Math.sin(x * 0.005 + 2.1) * 30 + Math.sin(x * 0.02) * 10;
                heightmap[x] = baseHeight + valleyDepth + noise;
            }
        } else {
            // Default: hills (original behavior)
            const baseHeight = height * 0.45;
            const amplitude = height * 0.2;

            const layers = [
                { freq: 0.002, amp: 0.4 },
                { freq: 0.005, amp: 0.25 },
                { freq: 0.01, amp: 0.15 },
                { freq: 0.03, amp: 0.1 },
                { freq: 0.06, amp: 0.05 },
                { freq: 0.1, amp: 0.03 },
            ];

            const phases = layers.map(() => Math.random() * Math.PI * 2);

            for (let x = 0; x < width; x++) {
                let h = 0;
                for (let i = 0; i < layers.length; i++) {
                    h += Math.sin(x * layers[i].freq + phases[i]) * layers[i].amp;
                }
                heightmap[x] = Math.round(baseHeight + h * amplitude);
            }

            TerrainGenerator.createPlatforms(heightmap, width);
        }

        for (let x = 0; x < width; x++) {
            heightmap[x] = Utils.clamp(heightmap[x], Config.TERRAIN_BORDER_TOP, Config.WATER_LEVEL - 20);
        }

        return heightmap;
    }

    static createPlatforms(heightmap, width) {
        const numPlatforms = Utils.randomInt(3, 6);
        const platformWidth = Utils.randomInt(40, 80);

        for (let i = 0; i < numPlatforms; i++) {
            const cx = Utils.randomInt(platformWidth, width - platformWidth);
            const halfW = platformWidth / 2;
            const targetH = heightmap[cx];

            for (let x = cx - halfW; x < cx + halfW; x++) {
                if (x >= 0 && x < width) {
                    const dist = Math.abs(x - cx) / halfW;
                    const blend = Utils.smoothStep(1 - dist);
                    heightmap[x] = Utils.lerp(heightmap[x], targetH, blend * 0.8);
                }
            }
        }
    }

    static carveCaverns(imageData, width, height, heightmap) {
        const data = imageData.data;
        const numCaverns = Utils.randomInt(2, 5);

        for (let i = 0; i < numCaverns; i++) {
            const cx = Utils.randomInt(100, width - 100);
            const minY = heightmap[Utils.clamp(cx, 0, width - 1)] + 40;
            const cy = Utils.randomInt(minY, Math.min(minY + 200, Config.WATER_LEVEL - 40));
            const rx = Utils.randomInt(30, 70);
            const ry = Utils.randomInt(20, 40);

            for (let y = cy - ry; y <= cy + ry; y++) {
                for (let x = cx - rx; x <= cx + rx; x++) {
                    if (x < 0 || x >= width || y < 0 || y >= height) continue;
                    const dx = (x - cx) / rx;
                    const dy = (y - cy) / ry;
                    const noise = Math.sin(x * 0.1) * 0.2 + Math.cos(y * 0.15) * 0.15;
                    if (dx * dx + dy * dy + noise < 0.8) {
                        const idx = (y * width + x) * 4;
                        data[idx] = 0;
                        data[idx + 1] = 0;
                        data[idx + 2] = 0;
                        data[idx + 3] = 0;
                    }
                }
            }
        }
    }

    static addSurfaceEdge(data, width, height, theme) {
        const edgeColor = theme.edgeColor;
        const edgeHighlight = theme.edgeHighlight;

        // Paint bright edge line on terrain surface (8px thick)
        for (let x = 0; x < width; x++) {
            let surfY = -1;
            for (let y = 0; y < height; y++) {
                if (data[(y * width + x) * 4 + 3] > 0) { surfY = y; break; }
            }
            if (surfY < 0) continue;

            for (let dy = 0; dy < 8; dy++) {
                const y = surfY + dy;
                if (y >= height) break;
                const idx = (y * width + x) * 4;
                if (data[idx + 3] === 0) continue;

                const c = dy < 2 ? edgeHighlight : edgeColor;
                const blend = dy < 3 ? 1.0 : 1.0 - (dy - 2) / 7;
                // Add slight dither noise for texture
                const noise = TerrainGenerator._hash(x, y) * 0.15 - 0.075;
                const b = Utils.clamp(blend + noise, 0, 1);
                data[idx] = Math.round(Utils.lerp(data[idx], c.r, b));
                data[idx + 1] = Math.round(Utils.lerp(data[idx + 1], c.g, b));
                data[idx + 2] = Math.round(Utils.lerp(data[idx + 2], c.b, b));
            }
        }
    }

    /**
     * THE signature visual of Worms: thick dark border around all terrain edges.
     * Scans for solid pixels near transparent pixels and darkens them.
     */
    static addTerrainBorder(data, width, height, theme) {
        const borderThickness = 3;
        const borderColor = theme.borderDark || { r: 30, g: 20, b: 10 };

        // First pass: find edge pixels (solid pixels adjacent to transparent)
        const isEdge = new Uint8Array(width * height);

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                if (data[idx + 3] === 0) continue; // Skip transparent

                // Check 8 neighbors for transparency
                let neighborTransparent = false;
                for (let dy = -1; dy <= 1 && !neighborTransparent; dy++) {
                    for (let dx = -1; dx <= 1 && !neighborTransparent; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const ni = ((y + dy) * width + (x + dx)) * 4;
                        if (data[ni + 3] === 0) {
                            neighborTransparent = true;
                        }
                    }
                }

                if (neighborTransparent) {
                    isEdge[y * width + x] = 1;
                }
            }
        }

        // Second pass: for each edge pixel, darken pixels within borderThickness
        // Use distance-based darkening for smooth border
        const borderMask = new Float32Array(width * height);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (isEdge[y * width + x] !== 1) continue;

                for (let dy = -borderThickness; dy <= borderThickness; dy++) {
                    for (let dx = -borderThickness; dx <= borderThickness; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist > borderThickness) continue;

                        const ni = (ny * width + nx) * 4;
                        if (data[ni + 3] === 0) continue; // Don't paint on transparent

                        const strength = 1.0 - (dist / borderThickness);
                        const current = borderMask[ny * width + nx];
                        borderMask[ny * width + nx] = Math.max(current, strength);
                    }
                }
            }
        }

        // Apply border darkening
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const strength = borderMask[y * width + x];
                if (strength <= 0) continue;

                const idx = (y * width + x) * 4;
                const blend = strength * 0.7; // Max 70% darkening at edge

                data[idx] = Math.round(Utils.lerp(data[idx], borderColor.r, blend));
                data[idx + 1] = Math.round(Utils.lerp(data[idx + 1], borderColor.g, blend));
                data[idx + 2] = Math.round(Utils.lerp(data[idx + 2], borderColor.b, blend));
            }
        }
    }

    static addGrassTufts(data, width, height, theme) {
        const tc = theme.edgeColor;
        for (let x = 3; x < width - 3; x += Utils.randomInt(3, 7)) {
            let surfY = -1;
            for (let y = 0; y < height; y++) {
                if (data[(y * width + x) * 4 + 3] > 0) { surfY = y; break; }
            }
            if (surfY < 3) continue;

            // Only on flat-ish surfaces
            let leftY = -1, rightY = -1;
            for (let y = 0; y < height; y++) {
                if (data[(y * width + (x - 3)) * 4 + 3] > 0) { leftY = y; break; }
            }
            for (let y = 0; y < height; y++) {
                if (data[(y * width + (x + 3)) * 4 + 3] > 0) { rightY = y; break; }
            }
            if (leftY < 0 || rightY < 0 || Math.abs(leftY - rightY) > 5) continue;

            const tuftH = Utils.randomInt(5, 9);
            for (let dy = 1; dy <= tuftH; dy++) {
                const py = surfY - dy;
                if (py < 0) break;
                const idx = (py * width + x) * 4;
                const alpha = (1.0 - dy / tuftH);
                data[idx] = tc.r;
                data[idx + 1] = tc.g;
                data[idx + 2] = tc.b;
                data[idx + 3] = Math.round(220 * alpha);
            }
        }
    }

    static getTerrainColor(theme, depth) {
        const colors = theme.terrainColors;
        for (let i = 0; i < colors.length - 1; i++) {
            if (depth >= colors[i].depth && depth < colors[i + 1].depth) {
                const t = (depth - colors[i].depth) / (colors[i + 1].depth - colors[i].depth);
                return {
                    r: Utils.lerp(colors[i].color.r, colors[i + 1].color.r, t),
                    g: Utils.lerp(colors[i].color.g, colors[i + 1].color.g, t),
                    b: Utils.lerp(colors[i].color.b, colors[i + 1].color.b, t),
                };
            }
        }
        return colors[colors.length - 1].color;
    }
}
