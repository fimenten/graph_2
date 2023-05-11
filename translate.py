import json

path = r"F:\Download\graph (3).json"

with open(path,mode="r",encoding="utf-8") as f:
    d = json.load(f)

graph = {"nodes": [], "links": []}

# extract nodes
for node in d["circles"]:
    graph["nodes"].append({
        "id": str(node["name"]),
        "name": str(node["name"]),
        "val": 1
    })

# extract links
for link in d["connections"]:
    nodeA = link["circleA"]["name"]
    nodeB = link["circleB"]["name"]
    graph["links"].append({
        "source": str(nodeA),
        "target": str(nodeB)
    })

with open("out.json",mode="w",encoding="utf-8") as f:
    json.dump(graph,f)