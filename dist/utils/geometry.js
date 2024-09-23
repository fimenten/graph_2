// src/utils/geometry.ts
export function calculateAdaptiveFontSize(ctx, radius, name, maxFontSizeFactor = 0.5) {
    const maxFontSize = radius * maxFontSizeFactor;
    const maxNameWidth = radius * 2;
    let low = 1;
    let high = maxFontSize;
    let fontSize = maxFontSize;
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        ctx.font = `${mid}px Arial`;
        const nameWidth = ctx.measureText(name).width;
        if (nameWidth <= maxNameWidth) {
            fontSize = mid;
            low = mid + 1;
        }
        else {
            high = mid - 1;
        }
    }
    return fontSize;
}
// export function isXYinTheRectangle(
//   x: number,
//   y: number,
//   rectX: number,
//   rectY: number,
//   rectWidth: number,
//   rectHeight: number
// ): boolean {
//   const inX = Math.abs(x - rectX) < rectWidth / 2;
//   const inY = Math.abs(y - rectY) < rectHeight / 2;
//   return inX && inY;
// }
export function isXYinTheCircle(circle, x, y) {
    const dx = x - circle.x;
    const dy = y - circle.y;
    return Math.hypot(dx, dy) < circle.radius;
}
