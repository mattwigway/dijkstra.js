// draw the graph

Graph = function (graph) {
  var instance = this;

  _.bindAll(this, 'classForNode', 'setSelectedNode', 'step', 'run', 'fillForNode');

  this.graph = graph;

  var width = 800;
  var height = 600;
  var max_cost = 10000;

  this.costscale = d3.scale.linear()
    .domain([0, max_cost])
    .range([0, 1]);

  this.indexGraph();

  // perform initial rendering
  this.svg = d3.select('#graph').append('svg')
    .attr('width', width)
    .attr('height', height);

  this.xscale = d3.scale.linear()
    .domain([this.min_x, this.max_x])
    .range([3, width - 3]);

  this.yscale = d3.scale.linear()
    .domain([this.max_y, this.min_y])
    .range([3, height - 3]);

  // draw the edges
  this.svg.selectAll('.edge')
    .data(this.graph.edges)
    .enter().append('line')
    .attr('class', 'edge')
    .attr('id', function (d) { return 'edge-' + d.from + '-' + d.to })
    .attr('x1', function (d) { return instance.xscale(instance.graph.nodes[d.from].x) })
    .attr('x2', function (d) { return instance.xscale(instance.graph.nodes[d.to].x) })
    .attr('y1', function (d) { return instance.yscale(instance.graph.nodes[d.from].y) })
    .attr('y2', function (d) { return instance.yscale(instance.graph.nodes[d.to].y) })

  // draw the nodes
  var nd = this.svg.selectAll('.node')
    .data(this.graph.nodes)
    .enter().append('circle')
    .attr('id', function (d, i) {return 'node-' + i})
    .attr('r', 2.5)
    .attr('class', this.classForNode)
    .attr('cx', function (d) { return instance.xscale(d.x) })
    .attr('cy', function (d) { return instance.yscale(d.y) })
    .on('click', this.setSelectedNode);

  nd.append('title').text(function (d) { return d.name; })

  this.render();

  d3.select('#run')
    .on('click', this.run);

  d3.select('#step')
    .on('click', this.step);
};

/**
 * Perform the updates that need to be performed to the graph.
 */
 Graph.prototype.render = function () {
   this.svg.selectAll('.node')
    .attr('class', this.classForNode)
    .attr('fill', this.fillForNode);
 }

/**
 * Build a graph index, creating a neighbors list for each node, with the distance to the next node.
 */
Graph.prototype.indexGraph = function () {
  var instance = this;

  this.max_x = this.min_x = this.graph.nodes[0].x;
  this.max_y = this.min_y = this.graph.nodes[0].y;

  this.graph.nodes.forEach(function (node) {
    node.neighbors = [];

    if (node.x > instance.max_x) instance.max_x = node.x;
    if (node.x < instance.min_x) instance.min_x = node.x;
    if (node.y > instance.max_y) instance.max_y = node.y;
    if (node.y < instance.min_y) instance.min_y = node.y;
  });

  this.graph.edges.forEach(function (edge) {
    instance.graph.nodes[edge.from].neighbors.push([edge.to, edge.length]);
    instance.graph.nodes[edge.to].neighbors.push([edge.from, edge.length]);
  });
};

/**
 * Get the class for a node.
 */
Graph.prototype.classForNode = function (nd, idx) {
  if (idx == this.startNode)
    return 'node startNode';
  else
    return 'node';
}

Graph.prototype.setSelectedNode = function (nd, idx) {
  log.info('setting node ' + idx + ' (' + this.graph.nodes[idx].name + ') as starting node');

  this.startNode = idx;

  // scale the cost based on the largest possible cost, by running a dijkstra search
  // before so we know the result
  var dijk = new Dijkstra(this.graph, idx);
  dijk.run();

  this.costscale.domain([0, dijk.upperCost]);

  this.dijkstra = new Dijkstra(this.graph, idx);

  this.render();
};

Graph.prototype.step = function () {
  var ret = this.dijkstra.step();
  this.render();
  return ret;
};

Graph.prototype.run = function () {
  var interval;
  var instance = this;

  interval = setInterval(function () {
    if (!instance.step()) {
      clearInterval(interval);
    }
  }, 50);
};

Graph.prototype.fillForNode = function (d, i) {
  if (d.cost === undefined || d.cost === false)
    return d3.hsl(237, 0, .95);

  var s = this.costscale(d.cost);

  if (d.labeled)
    return d3.hsl(237, s, .50);
  else
    return '#b22';
};
