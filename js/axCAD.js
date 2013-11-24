// axCAD
// Author: Damian Axford

// Requires:
//   csg.js
//   Three.js
//   ThreeCSG.js
//   arboreal.js
//   csv.js

//
// Utilities
// ---------

// used to generate DIV IDs
var sequentialIDNumbers = 0;
function nextSequentialIDNumber() {
	sequentialIDNumbers++;
	return sequentialIDNumbers;
}

// do async things in sequence
doInSequence = function(actions) {
  var self = function() {
	// if actions left, shift off the next function and call it passing self as the callback
    actions.length && actions.shift()(self);
  }
  // get things started
  self();
}

// count line breaks in a string
function lineBreakCount(str){
	/* counts \n */
	try {
		return((str.match(/[^\n]*\n[^\n]*/gi).length));
	} catch(e) {
		return 0;
	}
}

// class inheritance
function inherit(cls, superCls) {
    // We use an intermediary empty constructor to create an
    // inheritance chain, because using the super class' constructor
    // might have side effects.
    var construct = function () {};
    construct.prototype = superCls.prototype;
    cls.prototype = new construct;
    cls.prototype.constructor = cls;
    cls.super = superCls;
}

// for debugging line numbers
function getErrorObject(){
  try { throw Error('') } catch(err) { return err; }
}


// 
// Specification Item
// -----------------------
SpecificationItem = function() {
	this.name = '';
	this.description = '';
	this.units = '';
	this.dataType = Number;
	this.visible = true;
	this.default = 0;
	this.isKey = false;
	this.min = '';
	this.max = '';
}
SpecificationItem.prototype.fromArgs = function(name,desc,units,dataType,visible,def,isKey,min,max) {
	this.name = name;
	this.description =desc;
	this.units = units;
	this.dataType=dataType;
	this.visible=visible;
	this.default=def;
	this.isKey=isKey;
	this.min=min;
	this.max=max;
}


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
		max:max,
		value:0
	});
}


//
// Catalog
// -------

Catalog = function() {
	this.parent = null;
	this.loadQueue = [];
}
Catalog.prototype = [];

Catalog.prototype.load = function(args) {
	// queue it up, args of the form:
	// {src:'Screws.csv',autoCreate:true, includeExample:true}
	
	if (args.src) {
		this.loadQueue.push(args);
	}
}

Catalog.prototype.loadFromQueue = function() {
	for (i=0;i<this.loadQueue.length;i++) {
		var q = this.loadQueue[i];
		var res = project.getResourceByPath(q.src);
		
		// parse csv
		var c = CSV.parse(res.data.data);
		
		// now build each catalog item in turn
		for (j=1;j<c.length;j++) {
			var args = {};
			var row = c[j];
			
			for (k=0;k<row.length;k++) {
				args[c[0][k]] = row[k];
			}
			this.add(args);
		}
		
		// store a reference with the csv resource linking to this catalog/partFactory
		if (res.data.partFactories.indexOf(this.parent)<0)
			res.data.partFactories.push(this.parent);
	}
}

Catalog.prototype.thaw = function(c) {
	// populate self from c
	for (key in c) {
		this[key] = c[key];
	}
}

Catalog.prototype.add = function(args) {
	// get a default spec
	var spec = this.parent.getDefaultSpec();
	
	// add a partNo
	var si = new SpecificationItem();
	si.name = 'partNo';
	si.description = 'Catalog Part Number';
	si.isKey = true;
	spec.partNo = si;	
	
	// overwrite relevant values with args
	for (key in args) {
		if (spec[key])
			spec[key].value = args[key];
	}
	
	// and add to the catalog
	this.push(spec);
}



// 
// PartFactory
// -----------

var PartFactory = (function() {

	var cls = function(name) {
		this.name = name;
		this.author = '';
		this.description = '';

		this.specification = new Specification();
		this.catalog = new Catalog();
		this.catalog.parent = this;
		
		this.working = false;  // true when the factory is working
		
		this.resource = null;  // containing resource
		this.outfeed = [];  // queue for "customers" who are waiting for parts, holds callbacks against specs
		this.partBin = [];  // cache of parts
		
		this.onStartProduction = null;
		this.onProductionComplete = null;
	}

	cls.prototype.spec = function() {
		return this.specification;
	}

	cls.prototype.gather = function(spec) {
		return null;
	}

	cls.prototype.make = function(spec) {
		return null;
	}

	cls.prototype.freeze = function() {
		this.catalog.parent = null;
		return JSON.stringify(this);
		this.catalog.parent = this;
	}
	
	cls.prototype.thaw = function(d) {
		
		this.author = d.author;
		this.description = d.description;
		
		// thaw specification and catalog
		this.specification = d.specification;
		this.catalog.thaw(d.catalog);
		this.catalog.parent = this;
		
		// load referenced part catalogs
		this.catalog.loadFromQueue();
	}

	cls.prototype.getDefaultSpec = function() {
		// build spec object using defaults
		var spec = {};
		
		for (i=0;i<this.specification.length;i++) {
			var o = this.specification[i];
			spec[o.name] = {
				value: o.default,
				v: o.default,  // quick access
				description: o.description,
				units: o.units
			};
		}
		
		return spec;
	}

	return cls;
})();




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

Part.prototype.thaw = function(ref) {
	var parsed = JSON.parse(ref);
	this.csg = CSG.fromCompactBinary(parsed.csg);
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
	var csg = this.part.csg;
	
	var geom =  THREE.CSG.fromCSG( csg );
	geom.computeFaceNormals();
	
	this.mesh = new THREE.Mesh(geom, new THREE.MeshLambertMaterial(
    {
      color: 0xc0c0c0
    }));
	
	return this.mesh;
}


//
// WorkerManager
// --------------
// Manages communications within a worker
//
// Message format:
//   cmd: 
//   data: message specific data, may itelf be an object

WorkerManager = function() {
	var me = this;

	self.addEventListener('message', function(e) {
		if (e.data && e.data.cmd) {
			switch (e.data.cmd) {
				case 'start':
					me.start();
					break;
					
				case 'partFactory.make':
					me.partFactoryMake(JSON.parse(e.data.data));
					break;
			
				default:
					me.send('log','Unknown command received: '+e.data.cmd);
					break;
			}
		} else 
			me.send('log','Unknown message format');
	});

}

WorkerManager.prototype.send = function(cmd,data) {
	postMessage({cmd:cmd, data:data});
}

WorkerManager.prototype.start = function() {
	// partFactories
	if (partFactories) {
		try {
			pf = partFactories();
			
			if (Array.isArray(pf)) {
				for (i=0; i<pf.length;i++) {
					var p = pf[i];
					if (p && typeof(p.freeze) == 'function') 
						this.send('partFactory',pf[i].freeze());
					else {
						this.send('error','partFactories() must return an array of PartFactory objects - item '+i+' is not a valid PartFactory object');
					}
				}
			} else
				this.send('error','partFactories() must return an array of PartFactory objects');
		} catch(e) {
			this.send('error',e);
		}
	}
	
	// assemblyLines
	
	
	// processes

	
	// send a completion message once we're all done
	this.send('compiled','Compiled');
}

WorkerManager.prototype.partFactoryMake = function(d) {
	var partName = d.part;
	var partSpec = d.spec;
	
	var part = null;
	
	this.send('log','Preparing to make a '+partName+' with spec '+JSON.stringify(partSpec));
	
	// locate the relevant partFactory
	var pfs = partFactories();
	for (i=0;i<pfs.length;i++) {
		var pf = pfs[i];
		
		if (pf.name == partName) {
			// make something!		
			part = pf.make(partSpec);
			part.csg = part.csg.toCompactBinary();
		}
	}	
	
	this.send('partFactory.made',{
		'name': partName,
		'spec':JSON.stringify(partSpec),
		'part':JSON.stringify(part)
	});
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
	this.onerror = null;  // fired when syntax errors, etc occur (e.g. from worker)
	this.onchanged = null;  // general event fired when new content is received from worker, e.g. partFactories
	this.onnewpart = null;  // fired when new parts are received from a factory
	
	this.compileError = {};
	
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
	
	this.partFactories = [];
	this.assemblyLines = [];
	this.processes = [];
	
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


Resource.prototype.loadFromGithub = function() {

	if (this.isDir) return;

	if (this.onloading) this.onloading(this);

	var url = this.path + this.name;
	this.source = url;
	
	console.log('Loading resource: ',url);
	
	var me = this;
	
	fileSystemBroker.readGithubFile(url, function(err,data) {
	
		if (err) {
			console.log('Unable to load resource: '+url+', because: '+err);
		} else {		
			me.data = data;
		
			me.loaded = true;
		
			if (me.onloaded) me.onloaded(me);
			
			// auto compile if jscad file
			if (me.ext == 'jscad')
				me.compile();
				
		}
	});
}

Resource.prototype.updateData = function(data) {
	if (this.isDir) return;

	if (this.onloading) this.onloading(this);

	var me = this;
	me.data = data;
	me.loaded = true;
		
	if (me.onloaded) me.onloaded(me);
			
	// auto compile if jscad file
	if (me.ext == 'jscad')
		me.compile();
		
	// if I'm an include file?  tell everyone to re-compile
	// TODO
}

Resource.prototype.commitToGithub = function(cb) {
	fileSystemBroker.writeGithubFile(this.source, this.data, function(err) {
		if (cb) cb(err);
	});
}


resourceCompileErrorHandler = function(msg,url,lineNo,source) {
	// assume a project object has been defined!
	var res = project.getResourceByPath(source);
	if (res) {
		// check to see if this is a genuine syntax error
		if ((/Uncaught SyntaxError/).test(msg)) {	
			res.data.compileError.msg = msg;
			res.data.compileError.lineNo = lineNo - 1;   // offset by one to allow for generated first line
			console.log('Error compiling '+source+', '+msg+' on line '+(lineNo-1));
			
			// fire async callback, only if genuine syntax error
			if (res.data.compileCallback) res.data.compileCallback();
		}
	}
}

Resource.prototype.validateSyntax = function(cb) {
	var me = this;
	this.compileCallback = cb;
	window.onCompileError = resourceCompileErrorHandler;
	
	var tempblob = new Blob([
		'<html><head><script type="text/javascript">window.onerror = function(msg,url,lineno) { window.parent.onCompileError(msg,url,lineno,"'+ this.source +
		'"); return true; };</script></head>'+
		'<body><script>\r\n'+
		this.data+
		'\r\n</script></body></html>'
	], {type: 'text/html'});
	
	var iframe = $('<iframe id="testiframe'+nextSequentialIDNumber()+'"/>');
	iframe.on('error',function(e) {
	
	});
	iframe.on('load',function(e) {
		// tidy up
		window.URL.revokeObjectURL(iframe.attr('src'));
		iframe.remove();
	
		// check to see we haven't already fired a callback because of a syntax error
		if (!me.compileError.msg)
			cb();
	});
	iframe.attr('src',URL.createObjectURL(tempblob));
	$('#hidden').append(iframe);
}

Resource.prototype.sendToWorker = function(cmd,data) {
	console.log('Sending to worker: '+cmd+': '+data);
	this.worker.postMessage({cmd:cmd, data:JSON.stringify(data)});
}

Resource.prototype.receivePartFactory = function(pf) {
	var ppf = JSON.parse(pf);
	var npf = new PartFactory(ppf.name);
	npf.thaw(ppf);
	npf.resource = this;
	
	// override production methods
	npf.make = function(spec, cb) {
		npf.working = true;
		if (npf.onStartProduction) npf.onStartProduction(npf);
		
		// register the callback in the outfeed against the spec
		npf.outfeed.push({
			'spec':JSON.stringify(spec),
			'cb':cb
		});
		
		// search for a matching object in the partBin
		var part = null;
		var specJSON = JSON.stringify(spec);
		for (i=0;i<npf.partBin.length;i++) {
			if (JSON.stringify(npf.partBin[i].spec) == specJSON) {
				console.log('Found a part in the bin');
				part = npf.partBin[i];
				break;
			}
		}
		
		if (part) {
			npf.working = false;
			cb(part);
			if (npf.onProductionComplete) npf.onProductionComplete(npf);
		} else {
			// if nothing matches, set the factory going
			npf.resource.sendToWorker('partFactory.make',{'part':npf.name,'spec':spec});
		}
	}
	
	this.partFactories.push(npf);
}

Resource.prototype.getPartFactoryByName = function(n) {
	var pf = null;
	
	for (i=0;i<this.partFactories.length;i++) {
		if (this.partFactories[i].name == n) {
			pf = this.partFactories[i];
		}
	}
	
	return pf;
}

Resource.prototype.receivePart = function(p) {

	// lookup match partFactory
	var pf = this.getPartFactoryByName(p.name);
	
	// lookup matching request in outfeed
	var targetSpec = p.spec;
	
	// thaw out part
	var part = new Part(JSON.parse(p.spec));
	part.thaw(p.part);
	
	// add to part bin
	pf.partBin.push(part);
	
	// search outfeed for matching callback(s)
	for (i=pf.outfeed.length-1;i>=0;i--) {
		if (pf.outfeed[i] && pf.outfeed[i].spec) {
			if (pf.outfeed[i].spec == targetSpec) {
			
				// firing callback
				pf.outfeed[i].cb(part);
				
				// remove callback from outfeed
				pf.outfeed[i] = null;
				pf.outfeed = pf.outfeed.splice(i+1,1);
			}
		}
	}

	pf.working = false;
	
	// fire the production complete message
	if (pf.onProductionComplete) pf.onProductionComplete(pf);
}

Resource.prototype.onWorkerMessage = function(e) {
	//console.log('Received from worker: '+e.data.cmd + ', '+e.data.data);
	
	if (e.data && e.data.cmd) {
		switch(e.data.cmd) {
			case 'partFactory':
				this.resource.receivePartFactory(e.data.data);
				if (this.resource.onchanged) this.resource.onchanged(this.resource);
				break;
				
			case 'partFactory.made':
				this.resource.receivePart(e.data.data);
				break;
				
			case 'compiled':
				// fully compiled!
				console.log('fully compiled');
				if (this.resource.oncompiled) this.resource.oncompiled(this.resource);
				break;
				
			case 'error':
				this.resource.compileError.msg = e.data.data;
				this.resource.compileError.lineNo = 0;
				if (this.resource.onerror) this.resource.onerror(this.resource);
				break;
				
			case 'log':
				console.log('Log from worker: '+e.data.data);
				break;
		
			default:
				console.log('Received unknown worker cmd: '+e.data.cmd+', '+e.data.data);
		}
	} else
		console.log('Received worker message in unknown format'+e);
}

Resource.prototype.onWorkerError = function(e) {
	console.log('Error from worker: '+e.message + ' on line '+ (e.lineno - this.resource.scriptStartLineNo));
	this.resource.compileError.msg = e.message;
	this.resource.compileError.lineNo = e.lineno - this.resource.scriptStartLineNo;
	
	if (this.resource.onerror) this.resource.onerror(this.resource);
	
	return true;
}

Resource.prototype.reallyCompile = function(cb) {
	// concat data and includes
	var scr = '';
	
	var includes = this.project.settings.include;
	for (i=0; i<includes.length; i++) {
		var res = project.getResourceByPath(includes[i]);
		if (res) {
			scr += res.data.data + '\r\n';
		}
	}
	
	// inject workerManager
	scr += 'workerManager = new WorkerManager();\r\n';
	
	this.scriptStartLineNo = lineBreakCount(scr);
	
	// finally, include the script itself
	scr += this.data;
	
	this.combinedScript = scr;
	
	// clear old objects
	this.blob = null;
	if (this.worker) this.worker.terminate();
	this.worker = null;
	
	// build a blob and worker
	this.blob = new Blob([scr], {type: 'text/javascript'});
	
	// compile
	if (this.blobURL) URL.revokeObjectURL(this.blobURL);
	this.blobURL = URL.createObjectURL(this.blob);
	this.worker = new Worker(this.blobURL);
	this.worker.resource = this;
	
	this.worker.addEventListener('message', this.onWorkerMessage, false);
	this.worker.addEventListener('error', this.onWorkerError, false);
	
	// kick it off
	this.sendToWorker('start','');
	
	cb();
}

Resource.prototype.compile = function() {

	if (!this.isDir && this.ext == 'jscad') {
	
		// check "includes" have been loaded
		var allDone = true;
		var includes = this.project.settings.include;
		for (i=0; i<includes.length; i++) {
			var res = project.getResourceByPath(includes[i]);
			if (res) {
				if (!res.data.loaded) {
					allDone = false;
					break;
				}
			}
		}
		if (!allDone) {
			var me = this;
			setTimeout(function() {
				me.compile();
			},10);
			return;
		}
	
	
		if (this.oncompiling) this.oncompiling(this);
	
		// clear old errors
		this.compileError.msg = undefined;
		this.compileError.lineNo = undefined;
	
		// flush out old stuff
		// e.g. blobs, workers, cached objects
		this.partFactories = [];
		this.assemblyLines = [];
		this.processes = [];
		
		console.log('About to compile...',this);
		
		var me = this;
	
		var actions = [
			// validateSyntax
			function(cb) {
				me.validateSyntax(cb);
			},
			// do the actual compiling
			function(cb) {
				// check for syntax errors
				if (!me.compileError.msg) 
					me.reallyCompile(cb)
				else
					cb();
			}
			// got to the end, but partFactories,etc won't yet be extracted
		];
	
		doInSequence(actions);
		
	} else {
		// report bad things?
	}
}


//
// Project
// -------
// A working collection of part, assemblies, scripts, etc

Project = function(name) {
	
	this.name = name;
	
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
	
	// extract name
	this.name = this.settings.name;
	
	// go load any resources for the project
	this.parseResources();
}

Project.prototype.loadFromGithub = function(path, cb) {

	console.log('Loading project: ',path);

	var project = this;
	
	fileSystemBroker.readGithubFile(path, function(err,data) {
	
		// expect in JSON format
		project.settings = JSON.parse(data);
		project.settings.source = path;
		
		// extract name
		project.name = project.settings.name;
		
		// go load any resources for the project
		project.parseResources();
		
		if (cb) cb();
	});
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
			if (res.data.loadFromGithub) {
				res.data.loadFromGithub();
			}
		}
	}
	
	this.resources.traverseDown(iterator);
}

Project.prototype.getResourceByPath = function(path) {
	return this.resources.find(function(node) {
		return node.data.source == path;
	});
}

Project.prototype.getResourceByID = function(resID) {
	return this.resources.find(resID);
}

Project.prototype.compileResources = function() {
	function iterator(res) {
		if (res.data) {
			if (res.data.loaded && res.data.ext == 'jscad') {
				res.data.compile();
			}
		}
	}
	
	this.resources.traverseDown(iterator);
}


//
// FileSystemBroker
// -----------------

FileSystemBroker = function() {
	this.github;
	this.gitToken = '';
	this.gitUser;
	this.gitRepo;
	this.gitBranch = '';
	this.gitRepoInfo;
}

FileSystemBroker.prototype = {};

FileSystemBroker.prototype.connectToGithub = function(token) {
	this.gitToken = token;
	this.github = new Github({
		'token': token
	});
	
	this.gitUser = this.github.getUser();
}

FileSystemBroker.prototype.getUserRepos = function(cb) {
	if (this.github && this.gitUser) 
		this.gitUser.repos(cb)
	else
		cb('Not connected to git', undefined);
}

FileSystemBroker.prototype.getGithubRepo = function(owner,name) {
	this.gitRepo = this.github.getRepo(owner,name);
	return this.gitRepo;
}	

FileSystemBroker.prototype.getGithubRepoBranches = function(cb) {
	this.gitRepo.listBranches(cb);
}

FileSystemBroker.prototype.getGithubRepoTree = function(branch, cb) {
	this.gitBranch = branch;
	this.gitRepo.getTree(branch, cb);
}

FileSystemBroker.prototype.readGithubFile = function(path, cb) {
	this.gitRepo.read(this.gitBranch, path, cb);
}

FileSystemBroker.prototype.writeGithubFile = function(path, data, cb) {
	var commitMsg = 'Commit from axCAD '+Date.now();
	this.gitRepo.write(this.gitBranch, path, data, commitMsg, cb);
}

// global broker
var fileSystemBroker = new FileSystemBroker();