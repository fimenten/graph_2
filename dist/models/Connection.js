import { ARROW_SIZE } from "../constants";
export class Connection {
    constructor(circleA, circleB, k = 0.01) {
        this.restLength = 0;
        this.circleA = circleA;
        this.circleB = circleB;
        this.k = k;
    }
    draw(ctx) {
        this.restLength =
            (this.circleA.rectWidth + this.circleB.rectWidth) / 2;
        const angle = Math.atan2(this.circleB.y - this.circleA.y, this.circleB.x - this.circleA.x);
        // Calculate connection points based on rectangles
        const startX = this.circleA.x + (this.circleA.rectWidth / 2) * Math.cos(angle);
        const startY = this.circleA.y + (this.circleA.rectHeight / 2) * Math.sin(angle);
        const endX = this.circleB.x - (this.circleB.rectWidth / 2) * Math.cos(angle);
        const endY = this.circleB.y - (this.circleB.rectHeight / 2) * Math.sin(angle);
        // Draw line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = "#000";
        ctx.stroke();
        // Draw arrowhead
        const angleLine = Math.atan2(endY - startY, endX - startX);
        this.drawArrowhead(ctx, endX, endY, angleLine);
    }
    drawArrowhead(ctx, x, y, angle) {
        ctx.beginPath();
        ctx.moveTo(x - ARROW_SIZE * Math.cos(angle - Math.PI / 6), y - ARROW_SIZE * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x, y);
        ctx.lineTo(x - ARROW_SIZE * Math.cos(angle + Math.PI / 6), y - ARROW_SIZE * Math.sin(angle + Math.PI / 6));
        ctx.strokeStyle = "#000";
        ctx.stroke();
    }
    distanceBetween(circleA, circleB) {
        return Math.hypot(circleB.x - circleA.x, circleB.y - circleA.y);
    }
    applyForces() {
        this.restLength = Math.sqrt((this.circleA.rectWidth * this.circleB.rectWidth) / 2);
        const distance = this.distanceBetween(this.circleA, this.circleB);
        const force = this.k * (distance - this.restLength);
        const dx = this.circleB.x - this.circleA.x;
        const dy = this.circleB.y - this.circleA.y;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        this.circleA.x += fx;
        this.circleA.y += fy;
        this.circleB.x -= fx;
        this.circleB.y -= fy;
    }
}
