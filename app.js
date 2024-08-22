const canvas = document.getElementById("forceFieldGraph");
const ctx = canvas.getContext("2d");

// Set canvas size to window size
canvas.width = window.innerWidth - 100;
canvas.height = window.innerHeight;
let smaller_edge = Math.min(canvas.width, canvas.height);

let lastpos = {x:null,y:null}

// Resize canvas when window size changes
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth - 100;
  canvas.height = window.innerHeight;
  smaller_edge = Math.min(canvas.width, canvas.height);
  // console.log(smaller_edge)
});

const actionsHistory = [];
let hoveredCircle = null;
let selectedCircle = null;

function generateRandomCircles() {
  for (const circle of circles) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    circle.x = x;
    circle.y = y;
  }
}
// Function to save the graph data to local storage
function saveGraphToLocalStorage() {
  const data = {
    circles: circles,
    connections: connections,
  };
  const jsonData = JSON.stringify(data);
  localStorage.setItem("graphData", jsonData);
}

// Function to load the graph data from local storage
function loadGraphFromLocalStorage() {
  const jsonData = localStorage.getItem("graphData");
  if (jsonData) {
    const data = JSON.parse(jsonData);

    circles.length = 0;
    connections.length = 0;

    for (const circleData of data.circles) {
      const circle = new Circle(
        circleData.x,
        circleData.y,
        name = circleData.name,
        id = circleData.id,
        circleData.radius,
        circleData.fillColor,
        circleData.strokeColor,
        circleData.strokeWidth
      );
      circle.name = circleData.name;
      circles.push(circle);
    }

    for (const connectionData of data.connections) {
      const circleA = circles.find(
        (circle) => circle.id === connectionData.circleA.id
      );
      const circleB = circles.find(
        (circle) => circle.id === connectionData.circleB.id
      );
      const connection = new Connection(circleA, circleB, connectionData.k);
      connections.push(connection);
    }
  }
}

function deleteConnectionsForCircle(circle) {
  for (let i = connections.length - 1; i >= 0; i--) {
    const connection = connections[i];
    if (connection.circleA === circle || connection.circleB === circle) {
      connections.splice(i, 1);
      actionsHistory.push({ type: "removeConnection", connection });
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

function areCirclesConnected(circleA, circleB) {
  for (const connection of connections) {
    if (
      (connection.circleA === circleA && connection.circleB === circleB) 
      // ||
      // (connection.circleA === circleB && connection.circleB === circleA)
    ) {
      return true;
    }
  }

  return false;
}

function deleteConnectionIfConnected(circleA, circleB) {
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
function saveGraph() {
  const data = {
    circles: circles,
    connections: connections,
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
    const file = input.files[0];
    const reader = new FileReader();
    reader.readAsText(file);

    reader.addEventListener("load", () => {
      const data = JSON.parse(reader.result);

      circles.length = 0;
      connections.length = 0;

      for (const circleData of data.circles) {
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
      }

      for (const connectionData of data.connections) {
        const circleA = circles.find(
          (circle) => circle.id === connectionData.circleA.id
        );
        const circleB = circles.find(
          (circle) => circle.id === connectionData.circleB.id
        );
        const connection = new Connection(circleA, circleB, connectionData.k);
        connections.push(connection);
      }
    });
  });

  input.click();
}

function calculateAdaptiveFontSize(radius, name) {
  const maxFontSize = smaller_edge/10;
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
      low = mid + 1;  // より大きなフォントサイズを試す
    } else {
      high = mid - 1; // フォントサイズが大きすぎるので小さくする
    }
  }

  return fontSize;
}

class Rectangle {
  constructor(x, y, width, height, name = "", id = "") {
    Object.assign(this, { x, y, width, height, name, id });
  }
  draw() {
    ctx.fillStyle = "blue";
    ctx.fillRect(this.x + canvasOffset.x, this.y + canvasOffset.y, this.width, this.height);
    ctx.strokeStyle = "black";
    ctx.strokeRect(this.x + canvasOffset.x, this.y + canvasOffset.y, this.width, this.height);
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.name, this.x + this.width / 2 + canvasOffset.x, this.y + this.height / 2 + canvasOffset.y);
  }
}

class Circle {
  constructor(
    x,
    y,
    name = "",
    id = "",
    radius = smaller_edge / 20,
    fillColor = "blue",
    strokeColor = "black",
    strokeWidth = 2

  ) {
    this.x = x;
    this.y = y;
    console.log(radius);
    this.radius = radius;
    this.fillColor = fillColor;
    this.strokeColor = strokeColor;
    this.strokeWidth = strokeWidth;
    this.name = name;
    this.id = id
    // const name = prompt('Enter a name for the circle:', this.name);
    // if (name !== null) {
    //   this.name = name;
    // }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = this.fillColor;
    ctx.fill();
    ctx.lineWidth = this.strokeWidth;
    ctx.strokeStyle = this.strokeColor;
    ctx.stroke();
    this.drawCircleName();
  }
  setColor(color) {
    this.fillColor = color;
  }
  drawCircleName() {
    if (this.name) {
      const fontSize = calculateAdaptiveFontSize(this.radius, this.name);
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.name, this.x, this.y);
    }
  }
}
class Connection {
  constructor(circleA, circleB, k = 0.01) {
    this.circleA = circleA;
    this.circleB = circleB;
    this.k = k;
    this.restLength = ((circleA.radius + circleB.radius) / 2) * 3;
  }

  draw() {
    const angle = Math.atan2(
      this.circleB.y - this.circleA.y,
      this.circleB.x - this.circleA.x
    );

    // Calculate the tangent points
    const startX = this.circleA.x + this.circleA.radius * Math.cos(angle);
    const startY = this.circleA.y + this.circleA.radius * Math.sin(angle);
    const endX = this.circleB.x - this.circleB.radius * Math.cos(angle);
    const endY = this.circleB.y - this.circleB.radius * Math.sin(angle);

    // Draw the line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = "#000";
    ctx.stroke();

    // Draw the arrowhead at the end of the connection
    this.drawArrowhead(endX, endY, angle);
  }

  drawArrowhead(x, y, angle) {
    const arrowSize = 10; // Size of the arrowhead

    ctx.beginPath();
    ctx.moveTo(
      x - arrowSize * Math.cos(angle - Math.PI / 6),
      y - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(x, y);
    ctx.lineTo(
      x - arrowSize * Math.cos(angle + Math.PI / 6),
      y - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.strokeStyle = "#000";
    ctx.stroke();
  }

  distanceBetween(circleA, circleB) {
    return Math.sqrt(
      (circleB.x - circleA.x) ** 2 + (circleB.y - circleA.y) ** 2
    );
  }

  applyForces() {
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



let circles = [];
let connections = [];
let draggingCircle = null;
let draggingCircle_db = null;

function resetCanvas() {
  const confirmation = window.confirm(
    "Do you really want to reset the canvas?"
  );
  if (confirmation) {
    // Call the function
    circles = [];
    connections = [];
  }
}
let isDraggingCanvas = false;
canvas.addEventListener("mousedown", (event) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  
  anyCircle = false;
  for (const circle of circles) {
    const dx = mouseX - circle.x;
    const dy = mouseY - circle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= circle.radius) {
      selectedCircle = circle;
      draggingCircle = circle;
      if (draggingCircle_db) {
        draggingCircle = null;
      }
      anyCircle = true;
      break;
    }
  }
  if (!anyCircle){
    isDraggingCanvas = true;
    lastpos.x = mouseX;
    lastpos.y = mouseY;

  }
});
document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key === "Enter" && selectedCircle) {
    const newCircle = new Circle(
      selectedCircle.x + 50, // Adjust the position of the new circle
      selectedCircle.y + 50, 
      "", 
      Date.now()
    );

    const name = prompt("Enter a name for the circle:", newCircle.name);
    if (name !== null) {
      newCircle.name = name;
    }

    circles.push(newCircle);
    actionsHistory.push({ type: "addCircle", circle: newCircle });

    // Create a connection between the selected circle and the new circle
    const connection = new Connection(newCircle,selectedCircle);
    connections.push(connection);
    selectedCircle = newCircle
  }
});

document.addEventListener("keydown", (event) => {
  if (event.shiftKey && event.key === "Enter" && selectedCircle) {
    const newName = prompt("Enter a new name for the selected circle:", selectedCircle.name);
    if (newName !== null) {
      selectedCircle.name = newName;
      actionsHistory.push({ type: "renameCircle", circle: selectedCircle, oldName: selectedCircle.name, newName });
    }
  }
});


document.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault(); // Prevent default tab behavior

    if (circles.length > 0) {
      const currentIndex = selectedCircle ? circles.indexOf(selectedCircle) : -1;

      let nextIndex;
      if (event.shiftKey) {
        // Reverse direction if Shift is held
        nextIndex = (currentIndex - 1 + circles.length) % circles.length;
      } else {
        // Forward direction
        nextIndex = (currentIndex + 1) % circles.length;
      }

      selectedCircle = circles[nextIndex];
    }
  }
});

Circle.prototype.draw = function() {
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.fillStyle = this.fillColor;
  ctx.fill();
  ctx.lineWidth = this.strokeWidth;
  ctx.strokeStyle = this === selectedCircle ? "red" : this.strokeColor; // Highlight selected circle
  ctx.stroke();
  this.drawCircleName();
};


canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault(); // Prevent the default right-click menu from appearing
  event.stopPropagation()
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  for (const circle of circles) {
    const dx = mouseX - circle.x;
    const dy = mouseY - circle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= circle.radius) {
      const name = prompt("Enter a name for the circle:", circle.name);
      if (name !== null) {
        circle.name = name;
      }
      break;
    }
  }
});

canvas.addEventListener("click", (event) => {
  event.preventDefault()
  event.stopPropagation()
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  if (event.shiftKey) {
    for (const circle of circles) {
      const dx = mouseX - circle.x;
      const dy = mouseY - circle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= circle.radius) {
        const color = prompt(
          "Enter a new color for the circle:",
          circle.fillColor
        );
        if (color !== null) {
          circle.setColor(color);
        }
        break;
      }
    }
  }
});

canvas.addEventListener("dblclick", (event) => {
  event.preventDefault()
  event.stopPropagation()
  if (draggingCircle || draggingCircle_db) {
    draggingCircle = null;
    draggingCircle_db = null;
  } else {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    let any = false
    for (const circle of circles) {
      const dx = mouseX - circle.x;
      const dy = mouseY - circle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= circle.radius) {
        draggingCircle_db = circle;
        draggingCircle = null;
        console.log("testt");
        any = true
        break;
      }
    }
    if (!any){
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const circle = new Circle(mouseX, mouseY,"",Date.now());
      const name = prompt('Enter a name for the circle:', circle.name);
      if (name !== null) {
        circle.name = name;
      }
      circles.push(circle);
      actionsHistory.push({ type: 'addCircle', circle });
  
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

    if (distance <= circle.radius) {
      hoveredCircle = circle;
      break;
    }
  }
  if (isDraggingCanvas){
    diff_x = lastpos.x - mouseX;
    diff_y = lastpos.y - mouseY;
    for (let circle of circles){
      circle.x = circle.x - diff_x
      circle.y = circle.y - diff_y
    }
    lastpos.x = mouseX
    lastpos.y = mouseY

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
        const dx = mouseX - circle.x;
        const dy = mouseY - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= circle.radius) {
          if (areCirclesConnected(draggingCircle_db, circle)) {
            deleteConnectionIfConnected(draggingCircle_db, circle);
            draggingCircle_db = null;
          } else {
            const connection = new Connection(draggingCircle_db, circle);
            connections.push(connection);
            draggingCircle_db = null;
          }
        isany = true;
        break
        }
      }
    }

  }
  draggingCircle = null;
  isDraggingCanvas = false;
});

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key === "z") {
    if (actionsHistory.length > 0) {
      const lastAction = actionsHistory.pop();

      if (lastAction.type === "addCircle") {
        const circleIndex = circles.indexOf(lastAction.circle);
        circle = circles[circleIndex];
        deleteConnectionsForCircle(circle);
        if (circleIndex !== -1) {
          circles.splice(circleIndex, 1);
        }
      } else if (lastAction.type === "removeConnection") {
        connections.push(lastAction.connection);
      }
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Delete" && hoveredCircle) {
    const index = circles.indexOf(hoveredCircle);
    circles.splice(index, 1);
    deleteConnectionsForCircle(hoveredCircle);
    actionsHistory.push({ type: "removeCircle", circle: hoveredCircle });
    hoveredCircle = null;
  }
});

let lastTapTime = 0;

canvas.addEventListener("touchstart", (event) => {
  // event.preventDefault();
  if (event.touches.length > 1){
    return
  }
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
      const dx = mouseX - circle.x;
      const dy = mouseY - circle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= circle.radius) {
        draggingCircle_db = circle;
        draggingCircle = null;
        any = true;
        event.stopPropagation()
        break;
      }
    }
    if (!any) {
      event.stopPropagation()
      const circle = new Circle(mouseX, mouseY,"", Date.now());
      const name = prompt('Enter a name for the circle:', circle.name);
      if (name !== null) {
        circle.name = name;
      }
      circles.push(circle);
      actionsHistory.push({ type: 'addCircle', circle });
    }
  } else {
    // Single tap: same as the previous touchstart logic
    for (const circle of circles) {
      const dx = mouseX - circle.x;
      const dy = mouseY - circle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= circle.radius) {
        draggingCircle = circle;
        event.stopPropagation()
        break;
        
      }
    }
  }
  lastTapTime = currentTime;
});


canvas.addEventListener("touchmove", (event) => {
  // event.preventDefault();
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
  // event.preventDefault();
  draggingCircle = null;
});


function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);


  for (const connection of connections) {
    connection.draw();
    connection.applyForces();
  }
  for (const circle of circles) {
    circle.draw();
  }
  handleCollisions();
  requestAnimationFrame(animate);
}
window.onload = () => {
  loadGraphFromLocalStorage();
};

animate();
setInterval(saveGraphToLocalStorage, 1000);
