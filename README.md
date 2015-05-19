# THREE.geojson
Convert a geoJSON to a THREE.js 3D mesh structure

![Exmple Rendering of Berlin building data](https://raw.githubusercontent.com/sebastian-meier/THREE.geojson/master/examples/screenshot/top_light.jpg)

The script translates a group of geojson polygons into THREE.js geometries.
The whole script is still very experimental.

<a href="http://prjcts.sebastianmeier.eu/hybridCity/old/buildings.html">DEMO</a>

## How to

Take a look at the examples.
Here a little bit more info on the variables:

```JavaScript
//Turn off console output
var log = true;

//geoJSON file to load
var jsonFile = "../data/einwohnerdichte2013_mini.geojson", 
	//if you want to extract height information from an additional attribute
	useHeight = true, 
	//name of the attribute
	heightAttr = "EW_HA2013",
	//if you want to modify the height value, in our case we use a root function
	heightFn = function(val){ return Math.pow(parseFloat(val), root); },
	//here the root
	root = 1/2.5,
	//for coloring the objects in the example we need a maximum value
	max = heightFn(900),
	z_max = 500.0,
	z_rel = 0.01,
	//values for offset/rotation/scale
	offset_x = -45,
	offset_y = 59,
	offset_z = 0,
	r = 0,
	scale_x = 209,
	scale_y = 350,
	scale_factor = 0.1,
	heightScaler = 0.5,
	//in the example it is possible to animate the height of the objects
	animateHeight = false,
	//the system doesn't really have a spatial projection structure
	//so we simply translate the latitude/longitude values into simple x/y coordinates
	translateLat = function(lat){
		if(!lat){lat = 0;}
		return (lat-13.36)*100;
	},
	translateLng = function(lng){
		if(!lng){lng = 0;}
		return (lng-52.53)*100;
	};
```

![Exmple Rendering of Berlin building data](https://raw.githubusercontent.com/sebastian-meier/THREE.geojson/master/examples/screenshot/angle_light.jpg)

## Example Data
The data in this repository is from the city of berlin.
www.stadtentwicklung.berlin.de/geoinformation/fis-broker

## Future developments
I actually wrote this script to render an animation to a movie, for the future the "saveObj" part needs to be optimized to store the 3D geometrie in a json file to skip the whole parsing.
