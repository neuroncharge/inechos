import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  clampPaddleX,
  computePaddleRebound,
  stepBallPhysics,
  readHighScore,
  writeHighScore
} = require('../public/wp-game.js');

test('clampPaddleX keeps paddle within canvas bounds', () => {
  assert.equal(clampPaddleX(-25, 88, 440), 0);
  assert.equal(clampPaddleX(150, 88, 440), 150);
  assert.equal(clampPaddleX(500, 88, 440), 352);
});

test('computePaddleRebound speeds up ball and produces sharper angles near edges', () => {
  const center = computePaddleRebound({
    ballX: 220,
    paddleX: 176,
    paddleWidth: 88,
    speed: 300
  });
  const rightEdge = computePaddleRebound({
    ballX: 264,
    paddleX: 176,
    paddleWidth: 88,
    speed: 300
  });

  assert.ok(center.speed > 300);
  assert.ok(Math.abs(center.vx) < 0.001);
  assert.ok(center.vy < 0);
  assert.ok(rightEdge.vx > Math.abs(center.vx) + 150);
  assert.ok(rightEdge.vy < 0);
});

test('stepBallPhysics bounces off walls, paddle, and triggers gameOver on miss', () => {
  const wallTop = stepBallPhysics(
    {
      x: 200,
      y: 4,
      vx: 50,
      vy: -200,
      speed: 206,
      radius: 6,
      width: 440,
      height: 520,
      paddleX: 176,
      paddleY: 486,
      paddleWidth: 88,
      paddleHeight: 8
    },
    0.02
  );
  assert.equal(wallTop.bouncedWall, true);
  assert.ok(wallTop.vy > 0);

  const paddleHit = stepBallPhysics(
    {
      x: 220,
      y: 478,
      vx: 40,
      vy: 300,
      speed: 302,
      radius: 6,
      width: 440,
      height: 520,
      paddleX: 176,
      paddleY: 486,
      paddleWidth: 88,
      paddleHeight: 8
    },
    0.02
  );
  assert.equal(paddleHit.bouncedPaddle, true);
  assert.ok(paddleHit.vy < 0);
  assert.ok(paddleHit.speed > 302);

  const missed = stepBallPhysics(
    {
      x: 40,
      y: 525,
      vx: 0,
      vy: 300,
      speed: 300,
      radius: 6,
      width: 440,
      height: 520,
      paddleX: 176,
      paddleY: 486,
      paddleWidth: 88,
      paddleHeight: 8
    },
    0.02
  );
  assert.equal(missed.gameOver, true);
});

test('readHighScore and writeHighScore handle storage cleanly', () => {
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    }
  };
  assert.equal(readHighScore(mockStorage), 0);
  writeHighScore(mockStorage, 14);
  assert.equal(readHighScore(mockStorage), 14);
});
