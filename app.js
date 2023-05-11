const canvas = document.getElementById('forceFieldGraph');
const ctx = canvas.getContext('2d');

// Set canvas size to window size
canvas.width = window.innerWidth - 100;
canvas.height = window.innerHeight;
let smaller_edge = Math.min(canvas.width,canvas.height)

// Resize canvas when window size changes
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth- 100;
  canvas.height = window.innerHeight;
  smaller_edge = Math.min(canvas.width,canvas.height)
  // console.log(smaller_edge)
});


const actionsHistory = [];
let hoveredCircle = null;

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
    connections: connections
  };
  const jsonData = JSON.stringify(data);
  localStorage.setItem('graphData', jsonData);
}

// Function to load the graph data from local storage
function loadGraphFromLocalStorage() {
  const jsonData = localStorage.getItem('graphData');
  if (jsonData) {
    const data = JSON.parse(jsonData);

    circles.length = 0;
    connections.length = 0;

    for (const circleData of data.circles) {
      const circle = new Circle(circleData.x, circleData.y, circleData.radius, circleData.fillColor, circleData.strokeColor, circleData.strokeWidth);
      circle.name = circleData.name;
      circles.push(circle);
    }

    for (const connectionData of data.connections) {
      const circleA = circles.find(circle => circle.name === connectionData.circleA.name);
      const circleB = circles.find(circle => circle.name === connectionData.circleB.name);
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
      actionsHistory.push({ type: 'removeConnection', connection });
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
      (connection.circleA === circleA && connection.circleB === circleB) ||
      (connection.circleA === circleB && connection.circleB === circleA)
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
      actionsHistory.push({ type: 'removeConnection', connection });
      return true;
    }
  }

  return false;
}
function saveGraph() {
  const data = {
    circles: circles,
    connections: connections
  };
  const jsonData = JSON.stringify(data);
  const blob = new Blob([jsonData], {type: 'application/json'});
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.download = 'graph.json';
  link.href = url;
  link.click();
}

function loadGraph() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';

  input.addEventListener('change', () => {
    const file = input.files[0];
    const reader = new FileReader();
    reader.readAsText(file);

    reader.addEventListener('load', () => {
      const data = JSON.parse(reader.result);

      circles.length = 0;
      connections.length = 0;

      for (const circleData of data.circles) {
        const circle = new Circle(circleData.x, circleData.y, circleData.radius, circleData.fillColor, circleData.strokeColor, circleData.strokeWidth);
        circle.name = circleData.name;
        circles.push(circle);
      }

      for (const connectionData of data.connections) {
        const circleA = circles.find(circle => circle.name === connectionData.circleA.name);
        const circleB = circles.find(circle => circle.name === connectionData.circleB.name);
        const connection = new Connection(circleA, circleB, connectionData.k);
        connections.push(connection);
      }
    });
  });

  input.click();
}

function calculateAdaptiveFontSize(radius, name) {
  const maxFontSize = smaller_edge/20/2;
  const maxNameWidth = radius * 2 * 0.7;
  let fontSize = maxFontSize;
  while (fontSize > 1) {
    ctx.font = `${fontSize}px Arial`;
    const nameWidth = ctx.measureText(name).width;
    if (nameWidth <= maxNameWidth) {
      break;
    }
    fontSize -= 1;
  }
  return fontSize;
}


class Circle {
  constructor(x, y, radius = smaller_edge/20, fillColor = 'blue', strokeColor = 'black', strokeWidth = 2) {
    this.x = x;
    this.y = y;
    console.log(radius)
    this.radius = radius;
    this.fillColor = fillColor;
    this.strokeColor = strokeColor;
    this.strokeWidth = strokeWidth;
    this.name = '';
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
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.name, this.x, this.y);
    }
  }
  
}


class Connection {
  constructor(circleA, circleB, k = 0.01) {
    this.circleA = circleA;
    this.circleB = circleB;
    this.k = k;
    // this.restLength = this.distanceBetween(circleA, circleB);
    this.restLength = (circleA.radius + circleB.radius)/2 * 3;

  }

  draw() {
    ctx.beginPath();
    ctx.moveTo(this.circleA.x, this.circleA.y);
    ctx.lineTo(this.circleB.x, this.circleB.y);
    ctx.closePath();
    ctx.strokeStyle = '#000';
    ctx.stroke();
  }

  distanceBetween(circleA, circleB) {
    return Math.sqrt((circleB.x - circleA.x) ** 2 + (circleB.y - circleA.y) ** 2);
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

const circles = [];
const connections = [];
let draggingCircle = null;
let draggingCircle_db = null;

canvas.addEventListener('mousedown', (event) => {
  if (event.ctrlKey) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const circle = new Circle(mouseX, mouseY);
    const name = prompt('Enter a name for the circle:', circle.name);
    if (name !== null) {
      circle.name = name;
    }
    circles.push(circle);
    actionsHistory.push({ type: 'addCircle', circle });

  }else {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    {
      for (const circle of circles) {
        const dx = mouseX - circle.x;
        const dy = mouseY - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= circle.radius) {
          draggingCircle = circle;
          if (draggingCircle_db){
            draggingCircle = null
          }
          break;
        }
      }
    }
}
});

canvas.addEventListener('contextmenu', (event) => {
  event.preventDefault(); // Prevent the default right-click menu from appearing

  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  for (const circle of circles) {
    const dx = mouseX - circle.x;
    const dy = mouseY - circle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= circle.radius) {
      const name = prompt('Enter a name for the circle:', circle.name);
      if (name !== null) {
        circle.name = name;
      }
      break;
    }
  }
});






canvas.addEventListener('dblclick', (event) => {

  if (draggingCircle || draggingCircle_db){
    draggingCircle = null;
    draggingCircle_db = null;
  }
  else
  {


  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  for (const circle of circles) {
    const dx = mouseX - circle.x;
    const dy = mouseY - circle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= circle.radius) {
      draggingCircle_db = circle;
      draggingCircle = null
      console.log("testt")
      break;
    }
  }
}
});


canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  
  if (draggingCircle) {
    console.log("mov")
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
});



canvas.addEventListener('mouseup', (event) => {
  if (draggingCircle_db) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    for (const circle of circles) {
      console.log("test")
      if (circle !== draggingCircle_db) {
        const dx = mouseX - circle.x;
        const dy = mouseY - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= circle.radius) {
          if (areCirclesConnected(draggingCircle_db,circle)){
            deleteConnectionIfConnected(draggingCircle_db,circle)
            draggingCircle_db = null;
          }
          else{
          const connection = new Connection(draggingCircle_db, circle);
          connections.push(connection);
          draggingCircle_db = null;
          break;
          }
      }
      }
    }
  }
  draggingCircle = null;

});


document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.key === 'z') {
    if (actionsHistory.length > 0) {
      const lastAction = actionsHistory.pop();

      if (lastAction.type === 'addCircle') {
        const circleIndex = circles.indexOf(lastAction.circle);
        circle = circles[circleIndex];
        deleteConnectionsForCircle(circle);
        if (circleIndex !== -1) {
          circles.splice(circleIndex, 1);
        }
      } else if (lastAction.type === 'removeConnection') {
        connections.push(lastAction.connection);
      }
    }
  }
});


document.addEventListener('keydown', (event) => {
  if (event.key === 'Delete' && hoveredCircle) {
    const index = circles.indexOf(hoveredCircle);
    circles.splice(index, 1);
    deleteConnectionsForCircle(hoveredCircle);
    actionsHistory.push({ type: 'removeCircle', circle: hoveredCircle });
    hoveredCircle = null;
  }
});

canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  if (event.shiftKey) {
    for (const circle of circles) {
      const dx = mouseX - circle.x;
      const dy = mouseY - circle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= circle.radius) {
        const color = prompt('Enter a new color for the circle:', circle.fillColor);
        if (color !== null) {
          circle.setColor(color);
        }
        break;
      }
    }
  }
});
// Function to load the graph data from local storage
function loadGraphFromLocalStorage() {
  const jsonData = localStorage.getItem('graphData');
  if (jsonData) {
    const data = JSON.parse(jsonData);

    circles.length = 0;
    connections.length = 0;

    for (const circleData of data.circles) {
      const circle = new Circle(
        circleData.x,
        circleData.y,
        circleData.radius,
        circleData.fillColor,
        circleData.strokeColor,
        circleData.strokeWidth
      );
      circle.name = circleData.name;
      circles.push(circle);
    }

    for (const connectionData of data.connections) {
      const circleA = circles.find((circle) => circle.name === connectionData.circleA.name);
      const circleB = circles.find((circle) => circle.name === connectionData.circleB.name);
      const connection = new Connection(circleA, circleB, connectionData.k);
      connections.push(connection);
    }
  }
}



function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const circle of circles) {
    circle.draw();
  }

  for (const connection of connections) {
    connection.draw();
    connection.applyForces();
  }

  handleCollisions();

  requestAnimationFrame(animate);
}
window.onload = () => {
  loadGraphFromLocalStorage();
};


animate();
setInterval(saveGraphToLocalStorage, 1000);
