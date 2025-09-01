import { Graph3DData, Node3D, Link3D, GraphData } from './types.js';

// Declare the global ForceGraph3D function from the CDN library
declare const ForceGraph3D: any;
declare const SpriteText: any;

const Graph = ForceGraph3D()(document.getElementById('3d-graph'));

// Add event listener to input element
const fileInput = document.getElementById('file-input') as HTMLInputElement;
fileInput.addEventListener('change', (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e: ProgressEvent<FileReader>) => {
    if (!e.target?.result) return;
    
    const data: Graph3DData = JSON.parse(e.target.result as string);
    Graph.graphData(data).nodeThreeObject((node: Node3D) => {
      const sprite = new SpriteText(node.id);
      sprite.material.depthWrite = false; // make sprite background transparent
      sprite.textHeight = 8;
      return sprite;
    });
  };
  reader.readAsText(file);
});

function extractGraphData(d: GraphData): Graph3DData {
  const graph: Graph3DData = { "nodes": [], "links": [] };
  
  console.log(d);
  
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
    const nodeA = link.circleA.name;
    const nodeB = link.circleB.name;
    graph.links.push({
      "source": String(nodeA),
      "target": String(nodeB)
    });
  });

  return graph;
}

function loadGraphFromLocalStorage(): Graph3DData | null {
  const jsonData = localStorage.getItem('graphData');
  if (!jsonData) return null;

  // Parse JSON data
  const d: GraphData = JSON.parse(jsonData);

  // Extract graph data
  const graphData = extractGraphData(d);
  return graphData;
}

document.addEventListener("DOMContentLoaded", function(event: Event) {
  // Page is ready, load graph data from local storage
  const graphData = loadGraphFromLocalStorage();
  
  if (graphData) {
    // Render the graph using the loaded data
    Graph.graphData(graphData).nodeThreeObject((node: Node3D) => {
      const sprite = new SpriteText(node.id);
      sprite.material.depthWrite = false; // make sprite background transparent
      sprite.textHeight = 8;
      return sprite;
    });
  }
});