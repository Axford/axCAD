// example file



// Define a new Part
// -----------------
Screw = new PartFactory('Screw');

Screw.author = 'Damian';
Screw.description = 'Common metric screws - e.g. cap, hex, button';

// Specification
// -------------
// good practise is to define sensible defaults, such that an example part can be
// made by passing a default specification

// specification prototype defines common parameters, e.g. supplier, unit cost, material
Screw.specification.addParam({name:'r',
							description:'thread radius',
							units:'mm',
							dataType:Number,
							visible:true,
							default:4,
							isKey:true,
							min:0.1,
							max:1000
						   });
// compact form, using alias for specification and short-hand parameter definition
Screw.spec.add('l','length','mm',Number,true,8,true,0.1,1000);

// define catalog source(s), source refers to a resource in the project
// if referenced as a part catalog, the host will automatically match up
// the resource file to the part specification, etc and provide a friendly editor
// for the specification data
// the load function queues a lazy load, later executed by the host
Screw.catalog.load({src:'Screws.csv',autoCreate:true, includeExample:true});

// the catalog can also be programmatically populated, specified values will
// be merged with defaults from the specification
Screw.catalog.add({r:5, l:20});

// Gather
// ------
// Get any parts/assemblies to be integrated with the new part
// gather any process information required
Screw.prototype.gather = function(spec) {
	// ensure the results are assigned to local variables
	// e.g. this.subPart = getPart('PoziDriveHead');
	
	// fetch manufacturing process information from the host
	// a process defines a set of specification info, e.g. tolerances
	// a process catalog stores specific values, much like for parts
	this.process = getProcess('3DPrint');
}



// Make
// -----------
// pass a concrete spec
// get back a concrete part
Screw.prototype.make = function(spec) {

	// the specification object is bound into the new part for later reference
	// common parameters are automatically extracted, e.g. material
	var part = new Part(spec);
	
	// do some CSG stuff to make a screw based on the spec
	var cube = CSG.roundedCube({radius: 10, roundradius: 2, resolution: 16});
  	var sphere = CSG.sphere({radius: 10, resolution: 16}).translate([5, 5, 5]);
  	var csg = cube.union(sphere);

	// define connectors
	part.connectors.add({name:'Base',pos:[0,0,0],dir:[0,0,-1]});
	part.connectors.add({name:'Tip',pos:[0,0,-spec.l.value],dir:[0,0,-1]});
	
	
	// define dimensions
	// can optionally be linked to a specification parameter
	// which allows for friendly annotations
	part.dimensions.addLinear({start:part.connectors.Base.pos, 
							   end:part.connectors.Tip.pos, 
							   param:spec.l,
							   offset: spec.l.value,
							   offsetDir = [1,0,0]);
	
	// dimension lies in plane of circle, as defined by normal
	part.dimensions.addRadius({origin:part.connectors.Base.pos,
							   normal: [0,0,1], 
							   radius:spec.r.value, 
							   param:spec.r,
							   offset: 5);
	
	
	part.fromCSG(csg);

	return part();	
} 	





// entry point for host to query factories contained in this file

function partFactories() {
	// return an array of partFactory objects
	return [screw];
}




// assemblyLines

ScrewAndWasher = new AssemblyLine('ScrewAndWasher');

ScrewAndWasher.author = 'Damian Axford';
ScrewAndWasher.description = 'Assembles a metric Screw and a metric Washer';

// define which parts are consumed in order to make this assembly
ScrewAndWasher.parts = ['Screw','Washer'];

// assembly specifications are generated using the specifications of the parts they
// consume - by convention, they only include the "key" parameter(s) of the parts
// the prototype also includes common values such as supplier, labour cost, labour time
// the specification can be extended in the same was a part specification

// A catalog can also be defined in the same way as for parts
ScrewAndWasher.catalog.load({src:'ScrewsAndWashers.csv',autoCreate:false, includeExample:false});
ScrewAndWasher.catalog.add({'ScrewName':'M4CapScrew', 'WasherName':'M4PennyWasher'});


// get the parts
ScrewAndWasher.prototype.gather = function(spec) {
	this.screw = getPart(spec.ScrewName);
	this.washer = getPart(spec.WasherName);
}

// make the assembly
ScrewAndWasher.prototype.make = function(spec) {

	var a = new Assembly();
	
	// can get sub-assemblies in a similar way
	// var b = getAssembly('SubAssembly1');
	
	// connect them, connect(partToConnect, self.connector, partToConnect.connector) 
	a.add(washer).connect(this.screw,'top','base');

	// define connectors for the assembly, in this case copying from one of the parts
	a.connectors.add(this.washer.connector('bottom'));
	
	
	// dimensions can be defined in same manner as for parts
	

	return a;
}



// entry point for host to query assembly lines contained in this file

function assemblyLines() {
	// return an array of assemblyLine objects
	return [ScrewAndWasher];
}



// Processes

3DPrint = new Process('3DPrint);
3DPrint.description = 'Defines common specification parameters for 3D printing';

3DPrint.specification.addParam({name:'nozzle',
							description:'nozzle radius',
							units:'mm',
							dataType:Number,
							visible:true,
							default:0.25
						   });
3DPrint.spec.add('layerHeight','layer height','mm',Number,true,0.3);

3DPrint.catalog.load({src:'3DPrintSettings.csv',autoCreate:true, includeExample:true});



// entry point for host to query processes contained in this file

function processes() {
	return [3DPrint];
}