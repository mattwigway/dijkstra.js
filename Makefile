all: build.js

santa-barbara.osm.xml:
	wget "http://api.openstreetmap.org/api/0.6/map?bbox=-119.7344,34.3924,-119.6869,34.4283" -O santa-barbara.osm.xml

graph.json: santa-barbara.osm
	graph/makeGraph.py santa-barbara.osm graph.json

build.js: js/graph.js js/main.js js/log.js
	uglifyjs --source-map build.js.map --comments all -o build.js js/log.js js/main.js js/graph.js
	
