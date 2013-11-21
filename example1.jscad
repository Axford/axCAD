importScripts('js/csg.js');

function main() {
  var cube = CSG.roundedCube({radius: 10, roundradius: 2, resolution: 16});
  var sphere = CSG.sphere({radius: 10, resolution: 16}).translate([5, 5, 5]);
  var cyl = CSG.cylinder({start:[0,0,0], end:[0,20,0], radius:5});
  var csg = cube.union(cyl);

  //csg = csg.union(cyl);
	
  return csg;
}