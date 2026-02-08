import { Config } from '../core/Config.js';
import { Utils } from '../core/Utils.js';
import { TerrainGenerator } from './TerrainGenerator.js';
import { TerrainThemes } from './TerrainTheme.js';

export class TerrainManager {
    constructor() {
        this.width = Config.WORLD_WIDTH;
        this.height = Config.WORLD_HEIGHT;
        this.imageData = null;
        this.data = null;
        this.heightmap = null;
        this.theme = null;
        this.dirty = true;
        this.canvas = null;
        this.ctx = null;
    }

    generate(themeName = 'Grassland') {
        this.theme = TerrainThemes[themeName] || TerrainThemes.Grassland;
        const result = TerrainGenerator.generate(this.width, this.height, this.theme);
        this.imageData = result.imageData;
        this.data = this.imageData.data;
        this.heightmap = result.heightmap;

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx = this.canvas.getContext('2d');
        this.updateCanvas();

        this.dirty = false;
    }

    updateCanvas() {
        this.ctx.putImageData(this.imageData, 0, 0);
    }

    isSolid(x, y) {
        x = Math.round(x);
        y = Math.round(y);
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            if (y < 0) return false;
            return true;
        }
        const idx = (y * this.width + x) * 4;
        return this.data[idx + 3] > 0;
    }

    getAlpha(x, y) {
        x = Math.round(x);
        y = Math.round(y);
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 0;
        const idx = (y * this.width + x) * 4;
        return this.data[idx + 3];
    }

    carveCircle(cx, cy, radius) {
        cx = Math.round(cx);
        cy = Math.round(cy);
        const r = Math.round(radius);
        const rSq = r * r;

        // Carve the hole
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (dx * dx + dy * dy <= rSq) {
                    const x = cx + dx;
                    const y = cy + dy;
                    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                        const idx = (y * this.width + x) * 4;
                        this.data[idx] = 0;
                        this.data[idx + 1] = 0;
                        this.data[idx + 2] = 0;
                        this.data[idx + 3] = 0;
                    }
                }
            }
        }

        // Re-apply dark border around the new crater edge
        const borderThickness = 3;
        const borderColor = this.theme.borderDark || { r: 30, g: 20, b: 10 };
        const scanR = r + borderThickness + 2;

        for (let dy = -scanR; dy <= scanR; dy++) {
            for (let dx = -scanR; dx <= scanR; dx++) {
                const x = cx + dx;
                const y = cy + dy;
                if (x < 1 || x >= this.width - 1 || y < 1 || y >= this.height - 1) continue;

                const idx = (y * this.width + x) * 4;
                if (this.data[idx + 3] === 0) continue; // Skip transparent

                // Check if this solid pixel is near an edge
                let minDist = borderThickness + 1;
                for (let ey = -borderThickness; ey <= borderThickness && minDist > 0; ey++) {
                    for (let ex = -borderThickness; ex <= borderThickness; ex++) {
                        const nx = x + ex;
                        const ny = y + ey;
                        if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;
                        if (this.data[(ny * this.width + nx) * 4 + 3] === 0) {
                            const dist = Math.sqrt(ex * ex + ey * ey);
                            minDist = Math.min(minDist, dist);
                        }
                    }
                }

                if (minDist <= borderThickness) {
                    const strength = (1.0 - minDist / borderThickness) * 0.65;
                    this.data[idx] = Math.round(Utils.lerp(this.data[idx], borderColor.r, strength));
                    this.data[idx + 1] = Math.round(Utils.lerp(this.data[idx + 1], borderColor.g, strength));
                    this.data[idx + 2] = Math.round(Utils.lerp(this.data[idx + 2], borderColor.b, strength));
                }
            }
        }

        // Re-apply bright surface edge color around crater edges
        const edgeColor = this.theme.edgeColor;
        const edgeHighlight = this.theme.edgeHighlight;
        const edgeThickness = 6;

        for (let dx = -scanR; dx <= scanR; dx++) {
            const x = cx + dx;
            if (x < 0 || x >= this.width) continue;

            // Find topmost solid pixel in this column within the scan range
            let surfY = -1;
            const yStart = Math.max(0, cy - scanR);
            const yEnd = Math.min(this.height - 1, cy + scanR);
            for (let y = yStart; y <= yEnd; y++) {
                if (this.data[(y * this.width + x) * 4 + 3] > 0) {
                    // Check if pixel above is transparent (this is a surface)
                    if (y === 0 || this.data[((y - 1) * this.width + x) * 4 + 3] === 0) {
                        surfY = y;
                        break;
                    }
                }
            }
            if (surfY < 0) continue;

            for (let dy = 0; dy < edgeThickness; dy++) {
                const y = surfY + dy;
                if (y >= this.height) break;
                const idx = (y * this.width + x) * 4;
                if (this.data[idx + 3] === 0) continue;

                const c = dy < 2 ? edgeHighlight : edgeColor;
                const blend = dy < 2 ? 0.8 : (1.0 - dy / edgeThickness) * 0.7;
                this.data[idx] = Math.round(Utils.lerp(this.data[idx], c.r, blend));
                this.data[idx + 1] = Math.round(Utils.lerp(this.data[idx + 1], c.g, blend));
                this.data[idx + 2] = Math.round(Utils.lerp(this.data[idx + 2], c.b, blend));
            }
        }

        this.dirty = true;
    }

    getSurfaceY(x) {
        x = Math.round(x);
        if (x < 0 || x >= this.width) return this.height;
        for (let y = 0; y < this.height; y++) {
            if (this.isSolid(x, y)) return y;
        }
        return this.height;
    }

    getSurfaceNormal(x, y) {
        const sampleDist = 3;
        let nx = 0;
        let ny = 0;

        for (let dx = -sampleDist; dx <= sampleDist; dx++) {
            for (let dy = -sampleDist; dy <= sampleDist; dy++) {
                if (dx === 0 && dy === 0) continue;
                if (this.isSolid(x + dx, y + dy)) {
                    const len = Math.sqrt(dx * dx + dy * dy);
                    nx -= dx / len;
                    ny -= dy / len;
                }
            }
        }

        const len = Math.sqrt(nx * nx + ny * ny);
        if (len === 0) return { x: 0, y: -1 };
        return { x: nx / len, y: ny / len };
    }

    findSurface(x) {
        for (let y = 0; y < this.height; y++) {
            if (this.isSolid(x, y)) return y;
        }
        return this.height;
    }

    addTerrain(cx, cy, radius, color) {
        const r = Math.round(radius);
        const rSq = r * r;

        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (dx * dx + dy * dy <= rSq) {
                    const x = Math.round(cx) + dx;
                    const y = Math.round(cy) + dy;
                    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                        const idx = (y * this.width + x) * 4;
                        this.data[idx] = color.r;
                        this.data[idx + 1] = color.g;
                        this.data[idx + 2] = color.b;
                        this.data[idx + 3] = 255;
                    }
                }
            }
        }

        this.dirty = true;
    }

    addRect(x, y, w, h, color) {
        for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
                const px = Math.round(x) + dx;
                const py = Math.round(y) + dy;
                if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
                    const idx = (py * this.width + px) * 4;
                    this.data[idx] = color.r;
                    this.data[idx + 1] = color.g;
                    this.data[idx + 2] = color.b;
                    this.data[idx + 3] = 255;
                }
            }
        }
        this.dirty = true;
    }

    render(targetCtx, camera) {
        if (this.dirty) {
            this.updateCanvas();
            this.dirty = false;
        }

        const { x, y, viewWidth, viewHeight, zoom } = camera.getView();
        const sx = Math.max(0, Math.floor(x));
        const sy = Math.max(0, Math.floor(y));
        const sw = Math.min(this.width - sx, Math.ceil(viewWidth));
        const sh = Math.min(this.height - sy, Math.ceil(viewHeight));

        if (sw > 0 && sh > 0) {
            targetCtx.drawImage(
                this.canvas,
                sx, sy, sw, sh,
                (sx - x) * zoom, (sy - y) * zoom,
                sw * zoom, sh * zoom
            );
        }
    }
}
