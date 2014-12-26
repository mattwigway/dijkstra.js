/**
 * Logging setup.
 */
window.log=log4javascript.getLogger();var app=new log4javascript.BrowserConsoleAppender;window.log.addAppender(app);log.info("Logging initialized.");$(document).ready(function(){$.get("graph.json").done(function(data){window.graph=new Graph(data)})});// draw the graph
Graph=function(graph){var instance=this;_.bindAll(this,"classForNode","setSelectedNode","step","toggleRun","fillForNode","showPath","hidePath");this.graph=graph;var width=800;var height=575;this.costscale=d3.scale.linear().range([0,1]);// used to display widths
this.widthscale=d3.scale.log().range([.3,10]);this.indexGraph();// perform initial rendering
this.svg=d3.select("#graph").append("svg").attr("width",width).attr("height",height);this.xscale=d3.scale.linear().domain([this.min_x,this.max_x]).range([3,width-3]);this.yscale=d3.scale.linear().domain([this.max_y,this.min_y]).range([3,height-3]);this.interval=false;// draw the edges
this.svg.selectAll(".edge").data(this.graph.edges).enter().append("line").attr("class","edge").attr("id",function(d){return"edge-"+d.from+"-"+d.to}).attr("x1",function(d){return instance.xscale(instance.graph.nodes[d.from].x)}).attr("x2",function(d){return instance.xscale(instance.graph.nodes[d.to].x)}).attr("y1",function(d){return instance.yscale(instance.graph.nodes[d.from].y)}).attr("y2",function(d){return instance.yscale(instance.graph.nodes[d.to].y)});// draw the nodes
var nd=this.svg.selectAll(".node").data(this.graph.nodes).enter().append("circle").attr("id",function(d,i){return"node-"+i}).attr("r",2.5).attr("class",this.classForNode).attr("cx",function(d){return instance.xscale(d.x)}).attr("cy",function(d){return instance.yscale(d.y)}).on("click",this.setSelectedNode).on("mouseover",function(d,i){instance.hidePath();instance.showPath(d,i)});// clear a shown path when the mouse leaves the display area
this.svg.on("mouseout",function(){instance.hidePath()});nd.append("title").text(function(d){return d.name});this.render();d3.select("#run").on("click",this.toggleRun);d3.select("#step").on("click",this.step);this.done=false};/**
 * Perform the updates that need to be performed to the graph.
 */
Graph.prototype.render=function(){var instance=this;this.svg.selectAll(".node").attr("class",this.classForNode).attr("fill",this.fillForNode);this.svg.selectAll(".edge").style("stroke-width",function(d){return d.count===0?.3:instance.widthscale(d.count)}).classed("active",function(d){return d.count>0})};/**
 * Build a graph index, creating a neighbors list for each node, with the distance to the next node.
 */
Graph.prototype.indexGraph=function(){var instance=this;this.max_x=this.min_x=this.graph.nodes[0].x;this.max_y=this.min_y=this.graph.nodes[0].y;this.graph.nodes.forEach(function(node){node.neighbors=[];if(node.x>instance.max_x)instance.max_x=node.x;if(node.x<instance.min_x)instance.min_x=node.x;if(node.y>instance.max_y)instance.max_y=node.y;if(node.y<instance.min_y)instance.min_y=node.y});this.graph.edgeIdx={};this.graph.edges.forEach(function(edge){instance.graph.nodes[edge.from].neighbors.push([edge.to,edge.length]);instance.graph.nodes[edge.to].neighbors.push([edge.from,edge.length]);instance.graph.edgeIdx[edge.from+"_"+edge.to]=edge;instance.graph.edgeIdx[edge.to+"_"+edge.from]=edge;// the number of paths that traverse this edge.
edge.count=0})};/**
 * Get the class for a node.
 */
Graph.prototype.classForNode=function(nd,idx){if(idx==this.startNode)return"node startNode";else return"node"};Graph.prototype.setSelectedNode=function(nd,idx){log.info("setting node "+idx+" ("+this.graph.nodes[idx].name+") as starting node");this.hidePath();this.clearAllPaths();this.startNode=idx;// scale the cost based on the largest possible cost, by running a dijkstra search
// before so we know the result
var dijk=new Dijkstra(this.graph,idx);dijk.run();this.costscale.domain([0,dijk.upperCost]);this.widthscale.domain([1,dijk.getMaxCount()]);this.dijkstra=new Dijkstra(this.graph,idx);this.done=false;this.clearAllPaths();this.render()};Graph.prototype.step=function(){this.done=!this.dijkstra.step();this.render();return!this.done};/** debug hook */
Graph.prototype.runFast=function(){this.dijkstra.run();this.done=true;this.render()};Graph.prototype.toggleRun=function(){if(this.interval!==false){clearInterval(this.interval);this.interval=false;d3.select("#run").text("Run")}else{this.run();d3.select("#run").text("Stop")}};Graph.prototype.run=function(){var instance=this;this.interval=setInterval(function(){if(!instance.step()){clearInterval(this.interval);this.interval=false}},10)};Graph.prototype.fillForNode=function(d,i){if(d.cost===undefined||d.cost===false)return d3.hsl(237,0,.95);var s=this.costscale(d.cost);if(d.labeled)return d3.hsl(237,s,.5);else return"#b22"};/**
 * Event handler to highlight the path back from each node.
 */
Graph.prototype.showPath=function(node,idx){if(node.previous!==undefined&&node.previous!==false){// find the edge
var edge=this.svg.select("#edge-"+node.previous+"-"+idx);// could be backwards
if(edge.empty())edge=this.svg.select("#edge-"+idx+"-"+node.previous);if(edge.empty())log.error("no edge from "+node.previous+" to "+idx+" or vice versa found in rendered graph");edge.classed("path",true);// recurse!
this.showPath(this.graph.nodes[node.previous],node.previous)}};/**
 * Clear the path.
 */
Graph.prototype.hidePath=function(){this.svg.selectAll(".edge").classed("path",false)};/**
 * return path display to normal after showing the SPT visualization
 */
Graph.prototype.clearAllPaths=function(){// clear edge count display
this.svg.selectAll(".edge").style("stroke-width",false)};/**
 * An extremely naive priority queue implementation.
 * Do not use for anything remotely performance sensitive.
 */
PriorityQueue=function(){// two synchronized lists are used to maintain the priority queue
this.nodes=[];this.costs=[]};/**
 * Add a node to the priority queue
 * @returns true if this is the lowest-cost path to this node.
 */
PriorityQueue.prototype.add=function(node,cost){var idx=this.nodes.indexOf(node);if(idx!=-1){if(cost<=this.costs[idx]){// remove it; it will be added back in a moment.
this.costs.splice(idx,1);this.nodes.splice(idx,1)}else{return false}}// insert it into the queue
// perform a binary search on the weights array
var left=0;var right=this.costs.length;while(left!=right){var center=Math.floor((right-left)/2+left);if(this.costs[center]<cost)left=center+1;else right=center}var insertionPoint=left;this.costs.splice(insertionPoint,0,cost);this.nodes.splice(insertionPoint,0,node);return true};/**
 * Get the lowest-cost node from the priority queue
 * @return array [node, weight]
 */
PriorityQueue.prototype.get=function(count){if(this.isEmpty())return null;if(count===undefined)count=1;var node=this.nodes.splice(0,count)[0];var cost=this.costs.splice(0,count)[0];return[node,cost]};/**
 * Is this priority queue empty?
 */
PriorityQueue.prototype.isEmpty=function(){return this.nodes.length==0};/**
 * Run a Dijkstra search.
 */
Dijkstra=function(graph,startingNode){this.graph=graph;// clear any previous search
this.graph.nodes.forEach(function(node){node.cost=false;node.previous=false;node.labeled=false});this.graph.edges.forEach(function(edge){edge.count=0});this.pq=new PriorityQueue;this.graph.nodes[startingNode].cost=0;this.graph.nodes[startingNode].labeled=true;// insert the first node into the priority queue at distance zero
this.pq.add(startingNode,0)};/**
 * Run one step of the Dijkstra search
 * @return true if the search should continue.
 */
Dijkstra.prototype.step=function(){var instance=this;if(this.pq.isEmpty())return false;var nodeIdx=this.pq.get()[0];// the node we are exploring
var nd=this.graph.nodes[nodeIdx];// store the maximum cost
this.upperCost=nd.cost;// if it's coming out of the priority queue we're done
nd.labeled=true;nd.neighbors.forEach(function(edge){var nb=instance.graph.nodes[edge[0]];// if it's already labeled, don't explore it again
if(!nb.labeled){var cost=nd.cost+edge[1];if(instance.pq.add(edge[0],cost)){// store the cost now, so the visualizer can visualize incomplete/unlabeled paths as they happen
nb.cost=cost;nb.previous=nodeIdx}}});// keep counts up-to-date
while(nd.previous!==false){this.graph.edgeIdx[nodeIdx+"_"+nd.previous].count+=1;nodeIdx=nd.previous;nd=this.graph.nodes[nodeIdx]}return!this.pq.isEmpty()};/**
 * Run the Dijkstra search.
 */
Dijkstra.prototype.run=function(){while(this.step());};/**
 * @return the highest count of number of paths passing through any edge.
 */
Dijkstra.prototype.getMaxCount=function(){return _.reduce(_.pluck(this.graph.edges,"count"),function(m,v){return v>m?v:m})};
//# sourceMappingURL=build.js.map