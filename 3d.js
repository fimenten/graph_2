const Graph = ForceGraph3D()(document.getElementById('3d-graph'));

// Add event listener to input element
document.getElementById('file-input').addEventListener('change', (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = JSON.parse(e.target.result);
    Graph.graphData(data).nodeThreeObject(node => {
      const sprite = new SpriteText(node.id);
      sprite.material.depthWrite = false; // make sprite background transparent
      sprite.textHeight = 8;
      return sprite;
    });
  };
  reader.readAsText(file);
});

function extractGraphData(d) {
    var graph = { "nodes": [], "links": [] };
    // d = JSON.parse(d)
    console.log(d)
    // Extract nodes
    d.circles.forEach(function (node) {
      graph.nodes.push({
        "id": String(node.name),
        "name": String(node.name),
        "val": 1
      });
    });
  
    // Extract links
    d.connections.forEach(function (link) {
      var nodeA = link.circleA.name;
      var nodeB = link.circleB.name;
      graph.links.push({
        "source": String(nodeA),
        "target": String(nodeB)
      });
    });
  
    return graph;
  }
  
function loadGraphFromLocalStorage(){
    var jsonData = localStorage.getItem('graphData');

    // Parse JSON data
    var d = JSON.parse(jsonData);

    // Extract graph data
    var graphData = extractGraphData(d);
    return graphData
}

document.addEventListener("DOMContentLoaded", function(event) {
    // Page is ready, load graph data from local storage
    var graphData = loadGraphFromLocalStorage();
  
    // Render the graph using the loaded data
    Graph.graphData(graphData).nodeThreeObject(node => {
      const sprite = new SpriteText(node.id);
      sprite.material.depthWrite = false; // make sprite background transparent
      sprite.textHeight = 8;
      return sprite;
    });
  });
  