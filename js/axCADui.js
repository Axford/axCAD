
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

	editor = ace.edit("sourceEditor");
	editor.setTheme("ace/theme/axcad");
	editor.getSession().setMode("ace/mode/javascript");
	editor.getSession().setUseWrapMode(true);
	editor.setFontSize('14px');
	
	$('#projectOpenButton').click(function() { openProject(); });
	
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
	// do autoHeights
	$('.autoHeight').each(function(index) {
		// get parent height
		var me = $(this);
		var parentH = me.parent().height();
		
		// get height of any visible siblings before this in hierarchy
		var sibH = 0;
		me.prevAll(':visible').each(function(index2) {
			sibH += $(this).outerHeight(true);
		});
		
		// calc own height, minus own margins
		me.height(parentH - sibH - me.outerHeight(true) + me.height());
	});
	
	editor.resize();
	resizeGL();
			
}


function updateResourceTree() {


	function outputNode(node, parentDomNode) {
		var mu ='';
		
		console.log();
		
		var n = parentDomNode;
		
		if (typeof node.data.name != 'undefined') {
			n = $('<li/>');
			d = $('<div/>');
			d.html(node.data.name);
			n.append(d);
			n.data({resourceID: node.id});
			node.data.domElement = n;
			
			// check resource type
			if (node.data.isDir) d.addClass('directory');
			if (node.data.ext == 'js') d.addClass('js');
			if (node.data.ext == 'jscad') d.addClass('jscad');
			
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
			node.data.oncompiling = function(node) {
				node.domElement.children('div').removeClass('error');
				node.domElement.children('div').removeClass('compiled');
				node.domElement.children('div').addClass('compiling');
			}
			node.data.oncompiled = function(node) {
				// check for errors
				node.domElement.children('div').removeClass('compiling');
				
				if (node.compileError.msg) 
					node.domElement.children('div').addClass('error')
				else {
					node.domElement.children('div').addClass('compiled');
				}
			}
			node.data.onerror = function(node) {
				if (node.compileError.msg) {
					node.domElement.children('div').addClass('error');
					node.domElement.children('div').removeClass('compiled');
					
					console.log('Error in '+node.name+': '+node.compileError.msg);
				}
			}
			node.data.onchanged = function(node) {
				updateResourceContents(node);
			}
			
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
	
	// insert project node
	var div = $('<div/>');
	div.html(project.name);
	div.addClass('project');
	$('#resourceTree').prepend(div);
}

function updateResourceContents(node) {

	// empty current contents
	node.domElement.children('ul').remove();
	
	if (node.compileError.msg) {
		
	} else {
		var ul = $('<ul/>');
		node.domElement.append(ul);
	
		//partFactories
		for (i=0;i<node.partFactories.length;i++) {
			var pf = node.partFactories[i];
			
			var n = $('<li/>')
			var d = $('<div/>');
			d.addClass('partFactory');
			d.html(pf.name);
			d.data({partFactory:pf, resource:node});
			d.click(function(e) {
				e.stopPropagation();
				viewPartFactory(this);
			});
			n.append(d);
			ul.append(n);
		}
		
		// assemblyLines
		
	
	}
}

function viewPanel(p) {
	
	// hide other panels
	$('.contextPanel').hide();
	
	// show requested panel
	$('#'+p+'Panel').show();
	
	// ensure contents are sized correctly
	resizeUI();
}

function editFile(node) {
	var resID = $(node).data().resourceID;
	var resource = project.resources.find(resID);
	
	if (resource.data.loaded && !resource.data.isDir) {
		// save changes to previous file?
		if (selectedResource) {
			selectedResource.children('div').removeClass('selected');
		}
		
		// switch panels
		viewPanel('source');
		
		// mark selected not in resource list
		selectedResource = $(node);
	
		selectedResource.children('div').addClass('selected');
		
		var lineNo = -1;
		if (resource.data.compileError.lineNo) lineNo = resource.data.compileError.lineNo;
		
		editor.setValue(resource.data.data, lineNo - 5);
		editor.gotoLine(lineNo);
		editor.getSession().setMode("ace/mode/javascript");
		editor.resourceID = resID;	
		
		$('#sourceResourceName').val(resource.data.name);
		
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
		
		project.compileResources();
	}
}

function viewPartFactory(node) {
	// switch panels
	viewPanel('partFactory');

	// load content
	var partFactory = $(node).data().partFactory;
	var resource = $(node).data().resource;
	
	
	$('#partFactoryName').html(partFactory.name + ' <span class="subtle">PartFactory</div>');

	$('#partFactoryDesc').html(partFactory.description);
	$('#partFactoryAuthor').html('Created by '+partFactory.author);
	
	// update button event handler
	$('#partFactoryExampleButton').click(function(e) {
		visualisePartFactoryExample(partFactory);
	});
	
	// generate specification table
	$('#partFactorySpec').empty();
	
	if (partFactory.specification.length > 0) {
		var table = document.createElement('table');
		
		// build headings
		var thr = document.createElement('tr');
		for (key in partFactory.specification[0]) {
			var th = document.createElement('th');
			th.textContent = key;
			thr.appendChild(th);
		}
		table.appendChild(thr);
		
		// populate rows
		for (i=0; i < partFactory.specification.length; i++) {
			var tr = document.createElement('tr');
			
			// iterate over headings
			for (j=0; j<thr.children.length; j++) {
				var td = document.createElement('td');
				if (j==0)
					$(td).addClass('bold');
				td.textContent = partFactory.specification[i][thr.children[j].textContent];
				tr.appendChild(td);
			}
			
			table.appendChild(tr);
		}
		
		$('#partFactorySpec').append(table);
	}
	
	
	// generate catalog table
	$('#partFactoryCatalog').empty();
	
	
	
}


function visualisePartFactoryExample(pf) {
	
	// generate a default specification
	var spec = pf.getDefaultSpec();
	
	// go make a suitable part
	pf.make(spec, function(part) {
		// visualise it
		console.log('Received part');
		
		part.visualiseWithGL();
		
		var mesh = part.visualisations[0].mesh;
		mesh.geometry.computeBoundingBox();
		
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		
		scene.add(mesh);
	});
	
	
	
}