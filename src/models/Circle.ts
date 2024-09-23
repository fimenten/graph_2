// src/models/Circle.ts

import { calculateAdaptiveFontSize } from "../utils/geometry";

export class Circle {
  x: number;
  y: number;
  name: string;
  id: string;
  radius: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  pageRank?: number;
  rectWidth: number = 0;
  rectHeight: number = 0;

  constructor(
    x: number,
    y: number,
    name: string = "",
    id: string,
    radius: number = 0,
    fillColor: string = "blue",
    strokeColor: string = "black",
    strokeWidth: number = 2
  ) {
    this.x = x;
    this.y = y;
    this.name = name;
    this.id = id;
    this.radius = radius;
    this.fillColor = fillColor;
    this.strokeColor = strokeColor;
    this.strokeWidth = strokeWidth;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.pageRank !== undefined) {
      const minRadius = this.radius * 0.5; // Adjust as needed
      const maxRadius = this.radius * 1.5; // Adjust as needed
      this.radius =
        minRadius + (maxRadius - minRadius) * this.pageRank * 10; // Scale as needed
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = this.fillColor;
    ctx.fill();
    ctx.lineWidth = this.strokeWidth;
    ctx.strokeStyle = this.strokeColor;
    ctx.stroke();
    this.drawCircleName(ctx);
  }

  setColor(color: string): void {
    this.fillColor = color;
  }

  drawCircleName(ctx: CanvasRenderingContext2D): void {
    if (this.name) {
      const fontSize = calculateAdaptiveFontSize(ctx,  this.name,);
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.name, this.x, this.y);
    }
  }
}
