$(document).ready(function () {
  $.get('graph.json')
    .done(function (data) {
      window.Dijk = new Dijkstra(data);
    });
});
