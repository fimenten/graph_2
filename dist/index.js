// src/index.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Circle } from "./models/Circle";
import { Connection } from "./models/Connection";
import { generateUUID } from "./utils/uuid";
import { saveGraphToLocalStorage, loadGraphFromLocalStorage, saveGraphAsJSON, loadGraphFromJSON, } from "./utils/storage";
import { isXYinTheCircle } from "./utils/geometry";
import { MEDIUM_RADIUS_FACTOR, DEFAULT_K_VALUE, PAGE_RANK_DAMPING, PAGE_RANK_ITERATIONS, SAVE_INTERVAL_MS, } from "./constants";
// Ensure this script is executed after the DOM is fully loaded
window.addEventListener("DOMContentLoaded", () => {
    // Initial Setup
    const canvas = document.getElementById("forceFieldGraph");
    if (!canvas) {
        throw new Error('Canvas element with id "forceFieldGraph" not found.');
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Failed to get 2D context from canvas.");
    }
    // Set canvas size to window size
    canvas.width = window.innerWidth - 100;
    canvas.height = window.innerHeight;
    let smallerEdge = Math.min(canvas.width, canvas.height);
    let lastPos = { x: null, y: null };
    const actionsHistory = [];
    let hoveredCircle = null;
    let selectedCircle = null;
    const circles = [];
    const connections = [];
    let draggingCircle = null;
    let draggingCircleDB = null;
    let lastTapTime = 0;
    let isDraggingCanvas = false;
    // Utility to get sessionId
    function getSessionIdFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const params = new URLSearchParams(urlObj.search);
            return params.get("sessionId");
        }
        catch (_a) {
            return null;
        }
    }
    let sessionId = getSessionIdFromUrl(window.location.href);
    sessionId = sessionId ? sessionId : generateUUID();
    console.log("Session ID:", sessionId);
    // PageRank Calculation
    function calculatePageRank(damping = PAGE_RANK_DAMPING, iterations = PAGE_RANK_ITERATIONS) {
        const n = circles.length;
        if (n === 0)
            return;
        let pageRanks = Array(n).fill(1 / n);
        let newPageRanks = Array(n).fill(0);
        for (let iter = 0; iter < iterations; iter++) {
            newPageRanks.fill(0);
            for (let i = 0; i < n; i++) {
                const circle = circles[i];
                const outgoingConnections = connections.filter((conn) => conn.circleA === circle);
                if (outgoingConnections.length > 0) {
                    const rank = pageRanks[i] / outgoingConnections.length;
                    outgoingConnections.forEach((conn) => {
                        const targetIndex = circles.indexOf(conn.circleB);
                        if (targetIndex !== -1) {
                            newPageRanks[targetIndex] += rank;
                        }
                    });
                }
            }
            for (let i = 0; i < n; i++) {
                newPageRanks[i] = (1 - damping) / n + damping * newPageRanks[i];
            }
            pageRanks = [...newPageRanks];
        }
        for (let i = 0; i < n; i++) {
            circles[i].pageRank = pageRanks[i];
        }
    }
    // Handle Window Resize
    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth - 100;
        canvas.height = window.innerHeight;
        smallerEdge = Math.min(canvas.width, canvas.height);
    });
    // Generate Random Positions for Circles
    function generateRandomCircles() {
        circles.forEach((circle) => {
            circle.x = Math.random() * canvas.width;
            circle.y = Math.random() * canvas.height;
        });
    }
    // Delete All Connections Related to a Circle
    function deleteConnectionsForCircle(circle) {
        for (let i = connections.length - 1; i >= 0; i--) {
            const connection = connections[i];
            if (connection.circleA === circle || connection.circleB === circle) {
                connections.splice(i, 1);
                actionsHistory.push({ type: "removeConnection", connection });
            }
        }
    }
    // Handle Collisions Between Circles (Rectangular)
    function handleCollisionsRect() {
        for (let i = 0; i < circles.length; i++) {
            for (let j = i + 1; j < circles.length; j++) {
                const circleA = circles[i];
                const circleB = circles[j];
                const rectA = {
                    left: circleA.x - circleA.rectWidth / 2,
                    right: circleA.x + circleA.rectWidth / 2,
                    top: circleA.y - circleA.rectHeight / 2,
                    bottom: circleA.y + circleA.rectHeight / 2,
                };
                const rectB = {
                    left: circleB.x - circleB.rectWidth / 2,
                    right: circleB.x + circleB.rectWidth / 2,
                    top: circleB.y - circleB.rectHeight / 2,
                    bottom: circleB.y + circleB.rectHeight / 2,
                };
                if (rectA.left < rectB.right &&
                    rectA.right > rectB.left &&
                    rectA.top < rectB.bottom &&
                    rectA.bottom > rectB.top) {
                    const overlapX = Math.min(rectA.right - rectB.left, rectB.right - rectA.left);
                    const overlapY = Math.min(rectA.bottom - rectB.top, rectB.bottom - rectA.top);
                    if (overlapX < overlapY) {
                        const offsetX = overlapX / 2;
                        if (rectA.left < rectB.left) {
                            circleA.x -= offsetX;
                            circleB.x += offsetX;
                        }
                        else {
                            circleA.x += offsetX;
                            circleB.x -= offsetX;
                        }
                    }
                    else {
                        const offsetY = overlapY / 2;
                        if (rectA.top < rectB.top) {
                            circleA.y -= offsetY;
                            circleB.y += offsetY;
                        }
                        else {
                            circleA.y += offsetY;
                            circleB.y -= offsetY;
                        }
                    }
                }
            }
        }
    }
    // Check if Two Circles are Connected
    function areCirclesConnected(circleA, circleB) {
        return connections.some((connection) => (connection.circleA === circleA && connection.circleB === circleB) ||
            (connection.circleA === circleB && connection.circleB === circleA));
    }
    // Delete Connection if Connected
    function deleteConnectionIfConnected(circleA, circleB) {
        for (let i = 0; i < connections.length; i++) {
            const connection = connections[i];
            if ((connection.circleA === circleA && connection.circleB === circleB) ||
                (connection.circleA === circleB && connection.circleB === circleA)) {
                connections.splice(i, 1);
                actionsHistory.push({ type: "removeConnection", connection });
                return true;
            }
        }
        return false;
    }
    // Save Graph as JSON File
    function saveGraph() {
        saveGraphAsJSON(circles, connections);
    }
    // Load Graph from JSON File
    function loadGraph() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json";
        input.addEventListener("change", () => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const file = (_a = input.files) === null || _a === void 0 ? void 0 : _a[0];
            if (!file)
                return;
            try {
                yield loadGraphFromJSON(file, circles, connections);
                actionsHistory.push({ type: "resetCanvas" });
            }
            catch (error) {
                console.error(error);
            }
        }));
        input.click();
    }
    // Reset Canvas
    function resetCanvas() {
        const confirmation = window.confirm("Do you really want to reset the canvas?");
        if (confirmation) {
            circles.length = 0;
            connections.length = 0;
            actionsHistory.push({ type: "resetCanvas" });
        }
    }
    // Handle Mouse and Touch Events
    // Mouse Down Event
    canvas.addEventListener("mousedown", (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        let anyCircle = false;
        for (const circle of circles) {
            if (isXYinTheCircle(circle, mouseX, mouseY)) {
                selectedCircle = circle;
                draggingCircle = circle;
                if (draggingCircleDB) {
                    draggingCircle = null;
                }
                anyCircle = true;
                break;
            }
        }
        if (!anyCircle) {
            isDraggingCanvas = true;
            lastPos.x = mouseX;
            lastPos.y = mouseY;
        }
    });
    // Key Down Events
    document.addEventListener("keydown", (event) => {
        // Ctrl + Enter: Add a new circle connected to the selected circle
        if (event.ctrlKey && event.key === "Enter" && selectedCircle) {
            const newCircle = new Circle(selectedCircle.x + 50, selectedCircle.y + 50, "", generateUUID(), MEDIUM_RADIUS_FACTOR * smallerEdge);
            const name = prompt("Enter a name for the circle:", newCircle.name);
            if (name !== null) {
                newCircle.name = name;
            }
            circles.push(newCircle);
            actionsHistory.push({ type: "addCircle", circle: newCircle });
            const connection = new Connection(newCircle, selectedCircle, DEFAULT_K_VALUE);
            connections.push(connection);
            actionsHistory.push({ type: "addConnection", connection });
            selectedCircle = newCircle;
        }
        // Shift + Enter: Rename the selected circle
        if (event.shiftKey && event.key === "Enter" && selectedCircle) {
            const newName = prompt("Enter a new name for the selected circle:", selectedCircle.name);
            if (newName !== null) {
                const oldName = selectedCircle.name;
                selectedCircle.name = newName;
                actionsHistory.push({
                    type: "renameCircle",
                    circle: selectedCircle,
                    oldName,
                    newName,
                });
            }
        }
        // Tab: Navigate through circles
        if (event.key === "Tab") {
            event.preventDefault();
            if (circles.length > 0) {
                const currentIndex = selectedCircle
                    ? circles.indexOf(selectedCircle)
                    : -1;
                let nextIndex;
                if (event.shiftKey) {
                    nextIndex = (currentIndex - 1 + circles.length) % circles.length;
                }
                else {
                    nextIndex = (currentIndex + 1) % circles.length;
                }
                selectedCircle = circles[nextIndex];
            }
        }
        // Ctrl + Z: Undo last action
        if (event.ctrlKey && event.key.toLowerCase() === "z") {
            if (actionsHistory.length > 0) {
                const lastAction = actionsHistory.pop();
                if (!lastAction)
                    return;
                switch (lastAction.type) {
                    case "addCircle":
                        if (lastAction.circle) {
                            deleteConnectionsForCircle(lastAction.circle);
                            const index = circles.indexOf(lastAction.circle);
                            if (index !== -1) {
                                circles.splice(index, 1);
                            }
                        }
                        break;
                    case "removeConnection":
                        if (lastAction.connection) {
                            connections.push(lastAction.connection);
                        }
                        break;
                    case "renameCircle":
                        if (lastAction.circle && lastAction.oldName !== undefined) {
                            lastAction.circle.name = lastAction.oldName;
                        }
                        break;
                    case "removeCircle":
                        if (lastAction.circle) {
                            circles.push(lastAction.circle);
                            // Note: Connections are not restored in this simple undo
                        }
                        break;
                    case "resetCanvas":
                        // Implement canvas reset undo if needed
                        break;
                    default:
                        break;
                }
            }
        }
        // Delete Key: Remove hovered circle
        if (event.key === "Delete" && hoveredCircle) {
            const index = circles.indexOf(hoveredCircle);
            if (index !== -1) {
                circles.splice(index, 1);
                deleteConnectionsForCircle(hoveredCircle);
                actionsHistory.push({ type: "removeCircle", circle: hoveredCircle });
                hoveredCircle = null;
            }
        }
    });
    // Context Menu (Right Click) Event
    canvas.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        for (const circle of circles) {
            if (isXYinTheCircle(circle, mouseX, mouseY)) {
                const name = prompt("Enter a name for the circle:", circle.name);
                if (name !== null) {
                    const oldName = circle.name;
                    circle.name = name;
                    actionsHistory.push({
                        type: "renameCircle",
                        circle,
                        oldName,
                        newName: name,
                    });
                }
                break;
            }
        }
    });
    // Click Event
    canvas.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        if (event.shiftKey) {
            for (const circle of circles) {
                if (isXYinTheCircle(circle, mouseX, mouseY)) {
                    const color = prompt("Enter a new color for the circle:", circle.fillColor);
                    if (color !== null) {
                        circle.setColor(color);
                        actionsHistory.push({ type: "changeColor", circle });
                    }
                    break;
                }
            }
        }
    });
    // Double Click Event
    canvas.addEventListener("dblclick", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (draggingCircle || draggingCircleDB) {
            draggingCircle = null;
            draggingCircleDB = null;
        }
        else {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            let any = false;
            for (const circle of circles) {
                if (isXYinTheCircle(circle, mouseX, mouseY)) {
                    draggingCircleDB = circle;
                    draggingCircle = null;
                    any = true;
                    break;
                }
            }
            if (!any) {
                const circle = new Circle(mouseX, mouseY, "", generateUUID(), MEDIUM_RADIUS_FACTOR * smallerEdge);
                const name = prompt("Enter a name for the circle:", circle.name);
                if (name !== null) {
                    circle.name = name;
                }
                circles.push(circle);
                actionsHistory.push({ type: "addCircle", circle });
            }
        }
    });
    // Mouse Move Event
    canvas.addEventListener("mousemove", (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        if (draggingCircle) {
            draggingCircle.x = mouseX;
            draggingCircle.y = mouseY;
            return;
        }
        hoveredCircle = null;
        for (const circle of circles) {
            if (isXYinTheCircle(circle, mouseX, mouseY)) {
                hoveredCircle = circle;
                break;
            }
        }
        if (isDraggingCanvas && lastPos.x !== null && lastPos.y !== null) {
            const diffX = lastPos.x - mouseX;
            const diffY = lastPos.y - mouseY;
            circles.forEach((circle) => {
                circle.x -= diffX;
                circle.y -= diffY;
            });
            lastPos.x = mouseX;
            lastPos.y = mouseY;
        }
    });
    // Mouse Up Event
    canvas.addEventListener("mouseup", (event) => {
        if (draggingCircleDB) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            let isAny = false;
            for (const circle of circles) {
                if (circle !== draggingCircleDB && isXYinTheCircle(circle, mouseX, mouseY)) {
                    if (areCirclesConnected(draggingCircleDB, circle)) {
                        deleteConnectionIfConnected(draggingCircleDB, circle);
                    }
                    else {
                        const connection = new Connection(draggingCircleDB, circle, DEFAULT_K_VALUE);
                        connections.push(connection);
                        actionsHistory.push({ type: "addConnection", connection });
                    }
                    isAny = true;
                    break;
                }
            }
            draggingCircleDB = null;
        }
        draggingCircle = null;
        isDraggingCanvas = false;
    });
    // Touch Events
    // Touch Start Event
    canvas.addEventListener("touchstart", (event) => {
        if (event.touches.length > 1)
            return;
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime;
        const rect = canvas.getBoundingClientRect();
        const touch = event.touches[0];
        const mouseX = touch.clientX - rect.left;
        const mouseY = touch.clientY - rect.top;
        if (tapLength < 300 && tapLength > 0) {
            // Double-tap detected
            let any = false;
            for (const circle of circles) {
                if (isXYinTheCircle(circle, mouseX, mouseY)) {
                    draggingCircleDB = circle;
                    draggingCircle = null;
                    any = true;
                    event.stopPropagation();
                    break;
                }
            }
            if (!any) {
                event.stopPropagation();
                const circle = new Circle(mouseX, mouseY, "", generateUUID(), MEDIUM_RADIUS_FACTOR * smallerEdge);
                const name = prompt("Enter a name for the circle:", circle.name);
                if (name !== null) {
                    circle.name = name;
                }
                circles.push(circle);
                actionsHistory.push({ type: "addCircle", circle });
            }
        }
        else {
            // Single tap
            for (const circle of circles) {
                const dx = mouseX - circle.x;
                const dy = mouseY - circle.y;
                const distance = Math.hypot(dx, dy);
                if (distance <= circle.radius) {
                    draggingCircle = circle;
                    event.stopPropagation();
                    break;
                }
            }
        }
        lastTapTime = currentTime;
    });
    // Touch Move Event
    canvas.addEventListener("touchmove", (event) => {
        if (event.touches.length > 1)
            return;
        const rect = canvas.getBoundingClientRect();
        const touch = event.touches[0];
        const mouseX = touch.clientX - rect.left;
        const mouseY = touch.clientY - rect.top;
        if (draggingCircle) {
            draggingCircle.x = mouseX;
            draggingCircle.y = mouseY;
        }
    });
    // Touch End Event
    canvas.addEventListener("touchend", (event) => {
        draggingCircle = null;
    });
    // Keyboard Shortcuts for Saving and Loading
    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey && event.key === "s") {
            event.preventDefault();
            saveGraph();
        }
        if (event.ctrlKey && event.key === "o") {
            event.preventDefault();
            loadGraph();
        }
        if (event.ctrlKey && event.key === "r") {
            event.preventDefault();
            resetCanvas();
        }
    });
    // Animation Loop
    function animate() {
        if (!ctx) {
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        circles.forEach((circle) => {
            circle.draw(ctx);
        });
        connections.forEach((connection) => {
            connection.draw(ctx);
            connection.applyForces();
        });
        handleCollisionsRect();
        requestAnimationFrame(animate);
    }
    // Load Graph on Initialization
    loadGraphFromLocalStorage(sessionId, circles, connections);
    // Start Animation
    animate();
    // Save Graph to LocalStorage Every Second
    setInterval(() => {
        saveGraphToLocalStorage(sessionId, circles, connections);
    }, SAVE_INTERVAL_MS);
});
