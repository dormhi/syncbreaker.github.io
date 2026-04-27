/* =========================================
   UIManager.js — UI Çizim Yardımcısı
   Basit, beta görünüm
   ========================================= */

class UIManager {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.buttons = [];
        this.mouseX = 0;
        this.mouseY = 0;
    }

    // ── Buton sistemi ──

    addButton(id, label, x, y, w, h, onClick, style = {}) {
        this.buttons.push({
            id, label, x, y, w, h, onClick,
            color: style.color || '#3b82f6',
            disabled: style.disabled || false,
            subtitle: style.subtitle || null
        });
    }

    clearButtons() {
        this.buttons = [];
    }

    updateMouse(x, y) {
        this.mouseX = x;
        this.mouseY = y;
    }

    handleClick(x, y) {
        for (const btn of this.buttons) {
            if (btn.disabled) continue;
            const inX = x >= btn.x - btn.w / 2 && x <= btn.x + btn.w / 2;
            const inY = y >= btn.y - btn.h / 2 && y <= btn.y + btn.h / 2;
            if (inX && inY) {
                btn.onClick();
                return true;
            }
        }
        return false;
    }

    isHovered(btn) {
        const inX = this.mouseX >= btn.x - btn.w / 2 && this.mouseX <= btn.x + btn.w / 2;
        const inY = this.mouseY >= btn.y - btn.h / 2 && this.mouseY <= btn.y + btn.h / 2;
        return inX && inY;
    }

    // ── Render ──

    renderButtons() {
        const ctx = this.ctx;
        for (const btn of this.buttons) {
            const hovered = !btn.disabled && this.isHovered(btn);
            const alpha = btn.disabled ? 0.3 : 1;

            ctx.save();
            ctx.globalAlpha = alpha;

            // Arka plan — CG: Shape rendering
            const bgAlpha = hovered ? 0.2 : 0.08;
            ctx.fillStyle = btn.disabled ? 'rgba(100,100,100,0.1)' : `rgba(59,130,246,${bgAlpha})`;
            ctx.strokeStyle = btn.color;
            ctx.lineWidth = hovered ? 2 : 1;
            Utils.roundRect(ctx, btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, 6);
            ctx.fill();
            ctx.stroke();

            // Label
            const hasSubtitle = btn.subtitle && btn.h >= 50;
            ctx.fillStyle = btn.color;
            ctx.font = '600 16px Rajdhani';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(btn.label, btn.x, hasSubtitle ? btn.y - 7 : btn.y + 1);

            // Subtitle (varsa)
            if (hasSubtitle) {
                ctx.fillStyle = '#64748b';
                ctx.font = '400 11px Rajdhani';
                ctx.fillText(btn.subtitle, btn.x, btn.y + 14);
            }

            ctx.restore();
        }
    }

    renderEnergyBar(energy) {
        const ctx = this.ctx;
        const W = this.canvas.width;
        const x = W - 170;
        const y = 12;
        const cellW = 22;
        const cellH = 14;
        const gap = 3;

        ctx.save();

        // Label
        ctx.fillStyle = '#64748b';
        ctx.font = '500 12px Rajdhani';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('ENERJİ', x - 8, y + cellH / 2);

        // Hücreler
        for (let i = 0; i < energy.max; i++) {
            const cx = x + i * (cellW + gap);
            const filled = i < energy.current;

            ctx.fillStyle = filled ? '#3b82f6' : 'rgba(59,130,246,0.15)';
            ctx.strokeStyle = filled ? '#3b82f6' : '#1e293b';
            ctx.lineWidth = 1;
            Utils.roundRect(ctx, cx, y, cellW, cellH, 3);
            ctx.fill();
            ctx.stroke();
        }

        // Timer
        if (energy.current < energy.max) {
            const timeStr = Utils.formatTime(energy.nextRegenIn);
            ctx.fillStyle = '#64748b';
            ctx.font = '400 11px Rajdhani';
            ctx.textAlign = 'center';
            ctx.fillText(`+1 ${timeStr}`, x + (energy.max * (cellW + gap)) / 2, y + cellH + 14);
        }

        ctx.restore();
    }

    renderScore(score, combo) {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '700 24px Orbitron';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(score.toString().padStart(6, '0'), 16, 14);

        if (combo > 1) {
            ctx.fillStyle = '#f59e0b';
            ctx.font = '600 18px Orbitron';
            ctx.fillText(`x${combo}`, 16, 46);
        }
        ctx.restore();
    }
}
