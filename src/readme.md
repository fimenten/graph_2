
# Force Field Graph App

This is a web app that allows you to create an interactive force field graph. The graph consists of circles and connections between them, and allows you to add, remove, and move circles, as well as create and delete connections between them.

## Getting Started

To get started with the app, follow these steps:

1. Clone the repository to your local machine or download the ZIP file and extract it.
2. Open the `index.html` file in your web browser.
3. The program will run in the browser and you can interact with the graph by clicking and dragging circles, creating connections between circles, and renaming circles.

## How to Use

### Adding Circles

To add a circle to the graph, hold down the `ctrl` key and click anywhere on the canvas. This will create a new circle at the mouse position with a default radius of 50 pixels and a blue fill color. You can then rename the circle by right-clicking on it and entering a new name.

### Moving Circles

To move a circle, click and drag it to a new position. The circle will snap to the mouse position while being dragged. When you release the mouse button, the circle will stay in its new position.

### Renaming Circles

To rename a circle, right-click on it and enter a new name in the prompt. The circle's name will be displayed inside the circle.

### Creating Connections

To create a connection between two circles, double-click and drag from one circle to another. When you release the mouse button, a connection will be created between the two circles. The connection will apply a force that pulls the circles towards each other. You can adjust the spring constant and rest length of the connection by modifying the `k` and `restLength` properties in the `Connection` class.

### Deleting Circles and Connections

To delete a circle, hover over it and press the `Delete` key on your keyboard. This will remove the circle and all connections to it from the graph. To delete a connection, right-click on it and select `Delete` from the context menu.

### Undoing Actions

To undo the last action on the graph, press `ctrl`+`z` on your keyboard. This will undo the last action, whether it was adding or removing a circle or a connection.

## Customization

You can customize the appearance and behavior of the graph by modifying the JavaScript code in the `script.js` file. For example, you can change the default circle color, radius, and stroke width, or adjust the spring constant and rest length of the connections. You can also add new functionality, such as zooming or panning the graph, by adding new event listeners and code to handle user input.

## License

This program is released under the MIT license. See the `LICENSE` file for more details.