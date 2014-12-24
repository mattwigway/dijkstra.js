$(document).ready(function () {
  $.get('graph.json')
    .done(function (data) {
      window.graph = new Graph(data);
    });
});
