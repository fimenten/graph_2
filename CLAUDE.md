# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an interactive Force Field Graph web application that allows users to create, manipulate, and visualize graph networks with physics-based simulations. The application supports both 2D canvas-based interaction and 3D visualization.

## Running the Application

**Development:**
- TypeScript source files: `app.ts`, `3d.ts`, `types.ts`
- Compile TypeScript: `npx tsc` (generates files in `dist/` folder)
- Serve files with any HTTP server: `python -m http.server 8000` or similar
- Open `index.html` for 2D mode, `3d.html` for 3D mode
- Available live at: https://fimenten.github.io/graph_2/

**Build Process:**
- Install dependencies: `npm install typescript`
- Compile TypeScript: `npx tsc`
- Files are compiled to `dist/app.js` and `dist/3d.js` with ES2015 modules
- HTML files reference compiled JavaScript with `type="module"`

**Python Utilities:**
- `translate.py`: Convert graph data formats (requires manual path modification)
- Run with: `python translate.py`

## Core Architecture

### 2D Graph System (app.ts → dist/app.js)

**Main Data Structures:**
- `circles[]`: Array of Circle objects representing nodes
- `connections[]`: Array of Connection objects representing edges
- `actionsHistory[]`: Undo/redo stack for user actions

**Key Classes:**
- `Circle`: Represents graph nodes with physics properties (position, velocity, mass)
- `Connection`: Represents edges with spring physics (k constant, rest length)

**Physics Simulation:**
- Force-directed layout with spring connections
- Canvas-based rendering with real-time animation loop
- Mouse/keyboard interaction for manipulation

**User Interactions:**
- `Ctrl+Click`: Add new circle
- `Double-click+Drag`: Create connection between circles
- `Click+Drag`: Move circles
- `Right-click`: Rename circles or delete connections
- `Shift+Click`: Change circle color
- `Delete key`: Remove hovered circle
- `Ctrl+Z`: Undo last action

### 3D Visualization (3d.ts → dist/3d.js)

**Dependencies (CDN):**
- Three.js: 3D rendering engine
- three-spritetext: Text labels for nodes
- 3d-force-graph: Force-directed 3D graph library

**Data Format:**
- Expects JSON with `nodes[]` and `links[]` arrays
- Node format: `{id, name, val}`
- Link format: `{source, target}`

## Data Persistence

**Session Management:**
- Browser localStorage for graph data persistence
- Session ID system for multiple saved graphs
- URL parameter support: `?sessionId=<id>`

**Save/Load Functions:**
- `saveGraph()`: Save current graph to localStorage
- `loadGraph()`: Load graph from localStorage
- `saveGraphWithInputSessionId()`: Save to specific session ID
- Session dropdown for easy switching between saved graphs

## Data Interchange

**2D ↔ 3D Conversion:**
- 2D format: `{circles: [...], connections: [...]}`
- 3D format: `{nodes: [...], links: [...]}`
- Use `translate.py` or `extractGraphData()` function in 3d.js

**File Structure:**
- `index.html` + `app.ts` (compiled to `dist/app.js`) + `styles.css`: Main 2D application
- `3d.html` + `3d.ts` (compiled to `dist/3d.js`) + `styles_3d.css`: 3D visualization
- `types.ts`: TypeScript interfaces and type definitions
- `translate.py`: Utility for data format conversion
- `tsconfig.json`: TypeScript compiler configuration

## Development

**Local Development:**
- Use browser DevTools Console to monitor physics calculations and debug interactions
- Enable verbose logging by uncommenting `console.log()` statements in `app.js`
- Common debugging: Check localStorage for session data, monitor canvas rendering performance
- Test physics adjustments: Modify `k` values in Connection class, adjust damping in animation loop

**Performance Monitoring:**
- Large graphs (>100 nodes): Monitor frame rate in DevTools Performance tab
- Memory usage: Check for connection/circle object accumulation in heap snapshots
- PageRank calculation: Runs on every interaction, may need throttling for large graphs

## Browser Compatibility

**Required Features:**
- HTML5 Canvas API with 2D context
- ES6+ support (arrow functions, const/let, template literals)
- localStorage for session persistence
- CDN access for 3D mode dependencies (Three.js, 3d-force-graph, three-spritetext)

**Known Limitations:**
- Mobile: Touch interaction may have different behavior than mouse events
- Safari: localStorage quota more restrictive than Chrome/Firefox
- IE: Not supported due to ES6+ usage

## Key Implementation Details

**Canvas Management:**
- Canvas size adapts to window dimensions (`window.innerWidth/innerHeight`)
- Coordinate system origin at top-left
- Real-time rendering loop with `requestAnimationFrame`

**Physics System:**
- Spring constants: `Connection.k = 0.0` (static), adjustable per connection
- Force calculation in animation loop applies spring forces between connected circles
- PageRank algorithm: `calculatePageRank(damping=0.85, iterations=20)` affects node radius
- Adaptive radius: `SMALL_RADIUS`, `MEDIUM_RADIUS`, `LARGE_RADIUS` = `1/20` of canvas edge

**Event Handling:**
- Complex mouse interaction state machine
- Touch support for mobile devices
- Keyboard shortcuts for power-user functionality

**State Management:**
- Global variables for interaction state (`draggingCircle`, `hoveredCircle`, etc.)
- Action history for undo functionality
- UUID generation for unique identifiers

## Troubleshooting

**Common Issues:**

*Graph not loading:*
- Check browser console for localStorage errors
- Verify `sessionId` parameter format in URL
- Clear localStorage if data corruption suspected

*Performance degradation:*
- Reduce physics iterations or disable PageRank for large graphs
- Check for orphaned connections without valid circle references
- Monitor memory usage for object leaks

*3D mode not working:*
- Verify CDN dependencies are loading (check Network tab)
- Ensure JSON data format matches `{nodes: [], links: []}` structure
- Check CORS policy if serving from local file system