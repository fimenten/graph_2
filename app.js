const canvas = document.getElementById('forceFieldGraph');
const ctx = canvas.getContext('2d');

// Set canvas size to window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Resize canvas when window size changes
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

const actionsHistory = [];
let hoveredCircle = null;




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



class Circle {
  constructor(x, y, radius = 50, fillColor = 'blue', strokeColor = 'black', strokeWidth = 2) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.fillColor = fillColor;
    this.strokeColor = strokeColor;
    this.strokeWidth = strokeWidth;
    this.name = '';
    const name = prompt('Enter a name for the circle:', this.name);
    if (name !== null) {
      this.name = name;
    }
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

    if (this.name) {
      ctx.font = '24px Arial';
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
    this.restLength = circleA.radius * 3;

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


animate();
