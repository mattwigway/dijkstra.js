/**
 * An extremely naive priority queue implementation.
 * Do not use for anything remotely performance sensitive.
 */

PriorityQueue = function () {
  // two synchronized lists are used to maintain the priority queue
  this.nodes = [];
  this.costs = [];
};

/**
 * Add a node to the priority queue
 * @returns true if this is the lowest-cost path to this node.
 */
PriorityQueue.prototype.add = function (node, cost) {
  var idx = this.nodes.indexOf(node);

  if (idx != -1) {
    if (cost <= this.costs[idx]) {
      this.costs[idx] = cost;
      return true
    }
    else {
      return false;
    }
  }
  else {
    // insert it into the queue
    // perform a binary search on the weights array

    // inclusive
    var leftBound = 0;
    var rightBound = this.costs.length - 1;

    while (leftBound != rightBound) {
      var center = Math.round((rightBound - leftBound) / 2) + leftBound;

      if (this.costs[center] < cost)
        leftBound = center;
      else
        rightBound = center;
    }
  }
}
