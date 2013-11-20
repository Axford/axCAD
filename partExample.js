// example file



// Define a new Part
// -----------------
screw = new partFactory('Screw');

screw.author = 'Damian';
screw.description = 'Common metric screws - e.g. cap, hex, button';

// Specification
// -------------
// good practise is to define sensible defaults, such that an example part can be
// made by passing a default specification

// specification prototype defines common parameters, e.g. supplier, unit cost, material
screw.specification.addParam({name:'r',
							description:'thread radius',
							units:'mm',
							dataType:Number,
							visible:true,
							default:4
						   });
// compact form, using alias for specification and short-hand parameter definition
screw.spec.add('l','length','mm',Number,true,8);


// Make
// -----------
// pass a concrete spec
// get back a concrete part
screw.make = function(spec) {

	var part = new Part();

	part.material = self.specification.material;

	// do some CSG stuff to make a screw based on the spec
	var cube = CSG.roundedCube({radius: 10, roundradius: 2, resolution: 16});
  	var sphere = CSG.sphere({radius: 10, resolution: 16}).translate([5, 5, 5]);
  	var csg = cube.union(sphere);
	
	part.fromCSG(csg);

	return part();	
} 	





// entry point for host to query factories contained in this file

function partFactories() {
	// return an array of partFactory objects
	return [screw];
}


