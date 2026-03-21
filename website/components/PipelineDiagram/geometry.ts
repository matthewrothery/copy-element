export type Point = { x: number; y: number };

export function rectCenterRight(el: DOMRect, container: DOMRect): Point {
  return { x: el.right - container.left, y: el.top - container.top + el.height / 2 };
}

export function rectCenterLeft(el: DOMRect, container: DOMRect): Point {
  return { x: el.left - container.left, y: el.top - container.top + el.height / 2 };
}

export function buildPathD(points: Point[]): string {
  if (points.length === 0) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}
