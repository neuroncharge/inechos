/* ==========================================================================
   INECHOS — Solo Pong (Wall Pong) Offline Mini-Game
   Isolated IIFE · Zero external dependencies · Pure HTML5 Canvas & Vanilla JS
   ========================================================================== */

/* global module */
(function () {
  'use strict';

  var STORAGE_KEY = 'wp_game_solo_pong_high_score';
  var LOGICAL_WIDTH = 440;
  var LOGICAL_HEIGHT = 520;
  var PADDLE_WIDTH = 88;
  var PADDLE_HEIGHT = 8;
  var PADDLE_Y = LOGICAL_HEIGHT - 34;
  var PADDLE_SPEED = 490;
  var BALL_RADIUS = 6;
  var INITIAL_SPEED = 250;
  var MAX_SPEED = 700;
  var SPEED_STEP = 1.05;
  var MAX_BOUNCE_RAD = (62 * Math.PI) / 180;

  /**
   * Clamps a numeric value between min and max.
   *
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  function clamp(value, min, max) {
    if (value < min) {
      return min;
    }
    if (value > max) {
      return max;
    }
    return value;
  }

  /**
   * Clamps paddle horizontal position strictly within canvas boundaries.
   *
   * @param {number} x
   * @param {number} paddleWidth
   * @param {number} canvasWidth
   * @returns {number}
   */
  function clampPaddleX(x, paddleWidth, canvasWidth) {
    return clamp(x, 0, Math.max(0, canvasWidth - paddleWidth));
  }

  /**
   * Computes rebound velocity (vx, vy, speed) based on where the ball hits the paddle.
   * Center hits rebound near-vertically; edge hits rebound at sharper diagonal angles.
   *
   * @param {{ ballX: number, paddleX: number, paddleWidth: number, speed: number, speedStep?: number, maxSpeed?: number }} params
   * @returns {{ vx: number, vy: number, speed: number, hitOffset: number }}
   */
  function computePaddleRebound(params) {
    var paddleCenter = params.paddleX + params.paddleWidth / 2;
    var halfWidth = params.paddleWidth / 2 || 1;
    var hitOffset = clamp((params.ballX - paddleCenter) / halfWidth, -1, 1);
    var step = typeof params.speedStep === 'number' ? params.speedStep : SPEED_STEP;
    var cap = typeof params.maxSpeed === 'number' ? params.maxSpeed : MAX_SPEED;
    var nextSpeed = Math.min(cap, params.speed * step);
    var angle = hitOffset * MAX_BOUNCE_RAD;

    return {
      vx: nextSpeed * Math.sin(angle),
      vy: -Math.abs(nextSpeed * Math.cos(angle)),
      speed: nextSpeed,
      hitOffset: hitOffset
    };
  }

  /**
   * Advances a single physics step for the Solo Pong ball and resolves wall/paddle collisions.
   *
   * @param {{
   *   x: number, y: number, vx: number, vy: number, speed: number,
   *   radius: number, width: number, height: number,
   *   paddleX: number, paddleY: number, paddleWidth: number, paddleHeight: number
   * }} state
   * @param {number} dt
   * @returns {{
   *   x: number, y: number, vx: number, vy: number, speed: number,
   *   bouncedWall: boolean, bouncedPaddle: boolean, gameOver: boolean
   * }}
   */
  function stepBallPhysics(state, dt) {
    var safeDt = Math.min(Math.max(dt, 0), 0.05);
    var nextX = state.x + state.vx * safeDt;
    var nextY = state.y + state.vy * safeDt;
    var vx = state.vx;
    var vy = state.vy;
    var speed = state.speed;
    var r = state.radius;
    var bouncedWall = false;
    var bouncedPaddle = false;
    var gameOver = false;

    // Left / Right wall bounce
    if (nextX - r <= 0) {
      nextX = r;
      vx = Math.abs(vx);
      bouncedWall = true;
    } else if (nextX + r >= state.width) {
      nextX = state.width - r;
      vx = -Math.abs(vx);
      bouncedWall = true;
    }

    // Top wall bounce
    if (nextY - r <= 0) {
      nextY = r;
      vy = Math.abs(vy);
      bouncedWall = true;
    }

    // Paddle deflection (only when moving downward across the paddle plane)
    var prevBottom = state.y + r;
    var nextBottom = nextY + r;
    var withinPaddleX =
      nextX + r >= state.paddleX && nextX - r <= state.paddleX + state.paddleWidth;

    if (
      vy > 0 &&
      withinPaddleX &&
      prevBottom <= state.paddleY + state.paddleHeight &&
      nextBottom >= state.paddleY
    ) {
      var rebound = computePaddleRebound({
        ballX: nextX,
        paddleX: state.paddleX,
        paddleWidth: state.paddleWidth,
        speed: speed
      });
      nextY = state.paddleY - r;
      vx = rebound.vx;
      vy = rebound.vy;
      speed = rebound.speed;
      bouncedPaddle = true;
    } else if (nextY - r > state.height) {
      gameOver = true;
    }

    return {
      x: nextX,
      y: nextY,
      vx: vx,
      vy: vy,
      speed: speed,
      bouncedWall: bouncedWall,
      bouncedPaddle: bouncedPaddle,
      gameOver: gameOver
    };
  }

  /**
   * Safely reads and updates persistent high score using localStorage.
   */
  function readHighScore(storage) {
    try {
      if (!storage) {
        return 0;
      }
      var raw = storage.getItem(STORAGE_KEY);
      var parsed = parseInt(raw || '0', 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    } catch (_err) {
      return 0;
    }
  }

  function writeHighScore(storage, score) {
    try {
      if (storage) {
        storage.setItem(STORAGE_KEY, String(Math.max(0, Math.round(score))));
      }
    } catch (_err) {
      // Ignore storage quota or privacy-mode errors
    }
  }

  /**
   * Initializes the Solo Pong canvas runtime inside #wp-game-section.
   */
  function initGame() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    var canvas = document.getElementById('wp-game-canvas');
    var overlay = document.getElementById('wp-game-overlay');
    var overlayTitle = document.getElementById('wp-game-overlay-title');
    var overlayMeta = document.getElementById('wp-game-overlay-meta');
    var startBtn = document.getElementById('wp-game-start-btn');
    var scoreEl = document.getElementById('wp-game-score');
    var highScoreEl = document.getElementById('wp-game-high-score');

    if (!canvas || !canvas.getContext || !overlay || !startBtn || !scoreEl || !highScoreEl) {
      return;
    }

    var ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    var storage = null;
    try {
      storage = window.localStorage;
    } catch (_err) {
      storage = null;
    }

    var prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Pre-allocated pooled spark particles (zero GC allocations per frame)
    var PARTICLE_POOL_SIZE = 16;
    var particles = [];
    for (var pIdx = 0; pIdx < PARTICLE_POOL_SIZE; pIdx++) {
      particles.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0.25 });
    }
    var particleCursor = 0;

    function spawnBurst(x, y, count) {
      if (prefersReducedMotion) {
        return;
      }
      for (var i = 0; i < count; i++) {
        var slot = particles[particleCursor];
        particleCursor = (particleCursor + 1) % PARTICLE_POOL_SIZE;
        var spreadAngle = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7;
        var spd = 70 + Math.random() * 140;
        slot.active = true;
        slot.x = x;
        slot.y = y;
        slot.vx = Math.cos(spreadAngle) * spd;
        slot.vy = Math.sin(spreadAngle) * spd;
        slot.life = 0.24;
        slot.maxLife = 0.24;
      }
    }

    var gameState = {
      phase: 'title', // 'title' | 'playing' | 'gameover'
      score: 0,
      highScore: readHighScore(storage),
      paddleX: (LOGICAL_WIDTH - PADDLE_WIDTH) / 2,
      ballX: LOGICAL_WIDTH / 2,
      ballY: LOGICAL_HEIGHT * 0.22,
      ballVx: 82,
      ballVy: INITIAL_SPEED * 0.94,
      ballSpeed: INITIAL_SPEED,
      paddleFlashTimer: 0
    };

    var keys = {
      left: false,
      right: false
    };

    var dpr = 1;
    function syncCanvasResolution() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = LOGICAL_WIDTH * dpr;
      canvas.height = LOGICAL_HEIGHT * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    syncCanvasResolution();

    if (typeof window.ResizeObserver === 'function') {
      var ro = new window.ResizeObserver(syncCanvasResolution);
      ro.observe(canvas);
    } else {
      window.addEventListener('resize', syncCanvasResolution, { passive: true });
    }

    function updateHud() {
      scoreEl.textContent = String(Math.round(gameState.score));
      highScoreEl.textContent = String(Math.round(gameState.highScore));
    }

    function setPhase(nextPhase) {
      gameState.phase = nextPhase;
      document.body.dataset.state = nextPhase;

      if (nextPhase === 'playing') {
        overlay.classList.add('wp-game-overlay-hidden');
        overlay.setAttribute('aria-hidden', 'true');
      } else {
        overlay.classList.remove('wp-game-overlay-hidden');
        overlay.setAttribute('aria-hidden', 'false');
        if (nextPhase === 'title') {
          overlayTitle.textContent = 'SOLO PONG';
          overlayMeta.textContent = 'DEFLECT THE ECHO · DO NOT LET IT PASS';
          startBtn.textContent = 'START GAME';
        } else {
          overlayTitle.textContent = 'GAME OVER';
          overlayMeta.textContent =
            'SCORE ' +
            Math.round(gameState.score) +
            ' · BEST ' +
            Math.round(gameState.highScore);
          startBtn.textContent = 'PLAY AGAIN';
        }
      }
    }

    function resetRun() {
      var launchDir = Math.random() < 0.5 ? -1 : 1;
      var launchAngle = launchDir * (0.28 + Math.random() * 0.22);

      gameState.score = 0;
      gameState.paddleX = (LOGICAL_WIDTH - PADDLE_WIDTH) / 2;
      gameState.ballX = LOGICAL_WIDTH / 2;
      gameState.ballY = LOGICAL_HEIGHT * 0.22;
      gameState.ballSpeed = INITIAL_SPEED;
      gameState.ballVx = INITIAL_SPEED * Math.sin(launchAngle);
      gameState.ballVy = INITIAL_SPEED * Math.cos(launchAngle);
      gameState.paddleFlashTimer = 0;

      for (var i = 0; i < PARTICLE_POOL_SIZE; i++) {
        particles[i].active = false;
      }

      updateHud();
    }

    function startGame() {
      keys.left = false;
      keys.right = false;
      resetRun();
      setPhase('playing');
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    }

    function screenToLogicalX(clientX) {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width) {
        return LOGICAL_WIDTH / 2;
      }
      return ((clientX - rect.left) / rect.width) * LOGICAL_WIDTH;
    }

    function movePaddleToClientX(clientX) {
      var logicalX = screenToLogicalX(clientX);
      gameState.paddleX = clampPaddleX(
        logicalX - PADDLE_WIDTH / 2,
        PADDLE_WIDTH,
        LOGICAL_WIDTH
      );
    }

    // Mouse tracking
    canvas.addEventListener(
      'mousemove',
      function (event) {
        if (gameState.phase !== 'playing') {
          return;
        }
        movePaddleToClientX(event.clientX);
      },
      { passive: true }
    );

    // Touch dragging (prevents page scroll while dragging paddle)
    canvas.addEventListener(
      'touchstart',
      function (event) {
        if (gameState.phase !== 'playing') {
          return;
        }
        if (event.touches && event.touches.length > 0) {
          movePaddleToClientX(event.touches[0].clientX);
        }
      },
      { passive: true }
    );

    canvas.addEventListener(
      'touchmove',
      function (event) {
        if (gameState.phase !== 'playing') {
          return;
        }
        event.preventDefault();
        if (event.touches && event.touches.length > 0) {
          movePaddleToClientX(event.touches[0].clientX);
        }
      },
      { passive: false }
    );

    // Keyboard controls (Left/Right arrows & A/D, plus Enter/Space to start)
    window.addEventListener('keydown', function (event) {
      var key = event.key;
      if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        keys.left = true;
        if (gameState.phase === 'playing') {
          event.preventDefault();
        }
      } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        keys.right = true;
        if (gameState.phase === 'playing') {
          event.preventDefault();
        }
      } else if (
        (key === 'Enter' || key === ' ') &&
        (gameState.phase === 'title' || gameState.phase === 'gameover')
      ) {
        event.preventDefault();
        startGame();
      }
    });

    window.addEventListener('keyup', function (event) {
      var key = event.key;
      if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        keys.left = false;
      } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        keys.right = false;
      }
    });

    // Clear held inputs on focus loss so keys never stick
    window.addEventListener('blur', function () {
      keys.left = false;
      keys.right = false;
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        keys.left = false;
        keys.right = false;
      }
    });

    startBtn.addEventListener('click', function () {
      startGame();
    });

    function drawFrame() {
      // Warm editorial paper fill
      ctx.fillStyle = '#F7F6F0';
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      // Subtle architectural center guide line
      ctx.strokeStyle = '#DCDAD0';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(16, LOGICAL_HEIGHT / 2);
      ctx.lineTo(LOGICAL_WIDTH - 16, LOGICAL_HEIGHT / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Pooled ink bounce particles
      for (var i = 0; i < PARTICLE_POOL_SIZE; i++) {
        var pt = particles[i];
        if (!pt.active) {
          continue;
        }
        var alpha = clamp(pt.life / pt.maxLife, 0, 1);
        ctx.fillStyle = 'rgba(30, 30, 30, ' + alpha.toFixed(2) + ')';
        ctx.fillRect(pt.x - 1.5, pt.y - 1.5, 3, 3);
      }

      // Ball
      ctx.fillStyle = '#1E1E1E';
      ctx.beginPath();
      ctx.arc(gameState.ballX, gameState.ballY, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Dash-shaped horizontal paddle
      ctx.fillStyle = gameState.paddleFlashTimer > 0 ? '#6E6D68' : '#1E1E1E';
      ctx.fillRect(
        Math.round(gameState.paddleX),
        PADDLE_Y,
        PADDLE_WIDTH,
        PADDLE_HEIGHT
      );
    }

    var lastTimestamp = 0;
    function tick(timestamp) {
      if (!lastTimestamp) {
        lastTimestamp = timestamp;
      }
      var rawDt = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;
      var dt = Math.min(Math.max(rawDt, 0), 0.05);

      if (gameState.phase === 'playing') {
        if (keys.left && !keys.right) {
          gameState.paddleX = clampPaddleX(
            gameState.paddleX - PADDLE_SPEED * dt,
            PADDLE_WIDTH,
            LOGICAL_WIDTH
          );
        } else if (keys.right && !keys.left) {
          gameState.paddleX = clampPaddleX(
            gameState.paddleX + PADDLE_SPEED * dt,
            PADDLE_WIDTH,
            LOGICAL_WIDTH
          );
        }

        var step = stepBallPhysics(
          {
            x: gameState.ballX,
            y: gameState.ballY,
            vx: gameState.ballVx,
            vy: gameState.ballVy,
            speed: gameState.ballSpeed,
            radius: BALL_RADIUS,
            width: LOGICAL_WIDTH,
            height: LOGICAL_HEIGHT,
            paddleX: gameState.paddleX,
            paddleY: PADDLE_Y,
            paddleWidth: PADDLE_WIDTH,
            paddleHeight: PADDLE_HEIGHT
          },
          dt
        );

        gameState.ballX = step.x;
        gameState.ballY = step.y;
        gameState.ballVx = step.vx;
        gameState.ballVy = step.vy;
        gameState.ballSpeed = step.speed;

        if (step.bouncedPaddle) {
          gameState.score += 1;
          gameState.paddleFlashTimer = 0.07;
          if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            writeHighScore(storage, gameState.highScore);
          }
          updateHud();
          spawnBurst(gameState.ballX, PADDLE_Y, 6);
        }

        if (step.gameOver) {
          if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            writeHighScore(storage, gameState.highScore);
          }
          updateHud();
          setPhase('gameover');
        }
      }

      if (gameState.paddleFlashTimer > 0) {
        gameState.paddleFlashTimer = Math.max(0, gameState.paddleFlashTimer - dt);
      }

      for (var i = 0; i < PARTICLE_POOL_SIZE; i++) {
        var pt = particles[i];
        if (!pt.active) {
          continue;
        }
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        if (pt.life <= 0) {
          pt.active = false;
        }
      }

      drawFrame();
      window.requestAnimationFrame(tick);
    }

    // Boot state (supports ?autostart=1 for fast verification)
    updateHud();
    if (window.location && window.location.search.indexOf('autostart=1') !== -1) {
      startGame();
    } else {
      setPhase('title');
    }

    window.requestAnimationFrame(tick);
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initGame);
    } else {
      initGame();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      clamp: clamp,
      clampPaddleX: clampPaddleX,
      computePaddleRebound: computePaddleRebound,
      stepBallPhysics: stepBallPhysics,
      readHighScore: readHighScore,
      writeHighScore: writeHighScore
    };
  }
})();
