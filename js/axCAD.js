// axCAD
// Author: Damian Axford

// Requires:
//   csg.js
//   Three.js
//   ThreeCSG.js
//   arboreal.js


//
// Specification
// -------------

Specification = function() {
}
Specification.prototype = [];

Specification.prototype.addParam = function(args) {
	this.push(args);
}

Specification.prototype.add = function(name,desc,units,dataType,visible,def,isKey,min,max) {
	this.addParam({
		name:name,
		description:desc,
		units:units,
		dataType:dataType,
		visible:visible,
		default:def,
		isKey:isKey,
		min:min,
		max:max
	});
}


//
// Catalog
// -------

Catalog = function() {
}
Catalog.prototype = [];

Catalog.prototype.load = function(args) {
	// queue it up
}

Catalog.prototype.add = function(args) {
	this.push(args);
}



// 
// PartFactory
// -----------

PartFactory = function(name) {
	this.name = name;
	this.author = '';
	this.description = '';

	this.specification = new Specification();
	this.catalog = new Catalog();
}

PartFactory.prototype.spec = function() {
	console.log(this.specification);
	return this.specification;
}

PartFactory.prototype.gather = function(spec) {
	return null;
}

PartFactory.prototype.make = function(spec) {
	return null;
}


// 
// Connectors

Connectors = function() {
	
}
Connectors.prototype = [];

Connectors.prototype.add = function(args) {
	this.push(args);
}



// 
// Dimensions
// ----------

Dimensions = function() {
	
}
Dimensions.prototype = [];

Dimensions.prototype.addLinear = function(args) {
	this.push(args);
}

Dimensions.prototype.addRadius = function(args) {
	this.push(args);
}


//
// Visualisations
// --------------

Visualisations = function() {}
Visualisations.prototype = [];



// 
// Part
// ----

Part = function(spec) {
	this.csg = null;
	this.spec = spec;
	this.connectors = new Connectors();
	this.dimensions = new Dimensions();
	this.visualisations = new Visualisations();
}
Part.prototype = {};

Part.prototype.fromCSG = function(csg) {
	this.csg = csg;
}

Part.prototype.visualiseWithGL = function() {
	this.visualisations.push(new GLVisualisation(this));
}




//
// GLVisualisation
// ---------------

GLVisualisation = function(part) {
	this.part = part;
	this.mesh = null;
	this.compile();
}

GLVisualisation.prototype.compile = function() {
	console.log('compiling...');	
	
	var csg = this.part.csg;
	
	var geom =  THREE.CSG.fromCSG( csg );
	geom.computeFaceNormals();
	
	this.mesh = new THREE.Mesh(geom, new THREE.MeshLambertMaterial(
    {
      color: 0xc0c0c0
    }));
	
	
	
	console.log('Compilation complete');
	
	return this.mesh;
}


//
// Resource
// --------
// A resource within a project (e.g. a file)

Resource = function(name) {
	this.name = name;
	
	this.data = '';  // resource data stored as a string
	
	this.source = '';  // where did it come from?  e.g. url
	
	this.project = undefined;
	
	// extend to support filesystem linkage, e.g. github, dropbox
}

Resource.prototype = {};

Resource.prototype.loadFromURL = function(url) {
	this.source = url;
	
	console.log('Loading resource: ',url);
	
	var xmlHttp = null;
	xmlHttp = new XMLHttpRequest();
	xmlHttp.open( "GET", url, false );
	xmlHttp.send( null );
	
	this.data = xmlHttp.responseText;
}


//
// Project
// -------
// A working collection of part, assemblies, scripts, etc

Project = function() {
	
	this.settings = {};
	
	this.resources = new Arboreal();
	
	this.loadDefaultSettings();
}

Project.prototype = {};

Project.prototype.loadDefaultSettings = function() {
	// clear current settings
	this.settings = {};
	
}


Project.prototype.loadFromURL = function(url) {

	console.log('Loading project: ',url);

	var xmlHttp = null;
	xmlHttp = new XMLHttpRequest();
	xmlHttp.open( "GET", url, false );
	xmlHttp.send( null );
	
	// expect in JSON format
	this.settings = JSON.parse(xmlHttp.responseText);
	this.settings.source = url;
	
	// go load any resources for the project
	this.loadResources();
}

Project.prototype.loadResources = function() {
	
	function parseAndLoad(parentNode,path,res) {
		// iterate over res contents
		for (r in res) {
			
			var rtemp = new Resource(res[r].name);
			
			var node = parentNode.appendChild(rtemp);
			
			if (res[r].resources) {
				parseAndLoad(node, path + rtemp.name + '/', res[r].resources);
			} else {
				rtemp.loadFromURL(path + rtemp.name);
			}
				
		} 
	}
	
	parseAndLoad(this.resources, '', this.settings.resources);

}








