/* =========================================
   LevelManager.js — Level Yöneticisi
   Timing bar mekaniği + level verileri
   ========================================= */

class LevelManager {
    constructor() {
        this.levels = this._createLevels();
        this.currentLevelIndex = -1;
        this.currentLevel = null;

        // Oyun içi
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.lives = 3;
        this.timer = 0;
        this.usedRevive = false; // Level başına 1 revive hakkı

        // Timing bar
        this.barPosition = 0;
        this.barSpeed = 1;
        this.barDirection = 1;
        this.targetZoneStart = 0;
        this.targetZoneEnd = 0;

        // Hit feedback
        this.lastHitResult = null;
        this.hitAnimTimer = 0;

        // Durum
        this.levelComplete = false;
        this.levelFailed = false;

        // Parçacıklar (basit)
        this.particles = [];

        this._loadProgress();
    }

    _createLevels() {
        return [
            { id: 1, name: 'LOG_TEMIZLE', desc: 'Saldırganın log dosyalarını sil', difficulty: 1, barSpeed: 0.7, targetSize: 0.22, requiredHits: 8, maxTime: 25, unlocked: true, completed: false, bestScore: 0, lockpickDiff: 1 },
            { id: 2, name: 'PORT_KAPAT', desc: 'Açık bırakılan arka kapıları kapat', difficulty: 2, barSpeed: 0.9, targetSize: 0.18, requiredHits: 10, maxTime: 28, unlocked: false, completed: false, bestScore: 0, lockpickDiff: 2 },
            { id: 3, name: 'MALWARE_SIL', desc: 'Zararlı yazılımları tespit et ve sil', difficulty: 3, barSpeed: 1.1, targetSize: 0.15, requiredHits: 12, maxTime: 30, unlocked: false, completed: false, bestScore: 0, lockpickDiff: 3 },
            { id: 4, name: 'SIFRE_YENİLE', desc: 'Ele geçirilen şifreleri sıfırla', difficulty: 4, barSpeed: 1.4, targetSize: 0.12, requiredHits: 14, maxTime: 35, unlocked: false, completed: false, bestScore: 0, lockpickDiff: 4 },
            { id: 5, name: 'FIREWALL', desc: 'Güvenlik duvarını yeniden kur', difficulty: 5, barSpeed: 1.7, targetSize: 0.10, requiredHits: 16, maxTime: 40, unlocked: false, completed: false, bestScore: 0, lockpickDiff: 5 },
            { id: 6, name: 'KORSAN_KES', desc: 'Saldırganın bağlantısını tamamen kes', difficulty: 6, barSpeed: 2.1, targetSize: 0.08, requiredHits: 18, maxTime: 45, unlocked: false, completed: false, bestScore: 0, lockpickDiff: 6 }
        ];
    }

    startLevel(index) {
        if (index < 0 || index >= this.levels.length) return false;
        const level = this.levels[index];
        if (!level.unlocked) return false;

        this.currentLevelIndex = index;
        this.currentLevel = level;

        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.lives = 3;
        this.hitCount = 0;
        this.barPosition = 0;
        this.barSpeed = level.barSpeed;
        this.barDirection = 1;
        this.levelComplete = false;
        this.levelFailed = false;
        this.lastHitResult = null;
        this.hitAnimTimer = 0;
        this.particles = [];
        this.timer = level.maxTime;
        this.usedRevive = false;

        this._generateTargetZone();
        return true;
    }

    update(dt) {
        if (!this.currentLevel || this.levelComplete || this.levelFailed) return;

        // Timer
        this.timer -= dt;
        if (this.timer <= 0) {
            this.timer = 0;
            this._checkEnd();
            return;
        }

        // Bar hareketi (ping-pong)
        this.barPosition += this.barSpeed * this.barDirection * dt;
        if (this.barPosition >= 1) { this.barPosition = 1; this.barDirection = -1; }
        else if (this.barPosition <= 0) { this.barPosition = 0; this.barDirection = 1; }

        // Hit anim
        if (this.lastHitResult) {
            this.hitAnimTimer -= dt;
            if (this.hitAnimTimer <= 0) this.lastHitResult = null;
        }

        // Parçacıklar
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 150 * dt;
            p.life -= p.decay * dt;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    hit() {
        if (!this.currentLevel || this.levelComplete || this.levelFailed) return;

        const pos = this.barPosition;
        const inZone = pos >= this.targetZoneStart && pos <= this.targetZoneEnd;

        if (inZone) {
            const center = (this.targetZoneStart + this.targetZoneEnd) / 2;
            const dist = Math.abs(pos - center) / ((this.targetZoneEnd - this.targetZoneStart) / 2);

            if (dist < 0.35) {
                this.combo++;
                this.score += 100 * this.combo;
                this.lastHitResult = 'perfect';
                this._spawnParticles(pos, '#22c55e', 8);
            } else {
                this.combo++;
                this.score += 50 * this.combo;
                this.lastHitResult = 'good';
                this._spawnParticles(pos, '#3b82f6', 5);
            }
            this.hitCount++;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        } else {
            this.combo = 0;
            this.lives--;
            this.lastHitResult = 'miss';
            this._spawnParticles(pos, '#ef4444', 6);

            if (this.lives <= 0) {
                this.levelFailed = true;
                return;
            }
        }

        this.hitAnimTimer = 0.5;
        this._generateTargetZone();
        this.barSpeed = Math.min(this.barSpeed + 0.015, 3.5);
        this._checkEnd();
    }

    _checkEnd() {
        if (this.hitCount >= this.currentLevel.requiredHits) {
            this.levelComplete = true;
            this._onComplete();
        } else if (this.timer <= 0 && !this.levelComplete) {
            this.levelFailed = true;
        }
    }

    _onComplete() {
        const l = this.currentLevel;
        if (this.score > l.bestScore) l.bestScore = this.score;
        l.completed = true;
        const next = this.currentLevelIndex + 1;
        if (next < this.levels.length) this.levels[next].unlocked = true;
        this._saveProgress();
    }

    _generateTargetZone() {
        const size = this.currentLevel.targetSize;
        const start = Utils.randFloat(0.05, 0.95 - size);
        this.targetZoneStart = start;
        this.targetZoneEnd = start + size;
    }

    _spawnParticles(barPos, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                barPos, color,
                x: 0, y: 0,
                vx: Utils.randFloat(-60, 60),
                vy: Utils.randFloat(-100, -20),
                life: 1,
                decay: Utils.randFloat(1.5, 3),
                size: Utils.randFloat(2, 4)
            });
        }
    }

    // ── Render ──

    render(ctx, W, H) {
        if (!this.currentLevel) return;

        const barY = H * 0.55;
        const barX = W * 0.12;
        const barW = W * 0.76;
        const barH = 12;

        // Bar arkaplan
        ctx.save();
        ctx.fillStyle = 'rgba(30,41,59,0.6)';
        Utils.roundRect(ctx, barX, barY - barH / 2, barW, barH, 6);
        ctx.fill();

        // Hedef bölge
        const zoneX = barX + this.targetZoneStart * barW;
        const zoneW = (this.targetZoneEnd - this.targetZoneStart) * barW;
        ctx.fillStyle = 'rgba(34,197,94,0.2)';
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.5;
        Utils.roundRect(ctx, zoneX, barY - barH / 2 - 4, zoneW, barH + 8, 4);
        ctx.fill();
        ctx.stroke();

        // Gösterge (hareket eden çizgi)
        const ix = barX + this.barPosition * barW;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(ix, barY - barH - 2);
        ctx.lineTo(ix, barY + barH + 2);
        ctx.stroke();

        // Gösterge uç üçgen
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(ix, barY - barH - 2);
        ctx.lineTo(ix - 5, barY - barH - 10);
        ctx.lineTo(ix + 5, barY - barH - 10);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Hit sonuç yazısı
        if (this.lastHitResult) {
            const labels = {
                perfect: { text: 'PERFECT', color: '#22c55e' },
                good: { text: 'GOOD', color: '#3b82f6' },
                miss: { text: 'MISS', color: '#ef4444' }
            };
            const r = labels[this.lastHitResult];
            const alpha = Utils.clamp(this.hitAnimTimer / 0.5, 0, 1);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = r.color;
            ctx.font = '700 26px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText(r.text, W / 2, barY - 45);
            ctx.restore();
        }

        // Parçacıklar
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(barX + p.barPos * barW + p.x, barY + p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Level bilgileri
        this._renderInfo(ctx, W, H);
    }

    _renderInfo(ctx, W, H) {
        ctx.save();

        // Level adı
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '600 16px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(this.currentLevel.name, W / 2, 75);

        // Açıklama
        ctx.fillStyle = '#64748b';
        ctx.font = '400 14px Rajdhani';
        ctx.fillText(this.currentLevel.desc, W / 2, 95);

        // İlerleme
        ctx.fillText(`Hit: ${this.hitCount}/${this.currentLevel.requiredHits}`, W / 2, 115);

        // Süre
        const timeColor = this.timer < 10 ? '#ef4444' : '#64748b';
        ctx.fillStyle = timeColor;
        ctx.font = '500 14px Rajdhani';
        ctx.textAlign = 'right';
        ctx.fillText(`Süre: ${Utils.formatTime(this.timer)}`, W - 16, 75);

        // Canlar
        ctx.textAlign = 'right';
        ctx.font = '18px sans-serif';
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = i < this.lives ? '#ef4444' : 'rgba(239,68,68,0.2)';
            ctx.fillText('♥', W - 16 - i * 24, 100);
        }

        ctx.restore();
    }

    // ── Persistence ──

    _saveProgress() {
        try {
            const data = this.levels.map(l => ({ id: l.id, unlocked: l.unlocked, completed: l.completed, bestScore: l.bestScore }));
            localStorage.setItem('sb_progress', JSON.stringify(data));
        } catch (e) {}
    }

    _loadProgress() {
        try {
            const data = JSON.parse(localStorage.getItem('sb_progress'));
            if (!data) return;
            for (const s of data) {
                const l = this.levels.find(x => x.id === s.id);
                if (l) { l.unlocked = s.unlocked; l.completed = s.completed; l.bestScore = s.bestScore; }
            }
        } catch (e) {}
    }
}
