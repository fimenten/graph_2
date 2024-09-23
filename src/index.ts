// src/index.ts

import { Circle } from "./models/Circle";
import { Connection } from "./models/Connection";
import { generateUUID } from "./utils/uuid";
import { calculateAdaptiveFontSize, isXYinTheRectangle } from "./utils/geometry";
import {
  saveGraphToLocalStorage,
  loadGraphFromLocalStorage,
} from "./utils/storage";
import { ActionHistoryItem, ActionType, Position } from "./types";
import { constants } from "./constants";

// Initialize Canvas
const canvas = document.getElementById("forceFieldGraph") as HTMLCanvasElement;
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

// State Variables
let lastPos: Position = { x: null, y: null };
const actionsHistory: ActionHistoryItem[] = [];
let hoveredCircle: Circle | null = null;
let selectedCircle: Circle | null = null;
let circles: Circle[] = [];
let connections: Connection[] = [];
let draggingCircle: Circle | null = null;
let draggingCircleDB: Circle | null = null;
let lastTapTime: number = 0;
let isDraggingCanvas: boolean = false;

// Constants
const SMALL_RADIUS = constants.SMALL_RADIUS_FACTOR;
const MEDIUM_RADIUS = constants.MEDIUM_RADIUS_FACTOR;
const LARGE_RADIUS = constants.LARGE_RADIUS_FACTOR;

// Session ID
let sessionId: string | null = (window.location.href);
sessionId = sessionId ? sessionId : generateUUID();

console.log(`Session ID: ${sessionId}`);

// PageRank Calculation
function calculatePageRank(
  damping: number = constants.PAGE_RANK_DAMPING,
  iterations: number = constants.PAGE_RANK_ITERATIONS
): void {
  const n = circles.length;
  if (n === 0) return;

  let pageRanks: number[] = Array(n).fill(1 / n);
  let newPageRanks: number[] = Array(n).fill(0);

  for (let iter = 0; iter < iterations; iter++) {
    newPageRanks.fill(0);

    for (let i = 0; i < n; i++) {
      const circle = circles[i];
      const outgoingConnections = connections.filter(
        (conn) => conn.circleA === circle
      );

      if (outgoingConnections.length > 0) {
        const rank = pageRanks[i] / outgoingConnections.length;
        for (const conn of outgoingConnections) {
          const targetIndex = circles.indexOf(conn.circleB);
          if (targetIndex !== -1) {
            newPageRanks[targetIndex] += rank;
          }
        }
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
function generateRandomCircles(): void {
  const newCircle = new Circle(
    Math.random() * canvas.width,
    Math.random() * canvas.height,
    "Random",
    generateUUID(),
    smallerEdge * MEDIUM_RADIUS,
    "blue",
    "black",
    2
  );
  circles.push(newCircle);
  actionsHistory.push({ type: "addCircle", circle: newCircle });
}

// Save Graph to LocalStorage
function saveGraph(): void {
  if (!sessionId) return;
  saveGraphToLocalStorage(sessionId, circles, connections);
}

// Load Graph from LocalStorage
function loadGraph(): void {
  if (!sessionId) return;
  loadGraphFromLocalStorage(
    sessionId,
    circles,
    connections,
    // createCircle,
    // createConnection
  );
}

// Create Circle Instance
function createCircle(
  x: number,
  y: number,
  name: string,
  id: string,
  radius: number,
  fillColor: string,
  strokeColor: string,
  strokeWidth: number
): Circle {
  const circle = new Circle(
    x,
    y,
    name,
    id,
    radius,
    fillColor,
    strokeColor,
    strokeWidth
  );
  return circle;
}

// Create Connection Instance
function createConnection(
  circleA: Circle,
  circleB: Circle,
  k: number
): Connection {
  return new Connection(circleA, circleB, k);
}

// Delete All Connections Related to a Circle
function deleteConnectionsForCircle(circle: Circle): void {
  for (let i = connections.length - 1; i >= 0; i--) {
    const connection = connections[i];
    if (connection.circleA === circle || connection.circleB === circle) {
      connections.splice(i, 1);
      actionsHistory.push({ type: "removeConnection", connection });
    }
  }
}

// Handle Collisions Between Circles (Rectangular)
function handleCollisionsRect(): void {
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

      if (
        rectA.left < rectB.right &&
        rectA.right > rectB.left &&
        rectA.top < rectB.bottom &&
        rectA.bottom > rectB.top
      ) {
        const overlapX = Math.min(
          rectA.right - rectB.left,
          rectB.right - rectA.left
        );
        const overlapY = Math.min(
          rectA.bottom - rectB.top,
          rectB.bottom - rectA.top
        );

        if (overlapX < overlapY) {
          const offsetX = overlapX / 2;
          if (rectA.left < rectB.left) {
            circleA.x -= offsetX;
            circleB.x += offsetX;
          } else {
            circleA.x += offsetX;
            circleB.x -= offsetX;
          }
        } else {
          const offsetY = overlapY / 2;
          if (rectA.top < rectB.top) {
            circleA.y -= offsetY;
            circleB.y += offsetY;
          } else {
            circleA.y += offsetY;
            circleB.y -= offsetY;
          }
        }
      }
    }
  }
}

// Check if Two Circles are Connected
function areCirclesConnected(circleA: Circle, circleB: Circle): boolean {
  return connections.some(
    (connection) =>
      (connection.circleA === circleA && connection.circleB === circleB) ||
      (connection.circleA === circleB && connection.circleB === circleA)
  );
}

// Delete Connection if Connected
function deleteConnectionIfConnected(
  circleA: Circle,
  circleB: Circle
): boolean {
  for (let i = 0; i < connections.length; i++) {
    const connection = connections[i];
    if (
      (connection.circleA === circleA && connection.circleB === circleB) ||
      (connection.circleA === circleB && connection.circleB === circleA)
    ) {
      connections.splice(i, 1);
      actionsHistory.push({ type: "removeConnection", connection });
      return true;
    }
  }
  return false;
}

// Save Graph as JSON File
function saveGraphAsJSON(): void {
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
      pageRank: circle.pageRank,
    })),
    connections: connections.map((conn) => ({
      circleA: { id: conn.circleA.id },
      circleB: { id: conn.circleB.id },
      k: conn.k,
    })),
  };
  const jsonData = JSON.stringify(data);
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.download = "graph.json";
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

// Load Graph from JSON File
function loadGraphFromJSON(): void {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsText(file);

    reader.addEventListener("load", () => {
      if (!reader.result) return;
      try {
        const data = JSON.parse(reader.result as string);

        circles = [];
        connections = [];

        data.circles.forEach((circleData: any) => {
          const circle = createCircle(
            circleData.x,
            circleData.y,
            circleData.name,
            circleData.id,
            circleData.radius,
            circleData.fillColor,
            circleData.strokeColor,
            circleData.strokeWidth
          );
          circle.pageRank = circleData.pageRank;
          circles.push(circle);
        });

        data.connections.forEach((connectionData: any) => {
          const circleA = circles.find(
            (circle) => circle.id === connectionData.circleA.id
          );
          const circleB = circles.find(
            (circle) => circle.id === connectionData.circleB.id
          );
          if (circleA && circleB) {
            const connection = createConnection(
              circleA,
              circleB,
              connectionData.k
            );
            connections.push(connection);
          }
        });
      } catch (error) {
        console.error("Failed to load graph:", error);
      }
    });
  });

  input.click();
}

// Reset Canvas
function resetCanvas(): void {
  const confirmation = window.confirm(
    "Do you really want to reset the canvas?"
  );
  if (confirmation) {
    circles = [];
    connections = [];
    actionsHistory.push({ type: "resetCanvas" });
  }
}

// Undo Functionality
function undoLastAction(): void {
  if (actionsHistory.length === 0) return;

  const lastAction = actionsHistory.pop();
  if (!lastAction) return;

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

// Initialize Application
window.onload = () => {
  loadGraph();
  animate();
  setInterval(saveGraph, constants.SAVE_INTERVAL_MS);
  bindUIControls();
};

// Bind UI Controls
function bindUIControls(): void {
  const saveButton = document.getElementById(
    "save-button"
  ) as HTMLButtonElement;
  const loadButton = document.getElementById(
    "load-button"
  ) as HTMLButtonElement;
  const resetButton = document.getElementById(
    "reset-button"
  ) as HTMLButtonElement;
  const placeRandomButton = document.getElementById(
    "place-random-button"
  ) as HTMLButtonElement;
  const saveSessionButton = document.getElementById(
    "save-session-button"
  ) as HTMLButtonElement;
  const sessionIdDropdown = document.getElementById(
    "sessionIdDropdown"
  ) as HTMLSelectElement;

  const sessionIdInput = document.getElementById(
    "sessionIdInput"
  ) as HTMLInputElement;

  // Save Graph Button
  saveButton.addEventListener("click", () => {
    saveGraph();
    alert(`Graph saved with session ID: ${sessionId}`);
  });

  // Load Graph Button
  loadButton.addEventListener("click", () => {
    loadGraph();
    alert(`Graph loaded for session ID: ${sessionId}`);
  });

  // Reset Canvas Button
  resetButton.addEventListener("click", () => {
    resetCanvas();
  });

  // Place Random Circle Button
  placeRandomButton.addEventListener("click", () => {
    generateRandomCircles();
  });

  // Save to Specified Session ID Button
  saveSessionButton.addEventListener("click", saveGraphWithInputSessionId);

  // Event Listener for Dropdown Selection
  sessionIdDropdown.addEventListener("change", onSessionIdSelected);

  // Populate the dropdown
  populateSessionIdDropdown();
}

// Function to save graph to a specified session ID from the input field
function saveGraphWithInputSessionId(): void {
  const sessionIdInputElement = document.getElementById(
    "sessionIdInput"
  ) as HTMLInputElement;
  let sessionIdSpecified = sessionIdInputElement.value.trim();
  if (sessionIdSpecified) {
    if (!sessionIdSpecified.startsWith("graphSession")) {
      sessionIdSpecified = "graphSession" + sessionIdSpecified;
    }
    saveGraphToLocalStorage(sessionIdSpecified, circles, connections);
    alert("Graph saved with session ID: " + sessionIdSpecified);

    // Redirect to the page with the selected sessionId query
    const currentUrl = window.location.href.split("?")[0]; // Get the current URL without query parameters
    window.location.href = `${currentUrl}?sessionId=${sessionIdSpecified}`;
  } else {
    alert("Please enter a session ID.");
  }
}

// Function to handle the selection of a sessionId from the dropdown
function onSessionIdSelected(): void {
  const dropdown = document.getElementById(
    "sessionIdDropdown"
  ) as HTMLSelectElement;
  const selectedSessionId = dropdown.value;
  if (selectedSessionId) {
    // Redirect to the page with the selected sessionId query
    const currentUrl = window.location.href.split("?")[0]; // Get the current URL without query parameters
    window.location.href = `${currentUrl}?sessionId=${selectedSessionId}`;
  }
}

// Populate Session ID Dropdown Function
function populateSessionIdDropdown(): void {
  const dropdown = document.getElementById(
    "sessionIdDropdown"
  ) as HTMLSelectElement;

  // Clear the dropdown first
  dropdown.innerHTML = '<option value="">Select a session ID</option>';

  // Iterate over the localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("graphSession")) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = key;
      dropdown.appendChild(option);
    }
  }
}

// Animation Loop
function animate(): void {
  if (!ctx){return}
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  circles.forEach((circle) => {
    circle.draw(ctx);
  });

  connections.forEach((connection) => {
    connection.draw(ctx);
    connection.applyForces();
  });

  calculatePageRank();
  handleCollisionsRect();

  requestAnimationFrame(animate);
}

// Event Listeners for Canvas Interactions

// Mouse Down Event
canvas.addEventListener("mousedown", (event: MouseEvent) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  let anyCircle = false;
  for (const circle of circles) {
    if (
      isXYinTheRectangle(
        mouseX,
        mouseY,
        circle.x,
        circle.y,
        circle.rectWidth,
        circle.rectHeight
      )
    ) {
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
document.addEventListener("keydown", (event: KeyboardEvent) => {
  // Ctrl + Enter: Add a new circle connected to the selected circle
  if (event.ctrlKey && event.key === "Enter" && selectedCircle) {
    const newCircle = new Circle(
      selectedCircle.x + 50,
      selectedCircle.y + 50,
      "",
      generateUUID(),
      smallerEdge * MEDIUM_RADIUS,
      "blue",
      "black",
      2
    );

    const name = prompt("Enter a name for the circle:", newCircle.name);
    if (name !== null) {
      newCircle.name = name;
    }

    circles.push(newCircle);
    actionsHistory.push({ type: "addCircle", circle: newCircle });

    const connection = new Connection(newCircle, selectedCircle);
    connections.push(connection);
    actionsHistory.push({ type: "addConnection", connection });
    selectedCircle = newCircle;
  }

  // Shift + Enter: Rename the selected circle
  if (event.shiftKey && event.key === "Enter" && selectedCircle) {
    const newName = prompt(
      "Enter a new name for the selected circle:",
      selectedCircle.name
    );
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

      let nextIndex: number;
      if (event.shiftKey) {
        nextIndex = (currentIndex - 1 + circles.length) % circles.length;
      } else {
        nextIndex = (currentIndex + 1) % circles.length;
      }

      selectedCircle = circles[nextIndex];
    }
  }

  // Ctrl + Z: Undo last action
  if (event.ctrlKey && event.key.toLowerCase() === "z") {
    undoLastAction();
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
canvas.addEventListener("contextmenu", (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();

  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  for (const circle of circles) {
    if (
      isXYinTheRectangle(
        mouseX,
        mouseY,
        circle.x,
        circle.y,
        circle.rectWidth,
        circle.rectHeight
      )
    ) {
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
canvas.addEventListener("click", (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();

  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  if (event.shiftKey) {
    for (const circle of circles) {
      if (
        isXYinTheRectangle(
          mouseX,
          mouseY,
          circle.x,
          circle.y,
          circle.rectWidth,
          circle.rectHeight
        )
      ) {
        const color = prompt(
          "Enter a new color for the circle:",
          circle.fillColor
        );
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
canvas.addEventListener("dblclick", (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();

  if (draggingCircle || draggingCircleDB) {
    draggingCircle = null;
    draggingCircleDB = null;
  } else {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    let any = false;

    for (const circle of circles) {
      if (
        isXYinTheRectangle(
          mouseX,
          mouseY,
          circle.x,
          circle.y,
          circle.rectWidth,
          circle.rectHeight
        )
      ) {
        draggingCircleDB = circle;
        draggingCircle = null;
        any = true;
        break;
      }
    }

    if (!any) {
      const circle = new Circle(
        mouseX,
        mouseY,
        "",
        generateUUID(),
        smallerEdge * MEDIUM_RADIUS,
        "blue",
        "black",
        2
      );
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
canvas.addEventListener("mousemove", (event: MouseEvent) => {
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
    if (
      isXYinTheRectangle(
        mouseX,
        mouseY,
        circle.x,
        circle.y,
        circle.rectWidth,
        circle.rectHeight
      )
    ) {
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
canvas.addEventListener("mouseup", (event: MouseEvent) => {
  if (draggingCircleDB) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    let isAny = false;

    for (const circle of circles) {
      if (
        circle !== draggingCircleDB &&
        isXYinTheRectangle(
          mouseX,
          mouseY,
          circle.x,
          circle.y,
          circle.rectWidth,
          circle.rectHeight
        )
      ) {
        if (areCirclesConnected(draggingCircleDB, circle)) {
          deleteConnectionIfConnected(draggingCircleDB, circle);
          actionsHistory.push({
            type: "removeConnection",
            connection: new Connection(draggingCircleDB, circle),
          });
        } else {
          const connection = new Connection(draggingCircleDB, circle);
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
canvas.addEventListener("touchstart", (event: TouchEvent) => {
  if (event.touches.length > 1) return;

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
      if (
        isXYinTheRectangle(
          mouseX,
          mouseY,
          circle.x,
          circle.y,
          circle.rectWidth,
          circle.rectHeight
        )
      ) {
        draggingCircleDB = circle;
        draggingCircle = null;
        any = true;
        event.stopPropagation();
        break;
      }
    }
    if (!any) {
      event.stopPropagation();
      const circle = new Circle(
        mouseX,
        mouseY,
        "",
        generateUUID(),
        smallerEdge * MEDIUM_RADIUS,
        "blue",
        "black",
        2
      );
      const name = prompt("Enter a name for the circle:", circle.name);
      if (name !== null) {
        circle.name = name;
      }
      circles.push(circle);
      actionsHistory.push({ type: "addCircle", circle });
    }
  } else {
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
canvas.addEventListener("touchmove", (event: TouchEvent) => {
  if (event.touches.length > 1) return;

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
canvas.addEventListener("touchend", (event: TouchEvent) => {
  draggingCircle = null;
});
