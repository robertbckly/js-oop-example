const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const scoreElement = document.querySelector('.score');

let screenWidth = 0;
let screenHeight = 0;
let lastFrame = null;

const BALL_COUNT = 50;
const BALL_RAD_MIN = 10;
const BALL_RAD_MAX = 25;
const BALL_VEL_RANGE = 7;
const BALL_TRAIL = 0.75; // 0-1

const PLAYER_RAD_PROP = 0.1; // proportion of screenWidth
const PLAYER_RAD_PROP_MAX = 0.2;
const PLAYER_VEL_MAX = BALL_VEL_RANGE;
const PLAYER_LINE_WIDTH = PLAYER_VEL_MAX; // ensures smoother trail

let player = null;
let score = 0;

// Generic Ball
class Ball {
  // Track all Balls via static member on Ball class for convenience
  static balls = [];

  constructor(x, y, velX, velY, radius, color) {
    this.x = x;
    this.y = y;
    this.velX = velX;
    this.velY = velY;
    this.radius = radius;
    this.color = color;
    this.exists = true;
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
  }

  update() {
    if (!this.exists) return;
    // Move
    this.move();
    // Handle edge collision
    this.handleEdgeCollision();
    // Handle ball collision
    this.detectBallCollision((otherBall) => {
      this.handleBallCollision(otherBall);
    });
    // Redraw
    this.draw();
  }

  move() {
    this.x += this.velX;
    this.y += this.velY;
  }

  detectEdgeCollision() {
    // If collided with screen edge, return name of edge, otherwise null.

    // Left edge
    if (this.x - this.radius <= 0) {
      return 'left';
    }
    // Right edge
    if (this.x + this.radius >= screenWidth) {
      return 'right';
    }
    // Top edge
    if (this.y - this.radius <= 0) {
      return 'top';
    }
    // Bottom edge
    if (this.y + this.radius >= screenHeight) {
      return 'bottom';
    }

    // No collision (default)
    return null;
  }

  detectBallCollision(callback) {
    Ball.balls.forEach((ball) => {
      // Don't collide with self or a ball that no longer exists
      if (this === ball || !ball.exists) return;

      // Ball collision detection uses Pythagoras' theorem
      // For Balls A and B, work out distance between them on x-axis and y-axis...
      // xd^2 + yd^2 = d^2
      // if d <= this.radius + ball.radius then COLLISION!
      const xDist = this.x - ball.x;
      const yDist = this.y - ball.y;
      const dist = Math.sqrt(xDist ** 2 + yDist ** 2);

      // Collision condition!
      if (dist <= this.radius + ball.radius) {
        callback(ball);
      }
    });
  }

  handleEdgeCollision() {
    // Bounce by default (reverse velocity in each axis)
    // This works by checking if still going in direction of edge and reversing it if so
    // Before, I was simply reversing direction upon edge collision...
    // but balls could get stuck over there, basically vibrating as they...
    // get in a velocity-reverse-loop
    switch (this.detectEdgeCollision()) {
      case 'left':
        // If still going left, reverse
        if (this.velX < 0) this.velX = -this.velX;
        break;
      case 'right':
        // If still going right, reverse
        if (this.velX > 0) this.velX = -this.velX;
        break;
      case 'top':
        // If still going up, reverse
        if (this.velY < 0) this.velY = -this.velY;
        break;
      case 'bottom':
        // If still going down, reverse
        if (this.velY > 0) this.velY = -this.velY;
        break;
      default:
        break;
    }
  }

  handleBallCollision(otherBall) {
    // Bounce by default (switch velocities between balls)
    const thisVelX = this.velX;
    const thisVelY = this.velY;
    this.velX = otherBall.velX;
    this.velY = otherBall.velY;
    otherBall.velX = thisVelX;
    otherBall.velY = thisVelY;
  }
}

// OtherBall Class
class OtherBall extends Ball {
  constructor(x, y, velX, velY, radius, color) {
    super(x, y, velX, velY, radius, color);
  }
}

// PlayerBall Class
class PlayerBall extends Ball {
  constructor(x, y, velX, velY, radius, lineWidth, color) {
    super(x, y, velX, velY, radius, color);
    this.lineWidth = lineWidth;
  }

  draw() {
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.stroke();
  }

  accelerate(dir) {
    switch (dir) {
      case 'up':
        if (-this.velY < PLAYER_VEL_MAX) player.velY--;
        break;
      case 'down':
        if (this.velY < PLAYER_VEL_MAX) player.velY++;
        break;
      case 'left':
        if (-this.velX < PLAYER_VEL_MAX) player.velX--;
        break;
      case 'right':
        if (this.velX < PLAYER_VEL_MAX) player.velX++;
        break;
    }
  }

  handleBallCollision(otherBall) {
    // 'Destroy' otherBall & increase score
    otherBall.exists = false;
    score++;
    // Grow up to max size
    if (this.radius < (screenWidth * PLAYER_RAD_PROP_MAX) / 2) this.radius++;
  }
}

function init() {
  // Calculate dimensions for canvas
  calcDimensions();

  score = 0;
  Ball.balls = [];

  // Populate Ball.balls array
  while (Ball.balls.length < BALL_COUNT) {
    const radius = random(BALL_RAD_MIN, BALL_RAD_MAX);
    const newBall = new OtherBall(
      random(radius, screenWidth - radius),
      random(radius, screenHeight - radius),
      random(-BALL_VEL_RANGE, BALL_VEL_RANGE, true),
      random(-BALL_VEL_RANGE, BALL_VEL_RANGE, true),
      radius,
      `rgb(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)})`
    );
    Ball.balls.push(newBall);
  }

  // Init player
  player = new PlayerBall(
    screenWidth / 2,
    screenHeight / 2,
    0,
    0,
    (screenWidth * PLAYER_RAD_PROP) / 2,
    PLAYER_LINE_WIDTH,
    'white'
  );

  // Add keydown event-handler
  window.onkeydown = (e) => {
    // Move player
    switch (e.key) {
      case 'w':
      case 'ArrowUp':
        player.accelerate('up');
        break;
      case 's':
      case 'ArrowDown':
        player.accelerate('down');
        break;
      case 'a':
      case 'ArrowLeft':
        player.accelerate('left');
        break;
      case 'd':
      case 'ArrowRight':
        player.accelerate('right');
        break;
    }
  };

  // Start loop
  loop();
}

// Loop!
function loop() {
  // Clear before draw of next frame
  ctx.fillStyle = `rgba(0, 0, 0, ${1 - BALL_TRAIL})`;
  ctx.fillRect(0, 0, screenWidth, screenHeight);

  // Update Ball.balls and detect inter-ball collision
  Ball.balls.forEach((ball) => {
    ball.update();
  });

  // Update player
  player.update();

  // Update score
  scoreElement.textContent = score;

  // Check if won
  if (score === Ball.balls.length) {
    // Halt loop, alert player, reset game
    window.cancelAnimationFrame(lastFrame);
    alert('You won!');
    return init();
  }

  // Invoke next loop
  lastFrame = window.requestAnimationFrame(loop);
}

// Helper function to generate random number
function random(min, max, nonzero) {
  let out = Math.floor(Math.random() * (max - min + 1)) + min;
  if (out === 0 && nonzero === true) return 1;
  return out;
}

// Helper function set widths + heights
function calcDimensions() {
  screenWidth = canvas.width = window.innerWidth;
  screenHeight = canvas.height = window.innerHeight;
}

// Entry point
window.onload = () => {
  init();
};

// Track attempts to resize window...
// Limit to 1 change every 200ms
const RESIZE_CALL_DELTA = 200; // ms
let justResized = false;
window.onresize = () => {
  // Limit frequency of executing resize logic...
  // (To prevent screen flashes)
  if (!justResized) {
    // Stop game looping mechanism
    window.cancelAnimationFrame(lastFrame);
    // Hide rendering
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, screenWidth, screenHeight);
    // Wait given amount of time before resetting game...
    // And re-allowing resize logic
    setTimeout(() => {
      init();
      justResized = false;
    }, RESIZE_CALL_DELTA);
  }
  justResized = true;
};
