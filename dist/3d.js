const Graph = ForceGraph3D()(document.getElementById('3d-graph'));
// Add event listener to input element
const fileInput = document.getElementById('file-input');
fileInput.addEventListener('change', (event) => {
    var _a;
    const target = event.target;
    const file = (_a = target.files) === null || _a === void 0 ? void 0 : _a[0];
    if (!file)
        return;
    const reader = new FileReader();
    reader.onload = (e) => {
        var _a;
        if (!((_a = e.target) === null || _a === void 0 ? void 0 : _a.result))
            return;
        const data = JSON.parse(e.target.result);
        Graph.graphData(data).nodeThreeObject((node) => {
            const sprite = new SpriteText(node.id);
            sprite.material.depthWrite = false; // make sprite background transparent
            sprite.textHeight = 8;
            return sprite;
        });
    };
    reader.readAsText(file);
});
function extractGraphData(d) {
    const graph = { "nodes": [], "links": [] };
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
function loadGraphFromLocalStorage() {
    const jsonData = localStorage.getItem('graphData');
    if (!jsonData)
        return null;
    // Parse JSON data
    const d = JSON.parse(jsonData);
    // Extract graph data
    const graphData = extractGraphData(d);
    return graphData;
}
document.addEventListener("DOMContentLoaded", function (event) {
    // Page is ready, load graph data from local storage
    const graphData = loadGraphFromLocalStorage();
    if (graphData) {
        // Render the graph using the loaded data
        Graph.graphData(graphData).nodeThreeObject((node) => {
            const sprite = new SpriteText(node.id);
            sprite.material.depthWrite = false; // make sprite background transparent
            sprite.textHeight = 8;
            return sprite;
        });
    }
});
export {};
//# sourceMappingURL=3d.js.map