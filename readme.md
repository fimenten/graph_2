
# Force Field Graph App

This is a web app that allows you to create an interactive force field graph. The graph consists of circles and connections between them, and allows you to add, remove, and move circles, as well as create and delete connections between them.

## Getting Started

available on https://fimenten.github.io/graph_2/


To get started with the app, follow these steps:
1. Clone the repository to your local machine or download the ZIP file and extract it.
2. Open the `index.html` file in your web browser.
3. The program will run in the browser and you can interact with the graph by clicking and dragging circles, creating connections between circles, and renaming circles.
## 使い方
### 円の追加
グラフに円を追加するには、ctrlキーを押しながらキャンバスの任意の場所をクリックします。これにより、マウス位置に半径50ピクセルのデフォルトの青色の塗りつぶし円が作成されます。次に、右クリックして新しい名前を入力することで、円の名前を変更できます。

### 接続の作成
2つの円の間に接続を作成するには、1つの円からもう1つの円までダブルクリックしてドラッグします。マウスボタンを離すと、2つの円の間に接続が作成されます。接続は2つの円を引き合わせる力を発生させます。 ConnectionクラスのkとrestLengthプロパティを変更して、接続のばね定数と静止長を調整することができます。

### 円の移動
円を移動するには、クリックしてドラッグして新しい位置に移動します。ドラッグ中に円はマウス位置にスナップされます。マウスボタンを離すと、円は新しい位置に留まります。

### 円の名前変更
円の名前を変更するには、右クリックしてプロンプトに新しい名前を入力します。円の名前は円の内部に表示されます。

### 円の色の変更
円の色を変更するには、shift + クリックして、プロンプトに新しい色を入力します。

### 円と接続の削除
円を削除するには、上にカーソルを移動してキーボードのDeleteキーを押します。これにより、円とそれに接続されたすべての接続がグラフから削除されます。接続を削除するには、右クリックしてコンテキストメニューからDeleteを選択します。

### アクションの取り消し
グラフで最後に行ったアクションを取り消すには、キーボードでctrl+zを押します。これにより、最後に行ったアクション、円または接続の追加または削除が取り消されます。



## How to Use

### Adding Circles

To add a circle to the graph, hold down the `ctrl` key and click anywhere on the canvas. This will create a new circle at the mouse position with a default radius of 50 pixels and a blue fill color. You can then rename the circle by right-clicking on it and entering a new name.

### Creating Connections

To create a connection between two circles, double-click and drag from one circle to another. When you release the mouse button, a connection will be created between the two circles. The connection will apply a force that pulls the circles towards each other. You can adjust the spring constant and rest length of the connection by modifying the `k` and `restLength` properties in the `Connection` class.

### Moving Circles

To move a circle, click and drag it to a new position. The circle will snap to the mouse position while being dragged. When you release the mouse button, the circle will stay in its new position.

### Renaming Circles

To rename a circle, right-click on it and enter a new name in the prompt. The circle's name will be displayed inside the circle.

### Change color of a Circle

To change color of a circle, shift + click on it and enter a new color in the prompt. 



### Deleting Circles and Connections

To delete a circle, hover over it and press the `Delete` key on your keyboard. This will remove the circle and all connections to it from the graph. To delete a connection, right-click on it and select `Delete` from the context menu.

### Undoing Actions

To undo the last action on the graph, press `ctrl`+`z` on your keyboard. This will undo the last action, whether it was adding or removing a circle or a connection.

## Customization

You can customize the appearance and behavior of the graph by modifying the JavaScript code in the `script.js` file. For example, you can change the default circle color, radius, and stroke width, or adjust the spring constant and rest length of the connections. You can also add new functionality, such as zooming or panning the graph, by adding new event listeners and code to handle user input.

## License

This program is released under the MIT license. See the `LICENSE` file for more details.
