// src/utils/geometry.ts

/**
 * Checks if a given (x, y) point is inside a rectangle centered at (rectX, rectY)
 * with the specified width and height.
 * 
 * @param x - The x-coordinate of the point to check.
 * @param y - The y-coordinate of the point to check.
 * @param rectX - The x-coordinate of the rectangle's center.
 * @param rectY - The y-coordinate of the rectangle's center.
 * @param rectWidth - The width of the rectangle.
 * @param rectHeight - The height of the rectangle.
 * @returns True if the point is inside the rectangle, false otherwise.
 */
export function isXYinTheRectangle(
  x: number,
  y: number,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number
): boolean {
  return (
    x >= rectX - rectWidth / 2 &&
    x <= rectX + rectWidth / 2 &&
    y >= rectY - rectHeight / 2 &&
    y <= rectY + rectHeight / 2
  );
}

/**
 * Checks if a given (x, y) point is inside a circle centered at (circleX, circleY)
 * with the specified radius.
 * 
 * @param x - The x-coordinate of the point to check.
 * @param y - The y-coordinate of the point to check.
 * @param circleX - The x-coordinate of the circle's center.
 * @param circleY - The y-coordinate of the circle's center.
 * @param radius - The radius of the circle.
 * @returns True if the point is inside the circle, false otherwise.
 */
export function isXYinTheCircle(
  x: number,
  y: number,
  circleX: number,
  circleY: number,
  radius: number
): boolean {
  const dx = x - circleX;
  const dy = y - circleY;
  return dx * dx + dy * dy <= radius * radius;
}

/**
 * Calculates an adaptive font size that fits the given text within the specified maximum width.
 * The font size will be within the range of minSize to maxSize.
 * 
 * @param ctx - The canvas rendering context.
 * @param text - The text to measure.
 * @param maxWidth - The maximum allowed width for the text.
 * @param minSize - The minimum font size.
 * @param maxSize - The maximum font size.
 * @returns The calculated font size that fits the text within maxWidth.
 */
export function calculateAdaptiveFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  minSize: number,
  maxSize: number
): number {
  let fontSize = maxSize;
  ctx.font = `${fontSize}px Arial`;
  let textWidth = ctx.measureText(text).width;

  while (textWidth > maxWidth && fontSize > minSize) {
    fontSize--;
    ctx.font = `${fontSize}px Arial`;
    textWidth = ctx.measureText(text).width;
  }

  return fontSize;
}
