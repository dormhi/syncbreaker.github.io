/* =========================================
   main.js — Entry Point + Game Loop
   ========================================= */

(function() {
    'use strict';

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const GAME_WIDTH = 960;
    const GAME_HEIGHT = 640;

    function resizeCanvas() {
        const wW = window.innerWidth;
        const wH = window.innerHeight;
        const aspect = GAME_WIDTH / GAME_HEIGHT;
        const wAspect = wW / wH;

        let dW, dH;
        if (wAspect > aspect) {
            dH = wH;
            dW = dH * aspect;
        } else {
            dW = wW;
            dH = dW / aspect;
        }

        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        canvas.style.width = dW + 'px';
        canvas.style.height = dH + 'px';
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const game = new GameManager(canvas, ctx);

    let lastTime = 0;
    const MAX_DT = 1 / 30;

    function gameLoop(timestamp) {
        const dt = Math.min((timestamp - lastTime) / 1000, MAX_DT);
        lastTime = timestamp;

        game.update(dt);
        game.render(ctx);

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame((ts) => {
        lastTime = ts;
        requestAnimationFrame(gameLoop);
    });
})();
