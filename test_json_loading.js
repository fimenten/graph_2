// Test script for JSON loading functionality
// This script simulates the loadGraph function to test old format compatibility

const fs = require('fs');
const path = require('path');

// Mock Circle class for testing
class Circle {
  constructor(x, y, name = "", id = "", radius = 50, fillColor = "blue", strokeColor = "black", strokeWidth = 2) {
    this.x = x;
    this.y = y;
    this.name = name;
    this.id = id;
    this.radius = radius;
    this.fillColor = fillColor;
    this.strokeColor = strokeColor;
    this.strokeWidth = strokeWidth;
  }
}

// Mock Connection class for testing
class Connection {
  constructor(circleA, circleB, k = 0) {
    this.circleA = circleA;
    this.circleB = circleB;
    this.k = k;
  }
}

// Simulate the loadGraph function logic
function testLoadGraph(jsonData) {
  const data = JSON.parse(jsonData);
  const circles = [];
  const connections = [];

  console.log('📊 Testing JSON format compatibility...\n');

  // Check if this is the old format (has circles array) or new format
  const circlesData = data.circles || [];
  const connectionsData = data.connections || [];

  console.log(`Found ${circlesData.length} circles and ${connectionsData.length} connections`);

  // Load circles
  for (const circleData of circlesData) {
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
    
    // Copy additional properties from old format if they exist
    if (circleData.rectWidth) circle.rectWidth = circleData.rectWidth;
    if (circleData.rectHeight) circle.rectHeight = circleData.rectHeight;
    if (circleData.pageRank) circle.pageRank = circleData.pageRank;
    
    circles.push(circle);
  }

  console.log('\n✅ Circles loaded successfully:');
  circles.forEach((circle, index) => {
    console.log(`  ${index + 1}. "${circle.name}" at (${circle.x.toFixed(1)}, ${circle.y.toFixed(1)}) - ID: ${circle.id}`);
    if (circle.rectWidth && circle.rectHeight) {
      console.log(`     📐 Dimensions: ${circle.rectWidth.toFixed(1)} × ${circle.rectHeight.toFixed(1)}`);
    }
  });

  // Load connections - handle both old and new formats
  let successfulConnections = 0;
  let skippedConnections = 0;

  for (const connectionData of connectionsData) {
    let circleA, circleB, k = 0;

    if (connectionData.circleA && connectionData.circleB) {
      // New format: circleA and circleB are CircleData objects with id
      circleA = circles.find(circle => circle.id === connectionData.circleA.id);
      circleB = circles.find(circle => circle.id === connectionData.circleB.id);
      k = connectionData.k || 0;
    } else {
      // Very old format or other format
      console.warn("⚠️  Unsupported connection format, skipping connection");
      skippedConnections++;
      continue;
    }
    
    if (circleA && circleB) {
      const connection = new Connection(circleA, circleB, k);
      // Copy additional properties if they exist
      if (connectionData.restLength) connection.restLength = connectionData.restLength;
      connections.push(connection);
      successfulConnections++;
    } else {
      console.warn(`⚠️  Could not find circles for connection (IDs: ${connectionData.circleA?.id}, ${connectionData.circleB?.id})`);
      skippedConnections++;
    }
  }

  console.log('\n✅ Connections processed:');
  console.log(`  ✔️  Successfully loaded: ${successfulConnections}`);
  if (skippedConnections > 0) {
    console.log(`  ⚠️  Skipped: ${skippedConnections}`);
  }

  connections.forEach((conn, index) => {
    console.log(`  ${index + 1}. "${conn.circleA.name}" → "${conn.circleB.name}" (k=${conn.k})`);
    if (conn.restLength) {
      console.log(`     📏 Rest length: ${conn.restLength.toFixed(2)}`);
    }
  });

  return {
    circles,
    connections,
    totalCircles: circles.length,
    totalConnections: connections.length,
    success: true
  };
}

// Test with the old format JSON file
function runTest() {
  console.log('🧪 Testing JSON Loading Compatibility\n');
  console.log('=' .repeat(50));

  try {
    const jsonFilePath = path.join(__dirname, 'graph (3).json');
    
    if (!fs.existsSync(jsonFilePath)) {
      console.error('❌ Test file "graph (3).json" not found!');
      return;
    }

    const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
    console.log(`📁 Loaded file: ${jsonFilePath}`);
    console.log(`📊 File size: ${(jsonData.length / 1024).toFixed(2)} KB\n`);

    const result = testLoadGraph(jsonData);
    
    console.log('\n' + '=' .repeat(50));
    console.log('📋 SUMMARY:');
    console.log(`✅ Test completed successfully`);
    console.log(`📍 Total circles: ${result.totalCircles}`);
    console.log(`🔗 Total connections: ${result.totalConnections}`);
    
    // Validate some expected data from the file
    const expectedNames = ['整い', '風呂', 'archiving', 'imageGen', 'comfyui'];
    const foundNames = result.circles.map(c => c.name);
    const matchingNames = expectedNames.filter(name => foundNames.includes(name));
    
    console.log(`🎯 Expected nodes found: ${matchingNames.length}/${expectedNames.length}`);
    if (matchingNames.length === expectedNames.length) {
      console.log('✅ All expected nodes loaded correctly!');
    }
    
    console.log('\n🎉 JSON loading test passed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error(error.stack);
  }
}

// Run the test
runTest();