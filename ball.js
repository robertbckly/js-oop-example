export class Ball {
  constructor(x, y, velX, velY, color, size) {
    this.x = x;
    this.y = y;
    this.velX = velX;
    this.velY = velY;
    this.color = color;
    this.size = size;
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
    ctx.fill();
  }

  update() {
    // Move ball
    this.x += this.velX;
    this.y += this.velY;

    // Reverse vel at left edge
    if (this.x - this.size <= 0) {
      this.velX = -this.velX;
    }
    // Reverse vel at right edge
    if (this.x + this.size >= WIDTH) {
      this.velX = -this.velX;
    }
    // Reverse vel at top edge
    if (this.y - this.size <= 0) {
      this.velY = -this.velY;
    }
    // Reverse vel at bottom edge
    if (this.y + this.size >= HEIGHT) {
      this.velY = -this.velY;
    }
  }
}