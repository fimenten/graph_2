// src/utils/storage.ts
import { Circle } from "../models/Circle";
import { Connection } from "../models/Connection";
export function saveGraphToLocalStorage(sessionId, circles, connections) {
    const data = {
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
export function loadGraphFromLocalStorage(sessionId, circles, connections) {
    const jsonData = localStorage.getItem(sessionId);
    if (jsonData) {
        try {
            const data = JSON.parse(jsonData);
            circles.length = 0;
            connections.length = 0;
            data.circles.forEach((circleData) => {
                const circle = new Circle(circleData.x, circleData.y, circleData.name, circleData.id, circleData.radius, circleData.fillColor, circleData.strokeColor, circleData.strokeWidth);
                circles.push(circle);
            });
            data.connections.forEach((connectionData) => {
                const circleA = circles.find((circle) => circle.id === connectionData.circleA.id);
                const circleB = circles.find((circle) => circle.id === connectionData.circleB.id);
                if (circleA && circleB) {
                    const connection = new Connection(circleA, circleB, connectionData.k);
                    connections.push(connection);
                }
            });
        }
        catch (error) {
            console.error("Failed to parse graph data from localStorage:", error);
        }
    }
}
export function saveGraphAsJSON(circles, connections) {
    const data = {
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
export function loadGraphFromJSON(file, circles, connections) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => {
            if (!reader.result) {
                reject("No data found in file.");
                return;
            }
            try {
                const data = JSON.parse(reader.result);
                circles.length = 0;
                connections.length = 0;
                data.circles.forEach((circleData) => {
                    const circle = new Circle(circleData.x, circleData.y, circleData.name, circleData.id, circleData.radius, circleData.fillColor, circleData.strokeColor, circleData.strokeWidth);
                    circles.push(circle);
                });
                data.connections.forEach((connectionData) => {
                    const circleA = circles.find((circle) => circle.id === connectionData.circleA.id);
                    const circleB = circles.find((circle) => circle.id === connectionData.circleB.id);
                    if (circleA && circleB) {
                        const connection = new Connection(circleA, circleB, connectionData.k);
                        connections.push(connection);
                    }
                });
                resolve();
            }
            catch (error) {
                reject("Failed to parse JSON file.");
            }
        };
        reader.onerror = () => {
            reject("Error reading file.");
        };
    });
}
