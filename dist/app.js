// Canvas setup
const canvas = document.getElementById("forceFieldGraph");
const ctx = canvas.getContext("2d");
// Set canvas size to window size
canvas.width = window.innerWidth - 100;
canvas.height = window.innerHeight;
let smaller_edge = Math.min(canvas.width, canvas.height);
// Global state variables
let lastpos = { x: null, y: null };
const actionsHistory = [];
let hoveredCircle = null;
let selectedCircle = null;
let circles = [];
let connections = [];
let edgeDimensions = [];
let currentEdgeDimension = null;
let draggingCircle = null;
let draggingCircle_db = null;
let lastTapTime = 0;
let isDraggingCanvas = false;
// Constants
const SMALL_RADIUS = 1 / 20;
const MEDIUM_RADIUS = 1 / 20;
const LARGE_RADIUS = 1 / 20;
function generateUUID() {
    // Generate a random 16-bit number as a string and pad with leading zeros if necessary
    function random16Bit() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    // Construct the UUID by combining random 16-bit values
    return (random16Bit() + random16Bit() + '-' +
        random16Bit() + '-' +
        '4' + random16Bit().substr(0, 3) + '-' + // Ensure the version is '4'
        (8 + (Math.random() * 4 | 0)).toString(16) + random16Bit().substr(0, 3) + '-' + // Ensure the variant is '8', '9', 'A', or 'B'
        random16Bit() + random16Bit() + random16Bit());
}
function getSessionIdFromUrl(url) {
    // Create a new URL object
    const urlObj = new URL(url);
    // Get the search parameters from the URL
    const params = new URLSearchParams(urlObj.search);
    // Retrieve the value of the 'sessionId' query parameter
    const sessionId = params.get('sessionId');
    return sessionId;
}
let sessionId = getSessionIdFromUrl(window.location.href) || generateUUID();
console.log(sessionId);
function calculatePageRank(damping = 0.85, iterations = 20) {
    const n = circles.length;
    let pageRanks = new Array(n).fill(1 / n);
    let newPageRanks = new Array(n).fill(0);
    for (let iter = 0; iter < iterations; iter++) {
        // Reset new page ranks
        newPageRanks.fill(0);
        // Calculate new page ranks
        for (let i = 0; i < n; i++) {
            const circle = circles[i];
            const outgoingConnections = connections.filter(conn => conn.circleA === circle);
            if (outgoingConnections.length > 0) {
                const rank = pageRanks[i] / outgoingConnections.length;
                for (const conn of outgoingConnections) {
                    const targetIndex = circles.indexOf(conn.circleB);
                    newPageRanks[targetIndex] += rank;
                }
            }
        }
        // Apply damping factor and normalize
        for (let i = 0; i < n; i++) {
            newPageRanks[i] = (1 - damping) / n + damping * newPageRanks[i];
        }
        // Update page ranks
        pageRanks = [...newPageRanks];
    }
    // Assign page ranks to circles
    for (let i = 0; i < n; i++) {
        circles[i].pageRank = pageRanks[i];
    }
}
// Resize canvas when window size changes
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth - 100;
    canvas.height = window.innerHeight;
    smaller_edge = Math.min(canvas.width, canvas.height);
});
function generateRandomCircles() {
    for (const circle of circles) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        circle.x = x;
        circle.y = y;
    }
}
function saveGraphToLocalStorage(sessionIdSpecified = null) {
    let currentSessionId = getSessionIdFromUrl(window.location.href) || generateUUID();
    const finalSessionId = sessionIdSpecified || currentSessionId;
    const data = {
        circles: circles.map(circle => circle.toData()),
        connections: connections.map(connection => connection.toData()),
    };
    console.log(finalSessionId);
    const jsonData = JSON.stringify(data);
    localStorage.setItem(finalSessionId, jsonData);
}
function calculateElectrostaticForceAndMove() {
    const charge = 1.0; // Charge of each circle
    const kInput = document.getElementById('k-input');
    const k = parseFloat((kInput === null || kInput === void 0 ? void 0 : kInput.value) || '0');
    for (let i = 0; i < circles.length; i++) {
        let totalForceX = 0;
        let totalForceY = 0;
        const circleA = circles[i];
        for (let j = 0; j < circles.length; j++) {
            if (i === j)
                continue; // Skip calculating force for the same circle
            const circleB = circles[j];
            const dx = circleB.x - circleA.x;
            const dy = circleB.y - circleA.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const forceMagnitude = -(k * charge * charge) / (distance * distance);
            const angle = Math.atan2(dy, dx);
            const forceX = forceMagnitude * Math.cos(angle);
            const forceY = forceMagnitude * Math.sin(angle);
            totalForceX += forceX;
            totalForceY += forceY;
        }
        // Update circle position based on the total force
        circleA.x += totalForceX;
        circleA.y += totalForceY;
    }
}
function loadGraphFromLocalStorage() {
    const jsonData = localStorage.getItem(sessionId);
    if (jsonData) {
        const data = JSON.parse(jsonData);
        circles.length = 0;
        connections.length = 0;
        edgeDimensions.length = 0;
        // Load edge dimensions first
        if (data.edgeDimensions) {
            for (const dimData of data.edgeDimensions) {
                const dimension = new EdgeDimension(dimData.name, dimData.color, dimData.isVisible);
                dimension.id = dimData.id; // Restore original ID
                edgeDimensions.push(dimension);
            }
        }
        // Set current edge dimension
        if (data.currentEdgeDimensionId) {
            currentEdgeDimension = edgeDimensions.find(dim => dim.id === data.currentEdgeDimensionId) || null;
        }
        // If no dimensions or current dimension not found, initialize default
        if (!currentEdgeDimension) {
            initializeDefaultDimension();
        }
        for (const circleData of data.circles) {
            const circle = new Circle(circleData.x, circleData.y, circleData.name, circleData.id, circleData.radius, circleData.fillColor, circleData.strokeColor, circleData.strokeWidth);
            circles.push(circle);
        }
        for (const connectionData of data.connections) {
            const circleA = circles.find((circle) => circle.id === connectionData.circleA.id);
            const circleB = circles.find((circle) => circle.id === connectionData.circleB.id);
            // Find dimension for this connection
            let connectionDimension = null;
            if (connectionData.dimension && connectionData.dimension.id) {
                connectionDimension = edgeDimensions.find(dim => dim.id === connectionData.dimension.id) || null;
            }
            if (circleA && circleB) {
                const connection = new Connection(circleA, circleB, connectionData.k, connectionDimension);
                connections.push(connection);
            }
        }
    }
}
function deleteConnectionsForCircle(circle) {
    for (let i = connections.length - 1; i >= 0; i--) {
        const connection = connections[i];
        if (connection.circleA === circle || connection.circleB === circle) {
            connections.splice(i, 1);
            actionsHistory.push({ type: "remove_connection", data: connection });
        }
    }
}
function handleCollisions() {
    for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
            const circleA = circles[i];
            const circleB = circles[j];
            const dx = circleB.x - circleA.x;
            const dy = circleB.y - circleA.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = circleA.radius + circleB.radius;
            if (distance < minDistance) {
                const overlap = minDistance - distance;
                const angle = Math.atan2(dy, dx);
                const offsetX = overlap * Math.cos(angle) * 0.5;
                const offsetY = overlap * Math.sin(angle) * 0.5;
                circleA.x -= offsetX;
                circleA.y -= offsetY;
                circleB.x += offsetX;
                circleB.y += offsetY;
            }
        }
    }
}
function handleCollisionsRect() {
    for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
            const circleA = circles[i];
            const circleB = circles[j];
            // 各長方形の境界を計算
            const rectA = {
                left: circleA.x - (circleA.rectWidth || 0) / 2,
                right: circleA.x + (circleA.rectWidth || 0) / 2,
                top: circleA.y - (circleA.rectHeight || 0) / 2,
                bottom: circleA.y + (circleA.rectHeight || 0) / 2,
            };
            const rectB = {
                left: circleB.x - (circleB.rectWidth || 0) / 2,
                right: circleB.x + (circleB.rectWidth || 0) / 2,
                top: circleB.y - (circleB.rectHeight || 0) / 2,
                bottom: circleB.y + (circleB.rectHeight || 0) / 2,
            };
            // 衝突判定：AとBの長方形が重なっているか
            if (rectA.left < rectB.right &&
                rectA.right > rectB.left &&
                rectA.top < rectB.bottom &&
                rectA.bottom > rectB.top) {
                // 衝突が発生した場合、どの方向に押し出すかを決定
                const overlapX = Math.min(rectA.right - rectB.left, rectB.right - rectA.left);
                const overlapY = Math.min(rectA.bottom - rectB.top, rectB.bottom - rectA.top);
                if (overlapX < overlapY) {
                    const offsetX = overlapX / 2;
                    if (circleA.x < circleB.x) {
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
                    if (circleA.y < circleB.y) {
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
function areCirclesConnected(circleA, circleB) {
    for (const connection of connections) {
        if ((connection.circleA === circleA && connection.circleB === circleB)) {
            return true;
        }
    }
    return false;
}
function deleteConnectionIfConnected(circleA, circleB) {
    for (let i = 0; i < connections.length; i++) {
        const connection = connections[i];
        if ((connection.circleA === circleA && connection.circleB === circleB) ||
            (connection.circleA === circleB && connection.circleB === circleA)) {
            connections.splice(i, 1);
            actionsHistory.push({ type: "remove_connection", data: connection });
            return true;
        }
    }
    return false;
}
function saveGraph() {
    const data = {
        circles: circles.map(circle => circle.toData()),
        connections: connections.map(connection => connection.toData()),
    };
    const jsonData = JSON.stringify(data);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "graph.json";
    link.href = url;
    link.click();
}
function loadGraph() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.addEventListener("change", () => {
        var _a;
        const file = (_a = input.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.readAsText(file);
        reader.addEventListener("load", () => {
            const data = JSON.parse(reader.result);
            circles.length = 0;
            connections.length = 0;
            for (const circleData of data.circles) {
                const circle = new Circle(circleData.x, circleData.y, circleData.name, circleData.id, circleData.radius, circleData.fillColor, circleData.strokeColor, circleData.strokeWidth);
                circles.push(circle);
            }
            for (const connectionData of data.connections) {
                const circleA = circles.find((circle) => circle.id === connectionData.circleA.id);
                const circleB = circles.find((circle) => circle.id === connectionData.circleB.id);
                if (circleA && circleB) {
                    const connection = new Connection(circleA, circleB, connectionData.k);
                    connections.push(connection);
                }
            }
        });
    });
    input.click();
}
function calculateAdaptiveFontSize(radius, name) {
    const maxFontSize = smaller_edge / 10;
    const maxNameWidth = radius * 2;
    let low = 1;
    let high = maxFontSize;
    let fontSize = maxFontSize;
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        ctx.font = `${mid}px Arial`;
        const nameWidth = ctx.measureText(name).width;
        if (nameWidth <= maxNameWidth) {
            fontSize = mid; // 現在のフォントサイズが適切
            low = mid + 1; // より大きなフォントサイズを試す
        }
        else {
            high = mid - 1; // フォントサイズが大きすぎるので小さくする
        }
    }
    return fontSize;
}
class EdgeDimension {
    constructor(name, color = "#000000", isVisible = true) {
        this.id = generateUUID();
        this.name = name;
        this.color = color;
        this.isVisible = isVisible;
    }
    toData() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            isVisible: this.isVisible,
        };
    }
}
// Canvas offset for relative positioning
let canvasOffsetGlobal = { x: 0, y: 0 };
class RectangleShape {
    constructor(x, y, width, height, name = "", id = "") {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.name = name;
        this.id = id;
    }
    draw() {
        ctx.fillStyle = "blue";
        ctx.fillRect(this.x + canvasOffsetGlobal.x, this.y + canvasOffsetGlobal.y, this.width, this.height);
        ctx.strokeStyle = "black";
        ctx.strokeRect(this.x + canvasOffsetGlobal.x, this.y + canvasOffsetGlobal.y, this.width, this.height);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.name, this.x + this.width / 2 + canvasOffsetGlobal.x, this.y + this.height / 2 + canvasOffsetGlobal.y);
    }
}
class Circle {
    constructor(x, y, name = "", id = "", radius = smaller_edge * MEDIUM_RADIUS, fillColor = "blue", strokeColor = "black", strokeWidth = 2) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.fillColor = fillColor;
        this.strokeColor = strokeColor;
        this.strokeWidth = strokeWidth;
        this.name = name;
        this.id = id;
    }
    draw() {
        if (this.pageRank) {
            const minRadius = smaller_edge * SMALL_RADIUS;
            const maxRadius = smaller_edge * LARGE_RADIUS;
            this.radius = minRadius + (maxRadius - minRadius) * this.pageRank * circles.length;
        }
        console.log(this.pageRank);
        console.log(2);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fillStyle = this.fillColor;
        ctx.fill();
        ctx.lineWidth = this.strokeWidth;
        ctx.strokeStyle = this.strokeColor;
        ctx.stroke();
        this.drawCircleName();
        // ページランクを表示
        if (this.pageRank) {
            ctx.fillStyle = "black";
            ctx.font = "12px Arial";
            ctx.fillText(`Rank: ${this.pageRank.toFixed(3)}`, this.x, this.y + this.radius + 15);
        }
    }
    setColor(color) {
        this.fillColor = color;
    }
    drawCircleName() {
        console.log(this.x);
        if (this.name) {
            const fontSize = calculateAdaptiveFontSize(this.radius, this.name);
            ctx.font = `${fontSize}px Arial`;
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.name, this.x, this.y);
        }
    }
    toData() {
        return {
            id: this.id,
            name: this.name,
            x: this.x,
            y: this.y,
            radius: this.radius,
            fillColor: this.fillColor,
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth,
            pageRank: this.pageRank,
            rectWidth: this.rectWidth,
            rectHeight: this.rectHeight,
        };
    }
}
class Connection {
    constructor(circleA, circleB, k = 0.01, dimension = null) {
        this.circleA = circleA;
        this.circleB = circleB;
        this.k = 0.0;
        this.dimension = dimension || currentEdgeDimension;
    }
    draw() {
        // Skip drawing if dimension is not visible
        if (this.dimension && !this.dimension.isVisible) {
            console.log('Skipping connection draw - dimension not visible:', this.dimension.name);
            return;
        }
        // If connection has no dimension, assign current dimension
        if (!this.dimension && currentEdgeDimension) {
            this.dimension = currentEdgeDimension;
            console.log('Assigned current dimension to connection:', this.dimension.name);
        }
        this.restLength = ((this.circleA.rectWidth || 0) + (this.circleB.rectWidth || 0)) / 2;
        const angle = Math.atan2(this.circleB.y - this.circleA.y, this.circleB.x - this.circleA.x);
        // 長方形Aの接点を計算
        const halfWidthA = (this.circleA.rectWidth || 0) / 2;
        const halfHeightA = (this.circleA.rectHeight || 0) / 2;
        const startX = this.circleA.x + halfWidthA * Math.cos(angle);
        const startY = this.circleA.y + halfHeightA * Math.sin(angle);
        // 長方形Bの接点を計算
        const halfWidthB = (this.circleB.rectWidth || 0) / 2;
        const halfHeightB = (this.circleB.rectHeight || 0) / 2;
        const endX = this.circleB.x - halfWidthB * Math.cos(angle);
        const endY = this.circleB.y - halfHeightB * Math.sin(angle);
        // Use dimension color if available
        const strokeColor = this.dimension ? this.dimension.color : "#000";
        // 線を描画
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = strokeColor;
        ctx.stroke();
        // 矢印の頭を描画
        const angleline = Math.atan2(-startY + endY, -startX + endX);
        this.drawArrowhead(endX, endY, angleline, strokeColor);
    }
    drawArrowhead(x, y, angle, color = "#000") {
        const arrowSize = 20; // Size of the arrowhead
        ctx.beginPath();
        ctx.moveTo(x - arrowSize * Math.cos(angle - Math.PI / 6), y - arrowSize * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x, y);
        ctx.lineTo(x - arrowSize * Math.cos(angle + Math.PI / 6), y - arrowSize * Math.sin(angle + Math.PI / 6));
        ctx.strokeStyle = color;
        ctx.stroke();
    }
    toData() {
        var _a;
        return {
            circleA: this.circleA.toData(),
            circleB: this.circleB.toData(),
            k: this.k,
            dimension: (_a = this.dimension) === null || _a === void 0 ? void 0 : _a.toData(),
        };
    }
    distanceBetween(circleA, circleB) {
        return Math.sqrt((circleB.x - circleA.x) ** 2 + (circleB.y - circleA.y) ** 2);
    }
    applyForces() {
        this.restLength = Math.sqrt(((this.circleA.rectWidth || 0) * (this.circleB.rectWidth || 0)) / 2);
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
function resetCanvas() {
    const confirmation = window.confirm("Do you really want to reset the canvas?");
    if (confirmation) {
        circles = [];
        connections = [];
    }
}
// Event listeners
canvas.addEventListener("mousedown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    let anyCircle = false;
    for (const circle of circles) {
        const dx = mouseX - circle.x;
        const dy = mouseY - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (isXYinTheRectangle(circle, mouseX, mouseY)) {
            selectedCircle = circle;
            draggingCircle = circle;
            if (draggingCircle_db) {
                draggingCircle = null;
            }
            anyCircle = true;
            break;
        }
    }
    if (!anyCircle) {
        isDraggingCanvas = true;
        lastpos.x = mouseX;
        lastpos.y = mouseY;
    }
});
document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "Enter" && selectedCircle) {
        const newCircle = new Circle(selectedCircle.x + 50, selectedCircle.y + 50, "", Date.now().toString());
        const name = prompt("Enter a name for the circle:", newCircle.name);
        if (name !== null) {
            newCircle.name = name;
        }
        circles.push(newCircle);
        actionsHistory.push({ type: "add_circle", data: newCircle });
        const connection = new Connection(newCircle, selectedCircle);
        connections.push(connection);
        selectedCircle = newCircle;
    }
});
document.addEventListener("keydown", (event) => {
    if (event.shiftKey && event.key === "Enter" && selectedCircle) {
        const newName = prompt("Enter a new name for the selected circle:", selectedCircle.name);
        if (newName !== null) {
            const oldName = selectedCircle.name;
            selectedCircle.name = newName;
            actionsHistory.push({ type: "add_circle", data: { circle: selectedCircle, oldName, newName } });
        }
    }
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
        event.preventDefault();
        if (circles.length > 0) {
            const currentIndex = selectedCircle ? circles.indexOf(selectedCircle) : -1;
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
});
// Override Circle prototype draw method
Circle.prototype.draw = function () {
    const padding = 10;
    const computedStyle = getComputedStyle(document.body);
    const fontSize = parseInt(computedStyle.fontSize) * 1.5;
    const fontFamily = computedStyle.fontFamily;
    const lineHeight = fontSize * 1.2;
    ctx.font = `${fontSize}px ${fontFamily}`;
    const words = this.name.split(' ');
    let lines = [];
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        lines.push(currentLine);
        currentLine = word;
    }
    lines.push(currentLine);
    const rectWidth = ctx.measureText(this.name).width + 2 * padding;
    const rectHeight = lines.length * lineHeight + 2 * padding;
    this.rectWidth = rectWidth;
    this.rectHeight = rectHeight;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, rectWidth / 2, rectHeight / 2, 0, 0, 2 * Math.PI);
    ctx.fillStyle = this.fillColor;
    ctx.fill();
    ctx.lineWidth = this.strokeWidth;
    ctx.strokeStyle = this === draggingCircle_db ? "green" : (this === selectedCircle ? "red" : this.strokeColor);
    ctx.stroke();
    ctx.closePath();
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    lines.forEach((line, index) => {
        const y = this.y - (lines.length - 1) * lineHeight / 2 + index * lineHeight;
        ctx.fillText(line, this.x, y);
    });
};
canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    let clickedOnCircle = false;
    for (const circle of circles) {
        const dx = mouseX - circle.x;
        const dy = mouseY - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (isXYinTheRectangle(circle, mouseX, mouseY)) {
            const name = prompt("Enter a name for the circle:", circle.name);
            if (name !== null) {
                circle.name = name;
            }
            clickedOnCircle = true;
            break;
        }
    }
    if (!clickedOnCircle) {
        showEdgeDimensionContextMenu(event.clientX, event.clientY);
    }
});
canvas.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    if (event.shiftKey) {
        for (const circle of circles) {
            const dx = mouseX - circle.x;
            const dy = mouseY - circle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (isXYinTheRectangle(circle, mouseX, mouseY)) {
                const color = prompt("Enter a new color for the circle:", circle.fillColor);
                if (color !== null) {
                    circle.setColor(color);
                }
                break;
            }
        }
    }
});
canvas.addEventListener("dblclick", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (draggingCircle || draggingCircle_db) {
        draggingCircle = null;
        draggingCircle_db = null;
    }
    else {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        let any = false;
        for (const circle of circles) {
            const dx = mouseX - circle.x;
            const dy = mouseY - circle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (isXYinTheRectangle(circle, mouseX, mouseY)) {
                draggingCircle_db = circle;
                draggingCircle = null;
                console.log("testt");
                any = true;
                break;
            }
        }
        if (!any) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            const circle = new Circle(mouseX, mouseY, "", Date.now().toString());
            const name = prompt('Enter a name for the circle:', circle.name);
            if (name !== null) {
                circle.name = name;
            }
            circles.push(circle);
            actionsHistory.push({ type: 'add_circle', data: circle });
        }
    }
});
canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    if (draggingCircle) {
        console.log("mov");
        draggingCircle.x = mouseX;
        draggingCircle.y = mouseY;
        return;
    }
    hoveredCircle = null;
    for (const circle of circles) {
        const dx = mouseX - circle.x;
        const dy = mouseY - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (isXYinTheRectangle(circle, mouseX, mouseY)) {
            hoveredCircle = circle;
            break;
        }
    }
    if (isDraggingCanvas) {
        const diff_x = (lastpos.x || 0) - mouseX;
        const diff_y = (lastpos.y || 0) - mouseY;
        for (let circle of circles) {
            circle.x = circle.x - diff_x;
            circle.y = circle.y - diff_y;
        }
        lastpos.x = mouseX;
        lastpos.y = mouseY;
    }
});
canvas.addEventListener("mouseup", (event) => {
    if (draggingCircle_db) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        let isany = false;
        for (const circle of circles) {
            if (circle !== draggingCircle_db) {
                if (isXYinTheRectangle(circle, mouseX, mouseY)) {
                    if (areCirclesConnected(draggingCircle_db, circle)) {
                        deleteConnectionIfConnected(draggingCircle_db, circle);
                        draggingCircle_db = null;
                    }
                    else {
                        const connection = new Connection(draggingCircle_db, circle);
                        connections.push(connection);
                        draggingCircle_db = null;
                    }
                    isany = true;
                    break;
                }
            }
        }
    }
    draggingCircle = null;
    draggingCircle_db = null;
    isDraggingCanvas = false;
});
document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "z") {
        if (actionsHistory.length > 0) {
            const lastAction = actionsHistory.pop();
            if (!lastAction)
                return;
            if (lastAction.type === "add_circle") {
                const circleIndex = circles.indexOf(lastAction.data);
                const circle = circles[circleIndex];
                deleteConnectionsForCircle(circle);
                if (circleIndex !== -1) {
                    circles.splice(circleIndex, 1);
                }
            }
            else if (lastAction.type === "remove_connection") {
                connections.push(lastAction.data);
            }
        }
    }
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Delete" && hoveredCircle) {
        const index = circles.indexOf(hoveredCircle);
        circles.splice(index, 1);
        deleteConnectionsForCircle(hoveredCircle);
        actionsHistory.push({ type: "remove_circle", data: hoveredCircle });
        hoveredCircle = null;
    }
});
function isXYinTheRectangle(circle, x, y) {
    const in_x = Math.abs(circle.x - x) < (circle.rectWidth || 0) / 2;
    const in_y = Math.abs(circle.y - y) < (circle.rectHeight || 0) / 2;
    return in_x && in_y;
}
function isXYinTheCircle(circle, x, y) {
    const dx = circle.x - x;
    const dy = circle.y - y;
    return Math.sqrt(dx * dx + dy * dy) < circle.radius;
}
canvas.addEventListener("touchstart", (event) => {
    if (event.touches.length > 1) {
        return;
    }
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;
    if (tapLength < 300 && tapLength > 0) {
        let any = false;
        for (const circle of circles) {
            if (isXYinTheRectangle(circle, mouseX, mouseY)) {
                draggingCircle_db = circle;
                draggingCircle = null;
                any = true;
                event.stopPropagation();
                break;
            }
        }
        if (!any) {
            event.stopPropagation();
            const circle = new Circle(mouseX, mouseY, "", Date.now().toString());
            const name = prompt('Enter a name for the circle:', circle.name);
            if (name !== null) {
                circle.name = name;
            }
            circles.push(circle);
            actionsHistory.push({ type: 'add_circle', data: circle });
        }
    }
    else {
        for (const circle of circles) {
            const dx = mouseX - circle.x;
            const dy = mouseY - circle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= circle.radius) {
                draggingCircle = circle;
                event.stopPropagation();
                break;
            }
        }
    }
    lastTapTime = currentTime;
});
canvas.addEventListener("touchmove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;
    if (draggingCircle) {
        draggingCircle.x = mouseX;
        draggingCircle.y = mouseY;
    }
});
canvas.addEventListener("touchend", (event) => {
    draggingCircle = null;
});
let frameCount = 0;
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const circle of circles) {
        circle.draw();
    }
    for (const connection of connections) {
        connection.draw();
        connection.applyForces();
    }
    handleCollisionsRect();
    requestAnimationFrame(animate);
}
window.onload = () => {
    initializeDefaultDimension();
    loadGraphFromLocalStorage();
    populateSessionIdDropdown();
};
animate();
setInterval(saveGraphToLocalStorage, 1000);
function populateSessionIdDropdown() {
    const dropdown = document.getElementById('sessionIdDropdown');
    dropdown.innerHTML = '<option value="">Select a session ID</option>';
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("graphSession")) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key;
            dropdown.appendChild(option);
        }
    }
}
function onSessionIdSelected() {
    const dropdown = document.getElementById('sessionIdDropdown');
    const selectedSessionId = dropdown.value;
    if (selectedSessionId) {
        const currentUrl = window.location.href.split('?')[0];
        window.location.href = `${currentUrl}?sessionId=${selectedSessionId}`;
    }
}
function saveGraphWithInputSessionId() {
    const sessionIdInput = document.getElementById('sessionIdInput');
    let sessionIdValue = sessionIdInput.value;
    if (sessionIdValue) {
        if (!sessionIdValue.startsWith("graphSession")) {
            sessionIdValue = "graphSession" + sessionIdValue;
        }
        saveGraphToLocalStorage(sessionIdValue);
        alert('Graph saved with session ID: ' + sessionIdValue);
        const currentUrl = window.location.href.split('?')[0];
        window.location.href = `${currentUrl}?sessionId=${sessionIdValue}`;
        populateSessionIdDropdown();
    }
    else {
        alert('Please enter a session ID.');
    }
}
// Override saveGraphToLocalStorage to include edge dimensions
function saveGraphToLocalStorageWithDimensions(sessionIdSpecified = null) {
    const idToUse = sessionIdSpecified || sessionId;
    const data = {
        circles: circles.map(circle => circle.toData()),
        connections: connections.map(connection => connection.toData()),
        edgeDimensions: edgeDimensions.map(dim => dim.toData()),
        currentEdgeDimensionId: currentEdgeDimension ? currentEdgeDimension.id : null,
    };
    const jsonData = JSON.stringify(data);
    localStorage.setItem(idToUse, jsonData);
}
function initializeDefaultDimension() {
    if (edgeDimensions.length === 0) {
        const defaultDimension = new EdgeDimension("Default", "#000000", true);
        edgeDimensions.push(defaultDimension);
        currentEdgeDimension = defaultDimension;
    }
}
function showEdgeDimensionContextMenu(x, y) {
    hideEdgeDimensionContextMenu();
    const menu = document.createElement('div');
    menu.id = 'edge-dimension-context-menu';
    menu.style.position = 'absolute';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.style.backgroundColor = 'white';
    menu.style.border = '1px solid #ccc';
    menu.style.borderRadius = '4px';
    menu.style.padding = '5px 0';
    menu.style.boxShadow = '2px 2px 10px rgba(0,0,0,0.2)';
    menu.style.zIndex = '1000';
    menu.style.fontSize = '14px';
    menu.style.minWidth = '200px';
    const helpOption = document.createElement('div');
    helpOption.innerHTML = '<small>Click: Select | Shift+Click: Toggle visibility</small>';
    helpOption.style.padding = '5px 15px';
    helpOption.style.fontSize = '11px';
    helpOption.style.color = '#666';
    helpOption.style.borderBottom = '1px solid #eee';
    helpOption.style.backgroundColor = '#f9f9f9';
    menu.appendChild(helpOption);
    const createOption = document.createElement('div');
    createOption.textContent = 'Create Edge Dimension';
    createOption.style.padding = '8px 15px';
    createOption.style.cursor = 'pointer';
    createOption.style.borderBottom = '1px solid #eee';
    createOption.addEventListener('mouseenter', () => createOption.style.backgroundColor = '#f0f0f0');
    createOption.addEventListener('mouseleave', () => createOption.style.backgroundColor = 'transparent');
    createOption.addEventListener('click', () => {
        createNewEdgeDimension();
        hideEdgeDimensionContextMenu();
    });
    menu.appendChild(createOption);
    edgeDimensions.forEach(dimension => {
        const dimensionOption = document.createElement('div');
        const isSelected = dimension === currentEdgeDimension;
        const visibilityText = dimension.isVisible ? '👁️' : '🙈';
        dimensionOption.innerHTML = `${visibilityText} ${dimension.name} ${isSelected ? '✓' : ''}`;
        dimensionOption.style.padding = '8px 15px';
        dimensionOption.style.cursor = 'pointer';
        dimensionOption.style.color = dimension.color;
        dimensionOption.style.fontWeight = isSelected ? 'bold' : 'normal';
        dimensionOption.style.opacity = dimension.isVisible ? '1.0' : '0.5';
        dimensionOption.addEventListener('mouseenter', () => dimensionOption.style.backgroundColor = '#f0f0f0');
        dimensionOption.addEventListener('mouseleave', () => dimensionOption.style.backgroundColor = 'transparent');
        dimensionOption.addEventListener('click', (e) => {
            if (e.shiftKey) {
                dimension.isVisible = !dimension.isVisible;
                console.log('Toggled dimension visibility:', dimension.name, 'isVisible:', dimension.isVisible);
            }
            else {
                currentEdgeDimension = dimension;
                console.log('Selected dimension:', dimension.name);
            }
            hideEdgeDimensionContextMenu();
        });
        menu.appendChild(dimensionOption);
    });
    document.body.appendChild(menu);
    setTimeout(() => {
        document.addEventListener('click', hideEdgeDimensionContextMenu, { once: true });
    }, 100);
}
function hideEdgeDimensionContextMenu() {
    const existingMenu = document.getElementById('edge-dimension-context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
}
function createNewEdgeDimension() {
    const name = prompt('Enter name for new edge dimension:');
    if (name && name.trim()) {
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#FFFF00', '#00FFFF', '#FFA500', '#800080'];
        const color = colors[edgeDimensions.length % colors.length];
        const newDimension = new EdgeDimension(name.trim(), color, true);
        edgeDimensions.push(newDimension);
        currentEdgeDimension = newDimension;
    }
}
// Expose functions to global scope for HTML onclick handlers
window.resetCanvas = resetCanvas;
window.saveGraph = saveGraph;
window.loadGraph = loadGraph;
window.generateRandomCircles = generateRandomCircles;
window.saveGraphWithInputSessionId = saveGraphWithInputSessionId;
window.onSessionIdSelected = onSessionIdSelected;
export {};
//# sourceMappingURL=app.js.map