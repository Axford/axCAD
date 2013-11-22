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

Resource = function(name, isDir, path) {
	this.name = name;
	this.isDir = isDir;
	this.path = path;
	this.loaded = false;
	
	this.onloading = null;
	this.onloaded = null;
	this.oncompiling = null;
	this.oncompiled = null;
	
	this.compileerror = {};
	
	this.data = '';  // resource data stored as a string
	
	this.blob = null;
	this.worker = null;
	
	// extract file extension
	var nameParts = name.split('.');
	
	if (nameParts.length>1) {
		this.ext = nameParts[nameParts.length-1];
	} else {
		this.ext = '';
	}
	
	this.source = '';  // where did it come from?  e.g. url
	
	this.project = undefined;
	
	// extend to support filesystem linkage, e.g. github, dropbox
}

Resource.prototype = {};

Resource.prototype.load = function() {

	if (this.onloading) this.onloading(this);

	var url = this.path + this.name;
	this.source = url;
	
	console.log('Loading resource: ',url);
	
	var xmlHttp = null;
	xmlHttp = new XMLHttpRequest();
	xmlHttp.open( "GET", url, false );
	xmlHttp.send( null );
	
	this.data = xmlHttp.responseText;
	
	this.loaded = true;
	
	if (this.onloaded) this.onloaded(this);
}

Resource.prototype.compileErrorHandler = function(msg,url,lineno) {
	this.compileerror.msg = msg;
	this.compileerror.lineno = lineno;
}

Resource.prototype.compile = function() {

	if (!this.isDir && this.ext == 'jscad') {
		if (this.oncompiling) this.oncompiling(this);
	
		this.compileerror.msg = undefined;
		this.compileerror.lineno = undefined;
	
		// flush out old stuff
		
		// test resource has valid syntax
		window.onCompileError = this.compileErrorHandler;

		var tempblob = new Blob([
			'<html><head><script type="text/javascript">window.onerror = function(msg,url,lineno) { window.parent.onCompileError(msg,url,lineno); return true; };</script></head>'+
			'<body><script>\r\n'+
			this.data+
			'\r\n</script></body></html>'
		], {type: 'text/html'});
		
		var iframe = $('<iframe id="testiframe"/>');
		iframe.on('error',function(e) {
		
		});
		iframe.on('load',function(e) {
			// see what we got?
			// how to chain?
		});
		iframe.attr('src',URL.createObjectURL(tempblob));
		$('#hidden').append(iframe);
		
		
		/*
		try {
			f = new Function(this.data);
		} catch(e) {
			
			console.log(e);
			return;
		}
		
		
		// concat data and includes
		var scr = '';
		
		var includes = this.project.settings.include;
		for (i=0; i<includes.length; i++) {
			var res = project.getResourceByPath(includes[i]);
			if (res) {
				scr += res.data.data + '\r\n';
			}
		}
		
		scr += this.data;
		
		this.combinedScript = scr;
		
		console.log('Combined script: '+scr);
		
		// build a blob and worker
		this.blob = new Blob([scr], {type: 'text/javascript'});
		
		// compile (report syntax errors)
		this.worker = new Worker(URL.createObjectURL(this.blob));
		
		
		*/
		
	
	
		if (this.oncompiled) this.oncompiled(this);
	} else {
		// report bad things?
	}
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
	this.parseResources();
}

Project.prototype.parseResources = function() {
	
	function parse(parentNode,path,res, project) {
		// iterate over res contents
		for (r in res) {
			var isDir = Array.isArray(res[r].resources);
			
			var rtemp = new Resource(res[r].name, isDir, path);
			rtemp.project = project;
			
			var node = parentNode.appendChild(rtemp);
			
			if (isDir) {
				parse(node, path + rtemp.name + '/', res[r].resources);
			}
				
		} 
	}
	
	parse(this.resources, '', this.settings.resources, this);
}

Project.prototype.loadResources = function() {
	
	function iterator(res) {
		if (res.data) {
			if (res.data.load) {
				res.data.load();
			}
		}
	}
	
	this.resources.traverseDown(iterator);
}

Project.prototype.getResourceByPath = function(path) {
	console.log('Looking for: '+path);

	return this.resources.find(function(node) {
		return node.data.source == path;
	});
}




