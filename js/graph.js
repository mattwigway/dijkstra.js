// draw the graph

Graph = function (graph) {
  var instance = this;

  _.bindAll(this, 'classForNode', 'setSelectedNode', 'step', 'run', 'fillForNode', 'showPath', 'hidePath', 'showAllPaths');

  this.graph = graph;

  var width = 800;
  var height = 500;
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
    .on('click', this.setSelectedNode)
    .on('mouseover', function (d, i) {
      instance.hidePath();
      instance.showPath(d, i);
    });

	// clear a shown path when the mouse leaves the display area
	this.svg.on('mouseout', function () {
		instance.hidePath();
	});

  nd.append('title').text(function (d) { return d.name; })

  this.render();

  d3.select('#run')
    .on('click', this.run);

  d3.select('#step')
    .on('click', this.step);

	d3.select('#spt')
		.on('click', this.showAllPaths);

	this.done = false;
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

	this.graph.edgeIdx = {};

  this.graph.edges.forEach(function (edge) {
    instance.graph.nodes[edge.from].neighbors.push([edge.to, edge.length]);
    instance.graph.nodes[edge.to].neighbors.push([edge.from, edge.length]);

		instance.graph.edgeIdx[edge.from + '_' + edge.to] = edge;
		instance.graph.edgeIdx[edge.to + '_' + edge.from] = edge;

    // the number of paths that traverse this edge.
		edge.count = 0;
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

  this.hidePath();
	this.clearAllPaths();

  this.startNode = idx;

  // scale the cost based on the largest possible cost, by running a dijkstra search
  // before so we know the result
  var dijk = new Dijkstra(this.graph, idx);
  dijk.run();

  this.costscale.domain([0, dijk.upperCost]);

  this.dijkstra = new Dijkstra(this.graph, idx);

	this.done = false;

	this.clearAllPaths();

  this.render();
};

Graph.prototype.step = function () {
  this.done = !this.dijkstra.step();
  this.render();
  return !this.done;
};

/** debug hook */
Graph.prototype.runFast = function () {
	this.dijkstra.run();
  this.done = true;
	this.render();
};

Graph.prototype.run = function () {
  var interval;
  var instance = this;

  interval = setInterval(function () {
    if (!instance.step()) {
      clearInterval(interval);
    }
  }, 10);
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

/**
 * Event handler to highlight the path back from each node.
 */
Graph.prototype.showPath = function (node, idx) {
  if (node.previous !== undefined && node.previous !== false) {
    // find the edge
    var edge = this.svg.select('#edge-' + node.previous + '-' + idx);

    // could be backwards
    if (edge.empty())
      edge = this.svg.select('#edge-' + idx + '-' + node.previous);

    if (edge.empty())
      log.error('no edge from ' + node.previous + ' to ' + idx + ' or vice versa found in rendered graph');

    edge.classed('path', true);

    // recurse!
    this.showPath(this.graph.nodes[node.previous], node.previous);
  }
};

/**
 * Clear the path.
 */
Graph.prototype.hidePath = function () {
  this.svg.selectAll('.edge').classed('path', false);
};


/**
 * Show all paths, after Brandon Martin-Anderson.
 */
Graph.prototype.showAllPaths = function () {
	var instance = this;
	
	if (!this.done) {
		return;
	}

	var maxCount = 0;

	this.graph.nodes.forEach(function (node, nodeIdx) {
		while (node.previous !== false) {
			instance.graph.edgeIdx[node.previous + '_' + nodeIdx].count += 1;

			if (instance.graph.edgeIdx[node.previous + '_' + nodeIdx].count > maxCount)
				maxCount = instance.graph.edgeIdx[node.previous + '_' + nodeIdx].count;

			nodeIdx = node.previous;
			node = instance.graph.nodes[nodeIdx];
		}
	});

	log.info('most used edge traversal count: ' + maxCount);

	// use a log-scale so well-used paths don't dominate
	var widthScale = d3.scale.log()
		.domain([1, maxCount])
		.range([0.3, 10]);

	this.svg.selectAll('.edge')
		.style('stroke-width', function (d) { return d.count === 0 ? 0.3 : widthScale(d.count); })
		.classed('active', function (d) { return d.count > 0 });
};

/**
 * return path display to normal
 */
Graph.prototype.clearAllPaths = function () {
	// clear edge counts
	this.graph.edges.forEach(function (edge) {
		edge.count = 0;
	});

	// clear edge count display
	this.svg.selectAll('.edge')
		.style('stroke-width', false);
};
