/**
 * An extremely naive priority queue implementation.
 * Do not use for anything remotely performance sensitive.
 */

PriorityQueue = function() {
  // two synchronized lists are used to maintain the priority queue
  this.nodes = [];
  this.costs = [];
};

/**
 * Add a node to the priority queue
 * @returns true if this is the lowest-cost path to this node.
 */
PriorityQueue.prototype.add = function(node, cost) {
  var idx = this.nodes.indexOf(node);

  if (idx != -1) {
    if (cost <= this.costs[idx]) {
      // remove it; it will be added back in a moment.
      this.costs.splice(idx, 1);
      this.nodes.splice(idx, 1);
    } else {
      return false;
    }
  }

  // insert it into the queue
  // perform a binary search on the weights array

  var left = 0;
  var right = this.costs.length;

  while (left != right) {
    var center = Math.floor((right - left) / 2 + left);

    log.debug('center: ' + center + ' left: ' + left + ' right: ' + right);

    if (this.costs[center] < cost)
      left = center + 1;
    else
      right = center;
  }

  var insertionPoint = left;

  this.costs.splice(insertionPoint, 0, cost);
  this.nodes.splice(insertionPoint, 0, node);
  return true;
}

/**
 * Get the lowest-cost node from the priority queue
 * @return array [node, weight]
 */
PriorityQueue.prototype.get = function (count) {
  if (this.isEmpty())
    return null;

  if (count === undefined)
    count = 1;

  var node = this.nodes.splice(0, count)[0];
  var cost = this.costs.splice(0, count)[0];

  return [node, cost];
}
