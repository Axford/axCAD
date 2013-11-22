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
Screw.specification.add('l','length','mm',Number,true,8,true,0.1,1000);

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
Screw.gather = function(spec) {
	// ensure the results are assigned to local variables
	// e.g. this.subPart = getPart('PoziDriveHead');
	
	// fetch manufacturing process information from the host
	// a process defines a set of specification info, e.g. tolerances
	// a process catalog stores specific values, much like for parts
	//this.process = getProcess('3DPrint');
}



// Make
// -----------
// pass a concrete spec
// get back a concrete part
Screw.make = function(spec) {

	// the specification object is bound into the new part for later reference
	// common parameters are automatically extracted, e.g. material
	var part = new Part(spec);
	
	// do some CSG stuff to make a screw based on the spec
	var cube = CSG.roundedCube({radius: 10, roundradius: 2, resolution: 16});
  	var sphere = CSG.sphere({radius: 10, resolution: 16}).translate([10, 5, 5]);
	var cyl = CSG.cylinder({start:[0,0,0], end:[3,40,0], radius:5});
  
  	var csg = cube.union(cyl).union(sphere);

	// define connectors
	part.connectors.add({name:'Base',pos:[0,0,0],dir:[0,0,-1]});
	part.connectors.add({name:'Tip',pos:[0,0,-spec.l.value],dir:[0,0,-1]});
	
	invalid line...
	
	// define dimensions
	// can optionally be linked to a specification parameter
	// which allows for friendly annotations
	//part.dimensions.addLinear({start:part.connectors.Base.pos, 
	//						   end:part.connectors.Tip.pos, 
	//						   param:spec.l,
	//						   offset: spec.l.value,
	//						   offsetDir: [1,0,0]});
	
	// dimension lies in plane of circle, as defined by normal
	//part.dimensions.addRadius({origin:part.connectors.Base.pos,
	//						   normal: [0,0,1], 
	//						   radius:spec.r.value, 
	//						   param:spec.r,
	//						   offset: 5});
	
	
	part.fromCSG(csg);

	return part;	
} 	