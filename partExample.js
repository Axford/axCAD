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
							default:4
						   });
// compact form, using alias for specification and short-hand parameter definition
Screw.spec.add('l','length','mm',Number,true,8);


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

	part.connectors.add({name:'Base',pos:[0,0,0],dir:[0,0,-1]});
	part.connectors.add({name:'Tip',pos:[0,0,-spec.l],dir:[0,0,-1]});
	
	
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

// make the assembly
ScrewAndWasher.make = function(spec) {

	var a = new Assembly();

	// go get some parts
	var screw = getPart(spec.ScrewName);
	var washer = getPart(spec.WasherName);
	
	// connect them, connect(partToConnect, self.connector, partToConnect.connector) 
	a.add(washer).connect(screw,'top','base');

	// define connectors for the assembly, in this case copying from one of the parts
	a.connectors.add(washer.connector('bottom'));

	return a;
}



// entry point for host to query assembly lines contained in this file

function assemblyLines() {
	// return an array of assemblyLine objects
	return [ScrewAndWasher];
}

