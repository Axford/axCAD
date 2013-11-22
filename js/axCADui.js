
var bodyLayout;
var panelLayout;
var editor;
var camera, scene, renderer, light;
var geometry, material;
var project;
var stats;
var selectedResource;
	
function initUI() {
	bodyLayout = $('body').layout();

	panelLayout = $('#panel').layout({
		west__size: '50%',
		spacing_open: 20,
		onresize: function(Instance, state, options, name) {
			resizeUI();
		}
	});

	editor = ace.edit("editor");
	editor.setTheme("ace/theme/axcad");
	editor.getSession().setMode("ace/mode/javascript");
	editor.getSession().setUseWrapMode(true);
	editor.setFontSize('14px');
	
	$('#openButton').click(function() { openProject(); });
	
   	initGLViewer();
    animateGLViewer();
	
	// resize now to make sure everything is neat and tidy
	resizeUI();
	
	// event handlers
	$( window ).resize(function() {
		resizeUI();
	});
}

	
function initGLViewer() {
	// get container element
	var glElement = $( '#gl' );
	
	camera = new THREE.PerspectiveCamera( 75, glElement.width() / glElement.height(), 1, 10000 );
	camera.position.z = 100;

	scene = new THREE.Scene();

	//mesh = screw.visualisations[0].mesh;
	//mesh.geometry.computeBoundingBox();
	
	//mesh.castShadow = true;
	//mesh.receiveShadow = true;
	
	var planeGeo = new THREE.PlaneGeometry(200, 200, 10, 10);
	var planeMat = new THREE.MeshLambertMaterial({color: 0xFFFFFF});
	var plane = new THREE.Mesh(planeGeo, planeMat);
	plane.rotation.x = -Math.PI/2;
	plane.position.y = -25;
	plane.receiveShadow = true;
	scene.add(plane);

	
	var ambient	= new THREE.AmbientLight( 0x909090 );
	scene.add( ambient );
	
	light	= new THREE.SpotLight( 0x606060, 2 );
	light.target.position.set( 0, 0, 0 );
	light.shadowCameraNear		= 10;
	light.castShadow		= true;
	light.shadowDarkness		= 0.4;
	//light.shadowCameraVisible	= true;
	//light.position = mesh.geometry.boundingBox.max;
	light.position.x += 20;
	light.position.y += 20;
	light.position.z = 50;
	
	scene.add( light );
	
	//scene.add( mesh );

	renderer = new THREE.WebGLRenderer({
				antialias		: true,	// to get smoother output
				preserveDrawingBuffer	: true,	// to allow screenshot
				clearAlpha: 1.0,
				clearColor: 0xffffff
			});
	renderer.shadowMapEnabled	= true;
	renderer.shadowMapSoft		= true;
	renderer.physicallyBasedShading = true;
	
	renderer.setClearColor(0xFFFFFF, 1);
	
	renderer.setSize( glElement.width(), glElement.height() );

	// append to dom
	glElement.append(renderer.domElement);
	
	// stats
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	stats.domElement.style.zIndex = 100;
	glElement.append( stats.domElement );

	// controls
	controls = new THREE.OrbitControls( camera , glElement[0]);
	//controls.addEventListener( 'change', renderer );
}

function animateGLViewer() {
	requestAnimationFrame( animateGLViewer );
	
	renderer.render( scene, camera );
	stats.update();
}


function resizeGL() {
	var glElement = $( '#gl' );
	renderer.setSize( glElement.width(), glElement.height() );
	camera.aspect	= glElement.width() / glElement.height();
	camera.updateProjectionMatrix();
}


function resizeUI() {
	$('#editor').height(
		$('#editorPanel').height() - 
		$('#editorRibbon').height() -
		18
	);
	
	editor.resize();
	resizeGL();
			
}


function updateResourceTree() {


	function outputNode(node, parentDomNode) {
		var mu ='';
		
		console.log();
		
		var n = parentDomNode;
		
		if (typeof node.data.name != 'undefined') {
			n = $('<li><div>'+node.data.name+'</div></li>');
			n.data({resourceID: node.id});
			node.data.domElement = n;
			
			// bind event handlers
			n.click(function(e) {
				e.stopPropagation();
				editFile(this);
			});
			
			node.data.onloading = function(node) {
				// loading icon?
			};
			node.data.onloaded = function(node) {
				node.domElement.children('div').addClass('loaded');
			};
			
			parentDomNode.append(n);
		}
		
		if (node.children.length > 0) {
			var ul = $('<ul/>');
			n.append(ul);
			for (i=0; i < node.children.length; i++)
				outputNode(node.children[i], ul);
			
		} else {
			
		}
		
		return mu;
	}
	
	outputNode(project.resources, $('#resourceTree'));
}

function editFile(node) {
	var resID = $(node).data().resourceID;
	var resource = project.resources.find(resID);
	
	if (resource.data.loaded && !resource.data.isDir) {
		// save changes to previous file?
		if (selectedResource) {
			selectedResource.children('div').removeClass('selected');
		}
		
		selectedResource = $(node);
	
		selectedResource.children('div').addClass('selected');
		
		editor.setValue(resource.data.data, -1);
		editor.getSession().setMode("ace/mode/javascript");
		editor.resourceID = resID;	
		
		$('#resourceName').val(resource.data.name);
		
	} else {
		// not yet loaded...
	}
}

function openProject() {
	var path=prompt("Project path","testProject.json");
		
	if (path != null) {
		project.loadFromURL('testProject.json');
		
		updateResourceTree();
		
		project.loadResources();
		
		// TEST
		project.resources.children[0].data.compile();
		editor.setValue(project.resources.children[0].data.combinedScript ,-1);
	}
}