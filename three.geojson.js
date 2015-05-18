//Globals
var json, camera, scene, renderer, mesh, group, groupGeometry, mouse, 
	//All zero or false height values will be ignored
	fast = false, 
	width = window.innerWidth, 
	height = window.innerHeight;


$(document).ready(function() {
	log("start loading");
	$.getJSON( jsonFile, function( data ) {
		log("loading complete");
		json = data;
		init();
	});
});

function log(m){
	if(log){
		console.log(m);
	}
}

function init() {

	//Initiate THREE.js

	camera = new THREE.PerspectiveCamera( 50, (width/height), 1, 1000 );
	camera.position.set( 0, 100, 500 );

	scene = new THREE.Scene();

	mouse = new THREE.Vector2();


	//Initiate Renderer

	renderer = new THREE.WebGLRenderer( { antialias: false, preserveDrawingBuffer: true, alpha: true } );
	renderer.setSize( width, height );
	renderer.shadowMapEnabled = true;
	renderer.shadowMapType = THREE.PCFSoftShadowMap;
	renderer.setViewport( 0,0,width, height );


	//This group will hold our objects for easier handling

	group = new THREE.Object3D();
	group.position.y = 50;
	group.position.z = 0;
	scene.add( group );


	//This group will hold all geometries 

	groupGeometry = new THREE.Geometry();

	
	log("initiation done");

	//Lets go and build the objects based on the geoJson data

	buildShape();

}


//Due to javascripts limitations we need to parse the data in subsets (5000)
var shapeCount = 0, shapes = [], subset_size = 5000;


function buildShape(){
	log("buildShape ("+shapeCount+"/"+json.features.length+")");
	if(shapeCount<json.features.length){
		var shapeSession = 0;
		for(var s = shapeCount; s < json.features.length && shapeSession < subset_size; s++){
			shapeSession++;
			shapeCount++;
			var good = true;
			var points = [];
			//Check if the geometry has at least two coordinates
			if(json.features[s].geometry.coordinates.length<1 || json.features[s].geometry.coordinates[0]<1){
				good = false;
			}else{
				for(var i = 0; i<json.features[s].geometry.coordinates[0].length; i++){
					//Check for weird values
					if(json.features[s].geometry.coordinates[0][i][0] && json.features[s].geometry.coordinates[0][i][1] && json.features[s].geometry.coordinates[0][i][0]>0 && json.features[s].geometry.coordinates[0][i][1]>0){
						points.push( new THREE.Vector2 ( translateLat(json.features[s].geometry.coordinates[0][i][0]), translateLng(json.features[s].geometry.coordinates[0][i][1])) );	
					}else{
						good = false;
					}
				}
			}

			//If the geometry is safe, continue
			if(good){

				//Calculate the height of the current geometry for extrusion
				var h = heightFn(json.features[s].properties[heightAttr]);
				if(isNaN(parseFloat(json.features[s].properties[heightAttr]))){
					if(fast){
						good = false;
					}
					h = 0;
				}
				
				if(!h || h < 0){
					if(fast){
						good = false;
					}
					h = 0;
				}

				if(h>max){
					h = max;
				}

				//Remove all objects that have no height information for faster rendering
				if(h==0 && fast){
					good = false;
				}
			}

			//If the geometry is still safe, continue
			if(good){

				//Calculate the third dimension
				var z = ((h/max)*z_max);
				if(!z || z<1){z = 0;}
				
				//Calculate the color of the object
				//In this sample code we use a blue to red range to visualize the height of the object (blue short to red tall)
				var red = Math.round((h/max)*255.0);
				var blue = Math.round(255.0-(h/max)*255.0);
				var color = new THREE.Color("rgb("+red+",0,"+blue+")");

				addShape( new THREE.Shape( points ), z*z_rel, color, 0, 50, 0, r, 0, 0, 1 );
			}
		}

		//If we have more geometries to add restart the whole loop
		setTimeout(function(){ buildShape(); }, 100);
	}else{

		//We are done building our geometry
		log("Geometry Done");
		
		//Initiate the shader
		
		var shaderMaterial = new THREE.ShaderMaterial({
			attributes: 	{},
			uniforms:		{},
			vertexShader:   THREETUT.Shaders.Lit.vertex,
		    fragmentShader: THREETUT.Shaders.Lit.fragment
		    ,side: THREE.FrontSide
		});

		
		//Initiate Material
		
		var materials = [
			new THREE.MeshLambertMaterial({vertexColors: THREE.VertexColors, color: "rgb(0.2,0.2,0.2)",ambient: "rgb(0.2,0.2,0.2)", shininess: 1, lights:true}),
			new THREE.MeshLambertMaterial({vertexColors: THREE.VertexColors, color: "rgb(0.5,0.5,0.5)",ambient: "rgb(0.5,0.5,0.5)", shininess: 1, lights:true})
		];

		var material = new THREE.MeshFaceMaterial(materials);

		
		//Create a mesh from the geometry

		mesh = new THREE.Mesh( groupGeometry, material );

		mesh.position.set( offset_x*3, offset_y*3, offset_z*3 );
		mesh.rotation.set( r, 0, 0 );
		mesh.scale.set(scale_factor * scale_x,scale_factor * scale_y,0);
		mesh.castShadow = true;
		mesh.receiveShadow = true;

		scene.add( mesh );


		//Too make it a little more fancy, add a directional light

		var directionalLight = new THREE.DirectionalLight(0xeeeeee, 1);
		directionalLight.position.set(0, 400, 200);
		directionalLight.target = mesh;
		directionalLight.castShadow = true;
		directionalLight.shadowDarkness = 0.5;
		scene.add( directionalLight );
		

		//Now add the renderer to the DOM

		document.body.appendChild( renderer.domElement );


		//And start animating it
		log("animate");

		animate();


		//For rotating the 3D object we use the mouse movement

		renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );

	}
}


//Adding geometries to group

function addShape( shape, extrude, color, x, y, z, rx, ry, rz, s ) {

	//Extrusion settings
	var extrudeSettings = {
		amount			: extrude*50,
		steps			: 1,
		material		: 0,
		extrudeMaterial : 1,
		bevelEnabled	: false
	};

	//Create the geometry
	var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

	//Set the color for the object
	for(var f = 0; f<geometry.faces.length; f++){
		geometry.faces[f].color.setRGB(color.r, color.g, color.b);
	}

	//Have a big amount of geometries will slow down THREE.js 
	//Instead we merge all geometries into one geometry
	groupGeometry.merge( geometry, geometry.matrix );
}


//Store the current mouse position in the mouse-object

function onDocumentMouseMove( event ) {

	event.preventDefault();

	mouse.x = ( event.clientX / window.innerWidth ) * Math.PI*4;
	mouse.y = ( event.clientY / window.innerHeight ) * Math.PI*4;
}


//Apply the mouse position on x/y rotation

function animate() {

	//Animate at 30fs framerate

	setTimeout( function() {
		requestAnimationFrame( animate );
	}, 1000/30 );


	//Animate and render the mesh

	mesh.rotation.x = mouse.y;
	mesh.rotation.y = mouse.x;


	//Animate the height of the objections

	if(animateHeight){
		heightScaler += 0.001;
	}

	mesh.scale.set(scale_factor * scale_x,scale_factor * scale_y,heightScaler);


	//Render the scene

	renderer.render( scene, camera );
}


//This is an experimental feature that allows us to save the generated mesh in an JSON-file, so we can skip the parsing and directly load the mesh
//So far the loading is not really working as expected

function saveObj(){
	var j = JSON.stringify(mesh.toJSON());
	var fcount = 100;
	for(var f = 0; f<fcount; f++){
		var ff = f;
		if(f<10){ff = "0"+f;}
		$.ajax({
			type: "POST",
			url: "save.php",
			data: {content: j.substring((j.length/fcount)*f,(j.length/fcount)*(f+1)), name:"model_"+ff+".json"}
		});
	}
}