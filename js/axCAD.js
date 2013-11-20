// axCAD
// Author: Damian Axford

// Requires:
//   csg.js

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
	
	this.mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } ));
	
	console.log('Compilation complete');
	
	return this.mesh;
}








