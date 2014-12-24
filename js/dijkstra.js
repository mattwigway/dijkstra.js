/**
 * Run a Dijkstra search.
 */
Dijkstra = function (graph, startingNode) {
  this.graph = graph;

  // clear any previous search
  this.graph.nodes.forEach(function (node) {
    node.cost = false;
    node.previous = false;
    node.labeled = false;
  });

  this.pq = new PriorityQueue();

  this.graph.nodes[startingNode].cost = 0;
  this.graph.nodes[startingNode].labeled = true;

  // insert the first node into the priority queue at distance zero
  this.pq.add(startingNode, 0);
};

/**
 * Run one step of the Dijkstra search
 * @return true if the search should continue.
 */
Dijkstra.prototype.step = function () {
  var instance = this;

  if (this.pq.isEmpty())
    return false;

  var nodeIdx = this.pq.get()[0];

  // the node we are exploring
  var nd = this.graph.nodes[nodeIdx];

  // store the maximum cost
  this.upperCost = nd.cost;

  // if it's coming out of the priority queue we're done
  nd.labeled = true;

  nd.neighbors.forEach(function (edge) {
    var nb = instance.graph.nodes[edge[0]];

    // if it's already labeled, don't explore it again
    if (!nb.labeled) {
      var cost =  nd.cost + edge[1];
      if (instance.pq.add(edge[0], cost)) {
        // store the cost now, so the visualizer can visualize incomplete/unlabeled paths as they happen
        nb.cost = cost;
        nb.previous = nodeIdx;
      }
    }
  });

  return !this.pq.isEmpty();
}

/**
 * Run the Dijkstra search.
 */
Dijkstra.prototype.run = function () {
  while (this.step());
};
