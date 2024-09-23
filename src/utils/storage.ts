// src/utils/storage.ts

import { Circle } from "../models/Circle";
import { Connection } from "../models/Connection";

interface StoredCircle {
  x: number;
  y: number;
  name: string;
  id: string;
  radius: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}

interface StoredConnection {
  circleA: { id: string };
  circleB: { id: string };
  k: number;
}

interface StoredData {
  circles: StoredCircle[];
  connections: StoredConnection[];
}

export function saveGraphToLocalStorage(
  sessionId: string,
  circles: Circle[],
  connections: Connection[]
): void {
  const data: StoredData = {
    circles: circles.map((circle) => ({
      x: circle.x,
      y: circle.y,
      name: circle.name,
      id: circle.id,
      radius: circle.radius,
      fillColor: circle.fillColor,
      strokeColor: circle.strokeColor,
      strokeWidth: circle.strokeWidth,
    })),
    connections: connections.map((conn) => ({
      circleA: { id: conn.circleA.id },
      circleB: { id: conn.circleB.id },
      k: conn.k,
    })),
  };
  const jsonData = JSON.stringify(data);
  localStorage.setItem(sessionId, jsonData);
}

export function loadGraphFromLocalStorage(
  sessionId: string,
  circles: Circle[],
  connections: Connection[]
): void {
  const jsonData = localStorage.getItem(sessionId);
  if (jsonData) {
    try {
      const data: StoredData = JSON.parse(jsonData);
      circles.length = 0;
      connections.length = 0;

      data.circles.forEach((circleData) => {
        const circle = new Circle(
          circleData.x,
          circleData.y,
          circleData.name,
          circleData.id,
          circleData.radius,
          circleData.fillColor,
          circleData.strokeColor,
          circleData.strokeWidth
        );
        circles.push(circle);
      });

      data.connections.forEach((connectionData) => {
        const circleA = circles.find(
          (circle) => circle.id === connectionData.circleA.id
        );
        const circleB = circles.find(
          (circle) => circle.id === connectionData.circleB.id
        );
        if (circleA && circleB) {
          const connection = new Connection(circleA, circleB, connectionData.k);
          connections.push(connection);
        }
      });
    } catch (error) {
      console.error("Failed to parse graph data from localStorage:", error);
    }
  }
}

export function saveGraphAsJSON(
  circles: Circle[],
  connections: Connection[]
): void {
  const data: StoredData = {
    circles: circles.map((circle) => ({
      x: circle.x,
      y: circle.y,
      name: circle.name,
      id: circle.id,
      radius: circle.radius,
      fillColor: circle.fillColor,
      strokeColor: circle.strokeColor,
      strokeWidth: circle.strokeWidth,
    })),
    connections: connections.map((conn) => ({
      circleA: { id: conn.circleA.id },
      circleB: { id: conn.circleB.id },
      k: conn.k,
    })),
  };
  const jsonData = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.download = "graph.json";
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

export function loadGraphFromJSON(
  file: File,
  circles: Circle[],
  connections: Connection[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);

    reader.onload = () => {
      if (!reader.result) {
        reject("No data found in file.");
        return;
      }
      try {
        const data: StoredData = JSON.parse(reader.result as string);
        circles.length = 0;
        connections.length = 0;

        data.circles.forEach((circleData) => {
          const circle = new Circle(
            circleData.x,
            circleData.y,
            circleData.name,
            circleData.id,
            circleData.radius,
            circleData.fillColor,
            circleData.strokeColor,
            circleData.strokeWidth
          );
          circles.push(circle);
        });

        data.connections.forEach((connectionData) => {
          const circleA = circles.find(
            (circle) => circle.id === connectionData.circleA.id
          );
          const circleB = circles.find(
            (circle) => circle.id === connectionData.circleB.id
          );
          if (circleA && circleB) {
            const connection = new Connection(
              circleA,
              circleB,
              connectionData.k
            );
            connections.push(connection);
          }
        });

        resolve();
      } catch (error) {
        reject("Failed to parse JSON file.");
      }
    };

    reader.onerror = () => {
      reject("Error reading file.");
    };
  });
}
/**
 * Retrieves the session ID from the URL's query parameters.
 * 
 * @param url - The current window URL.
 * @returns The session ID if present, otherwise null.
 */
export function getSessionIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    return params.get("sessionId");
  } catch {
    return null;
  }
}