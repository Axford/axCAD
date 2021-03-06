
var bodyLayout;
var panelLayout;
var editor;
var camera, scene, renderer, light;
var geometry, material;
var project;
var stats;
var selectedResource;
var selectedPartFactory;
var visualisedPartFactory;
var visualisedPartFactoryResource;
var visualisedSpec;

var projectGitAccordion;

function notify(msg, type) {
	console.log('Notification: '+type + ' = '+msg);
	var timeout = 1000 + msg.length * (1000/40);
	if (type == 'error' || type == 'warning')
		timeout = false;
	var n = noty({
		'text': msg,
		'type': type,
		'timeout': timeout,
		animation: {
			open: {height: 'toggle'},
			close: {height: 'toggle'},
			easing: 'swing',
			speed: 200
		}
	});
}
	
function initUI() {

	// panel layouts
	bodyLayout = $('body').layout();

	panelLayout = $('#panel').layout({
		west__size: '50%',
		spacing_open: 20,
		onresize: function(Instance, state, options, name) {
			resizeUI();
		}
	});

	// projectPanel
	projectGitAccordion = new jQueryCollapse($("#projectGitAccordion"));

	$('#projectGitConnectButton').click(function(e) {
		var gitToken = $('#projectGitAccordion').find('input[name="projectGitToken"]').val();
		console.log(gitToken);
		fileSystemBroker.connectToGithub(gitToken);
		
		loadAndShowGitRepoList();
	});
	
	
	// editorPanel
	editor = ace.edit("sourceEditor");
	editor.setTheme("ace/theme/axcad");
	editor.getSession().setMode("ace/mode/javascript");
	editor.getSession().setUseWrapMode(true);
	editor.setFontSize('14px');
	
	// partFactoryPanel
	$('#partFactoryContent').scroll(function(e) {
		var opacity = $(this).scrollTop();
		opacity = (opacity > 100 ? 100 : opacity) / 300;
		$(this).css('box-shadow', 'inset 0 5px 10px -5px rgba(0, 0, 0, ' + opacity + ')');
	});
	
	// GL panel
   	initGLViewer();
    animateGLViewer();
	
	
	// resize now to make sure everything is neat and tidy
	resizeUI();
	
	// event handlers
	$( window ).resize(function() {
		resizeUI();
	});
	
	$(window).bind('keydown', function(event) {
		if (event.ctrlKey || event.metaKey) {
			switch (String.fromCharCode(event.which).toLowerCase()) {
			case 's':
				event.preventDefault();
				//ctrl-s
				sourceEditorSaveFile(false);
				break;
			case 'f':
				event.preventDefault();
				//ctrl-f
				break;
			case 'g':
				event.preventDefault();
				// ctrl-g
				break;
			}
			
			if (event.keyCode == 27) {
				$.noty.closeAll();
			}
		}
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
	light.position.y += 100;
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
	
	light.position.x = Math.cos(Date.now()/1000) * 20;
	light.position.z = Math.cos(Date.now()/3000) * 50;
	
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
				
				console.log('oncompiled');
				
				// revisualise? - TODO - detect whether this really needs doing!
				visualiseAgain();
			}
			node.data.onerror = function(node) {
				if (node.compileError.msg) {
					node.domElement.children('div').addClass('error');
					node.domElement.children('div').removeClass('compiled');
					
					notify('Error in '+node.name+': '+node.compileError.msg + ' on line '+node.compileError.lineNo, 'error');
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
			
			pf.domElement = d;
			
			pf.onStartProduction = function(spf) {
				console.log('received onStartProduction');
				spf.domElement.addClass('working');
			}
			pf.onProductionComplete = function(spf) {
				console.log('received onProdComplete');
				spf.domElement.removeClass('working');
			}
			
			if (pf.partBin.length > 0)
				d.append(' ['+pf.partBin.length+']');
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
		if (resource.data.ext == 'csv')
			editor.getSession().setMode("ace/mode/text")
		else
			editor.getSession().setMode("ace/mode/javascript");
		editor.resourceID = resID;	
		
		$('#sourceResourceName').val(resource.data.name);
		
		// setup event handles
		$('#sourceCompileButton').off();
		$('#sourceCompileButton').click(function(e) {
			sourceEditorSaveFile(false);
		});
		
		$('#sourceCommitButton').off();
		$('#sourceCommitButton').click(function(e) {
			sourceEditorSaveFile(true);
		});
		
	} else {
		// not yet loaded...
	}
}

function sourceEditorSaveFile(commit) {
	if (editor.resourceID) {
		var resource = project.resources.find(editor.resourceID);
		resource.data.updateData(editor.getValue());
		
		notify(resource.data.name + ' saved', 'success');
		
		if (commit)
			resource.data.commitToGithub(function(err) {
				if (err) 
					notify('Unable to commit '+resource.data.name+' - '+err,'error')
				else
					notify('Committed '+resource.data.name,'success');
			});
	}
}


function openProject(path) {	
	if (path != null) {
		project.loadFromGithub(path, function(){
			updateResourceTree();
		
			project.loadResources();
		
			//project.compileResources();
		});
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
	$('#partFactoryExampleButton').off();
	$('#partFactoryExampleButton').click(function(e) {
		if (!$('#partFactoryExampleButton').hasClass('thinking'))
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
	
	var pf = partFactory;
	
	// generate source list
	if (pf.catalog.loadQueue.length>0) {
		var p = $('<p/>');
		p.addClass('subtle');
		p.append('Source(s): ');
		for (i=0;i<pf.catalog.loadQueue.length;i++){
			if (i>0) p.append(', ');
			p.append(pf.catalog.loadQueue[i].src);
		}
		$('#partFactoryCatalog').append(p);
	}
	
	// now do the table
	if (pf.specification.length > 0 && pf.catalog.length > 0) {
		var table = document.createElement('table');
		
		// build headings
		var thr = document.createElement('tr');
		var th = document.createElement('th');
		th.textContent = 'partNo';
		thr.appendChild(th);
		
		for (i=0; i < pf.specification.length; i++) {
			if (pf.specification[i].visible) {
				var th = document.createElement('th');
				th.textContent = pf.specification[i].name;
				thr.appendChild(th);
			}
		}
		
		var th = document.createElement('th');
		th.textContent = '';  // column for controls	
		thr.appendChild(th);
		table.appendChild(thr);
		
		// populate rows
		for (i=0; i < pf.catalog.length; i++) {
			var tr = document.createElement('tr');
				
			// for each item in the catalog
			// extract relevant spec values
			
			for (j=0; j<thr.children.length-1; j++) {
				var td = document.createElement('td');
				td.textContent = pf.catalog[i][thr.children[j].textContent].value;
				tr.appendChild(td);
			}
			
			// add some buttons
			var td = $('<td/>');
			var div = $('<div/>');
			div.addClass('smallButton');
			div.html('View');
			div.data({'pf':pf,'spec':pf.catalog[i]});
			var catalogSpec = pf.catalog[i];
			div.click(function(e) {
				var pf = $(e.target).data().pf;
				var spec = $(e.target).data().spec;
				visualisePartFactoryCatalogItem(pf, spec);
			});
			td.append(div);
			$(tr).append(td);
			table.appendChild(tr);
		}
		
		$('#partFactoryCatalog').append(table);
	}
	
	
	updatePartFactoryBin(partFactory);
	
}

function updatePartFactoryBin(pf) {
	$('#partFactoryBin').empty();
	
	
	if (pf.specification.length > 0 && pf.partBin.length > 0) {
		var table = document.createElement('table');
		
		// build headings
		var thr = document.createElement('tr');
		for (i=0; i < pf.specification.length; i++) {
			var th = document.createElement('th');
			th.textContent = pf.specification[i].name;
			thr.appendChild(th);
		}
		table.appendChild(thr);
		
		// populate rows
		for (i=0; i < pf.partBin.length; i++) {
			var tr = document.createElement('tr');
			
			// for each item in the bin
			// extract relevant spec values
			
			for (j=0; j<thr.children.length; j++) {
				var td = document.createElement('td');
				td.textContent = pf.partBin[i].spec[thr.children[j].textContent].value;
				tr.appendChild(td);
			}
			
			table.appendChild(tr);
		}
		
		$('#partFactoryBin').append(table);
	}
}

function emptySceneOfObject3Ds() {
	var obj, i;
	for ( i = scene.children.length - 1; i >= 0 ; i -- ) {
		obj = scene.children[ i ];
		if ( obj instanceof THREE.Object3D && obj.id && obj.id=='partData') {
			scene.remove(obj);
		}
	}
}


function visualisePartFactoryExample(pf) {
	
	// disable button
	$('#partFactoryExampleButton').addClass('thinking');
	
	// generate a default specification
	var spec = pf.getDefaultSpec();
	
	visualisePartWithSpec(pf, spec, function(err) {	
		// enable button
		$('#partFactoryExampleButton').removeClass('thinking');
	});
}


function visualisePartFactoryCatalogItem(pf,catalogItem) {
	
	visualisePartWithSpec(pf,catalogItem);
}

function visualisePartWithSpec(pf,spec, cb) {
	if (pf && spec) {
		console.log(pf);
		
		//visualisedPartFactoryResource = undefined;
		//visualisedPartFactory = undefined;
		//visualisedSpec = undefined;
		
		// go make a suitable part
		pf.make(spec, function(part) {
		
			// visualise it
			console.log('Received part to visualise');
			
			part.visualiseWithGL();
			
			var mesh = part.visualisations[0].mesh;
			mesh.geometry.computeBoundingBox();
			
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			
			emptySceneOfObject3Ds();
			
			var obj = new THREE.Object3D();
			obj.add(mesh);
			obj.id = 'partData';
			scene.add(obj);
			
			updatePartFactoryBin(pf);
			
			visualisedPartFactoryResource = pf.resource.source;
			visualisedPartFactory = pf.name;
			visualisedSpec = spec;
			
			if (cb) cb(null);
		});
	} else {
		if (cb) cb('Error');
	}
}

function visualiseAgain() {
	// used to refresh a visual when a script is recompiled
	console.log('visualisAgain',visualisedPartFactoryResource,visualisedPartFactory,visualisedSpec);
	
	if (visualisedPartFactory && visualisedPartFactoryResource && visualisedSpec) 
	
		var res = project.getResourceByPath(visualisedPartFactoryResource);
		console.log('resource: ',res);
		if (res) {
			var pf = res.data.getPartFactoryByName(visualisedPartFactory);
	
			console.log('pf: ',pf);
	
			if (pf) visualisePartWithSpec(pf, visualisedSpec);
		}
}

function loadAndShowGitRepoList() {
	
	fileSystemBroker.getUserRepos(function(err, repos) {
		console.log("user.repos:", repos);
		
		// generate list
		if (repos.length > 0) {
			var ul = $('<ul/>');
			ul.css('list-style-type','none');
			
			for (i=0; i < repos.length; i++) {
				repo = repos[i];
				var li = $('<li/>');
				var b = $('<div/>');
				b.append(repo.full_name);
				b.addClass('smallButton');
				b.data({'repo':repo});
				b.click(function (e) {
					var repo = $(this).data().repo;
			
					var gitRepo = fileSystemBroker.getGithubRepo(repo.owner.login, repo.name);
					gitRepoInfo = repo;
	
					loadAndViewGitBranches(gitRepo);
				});
				
				li.append(b);
				ul.append(li);
			}
			
			$('#gitRepos').empty();
			$('#gitRepos').append(ul);
		} else {
			$('#gitRepos').empty();
			$('#gitRepos').append('<p>No repositories found</p>');
		}
		
		projectGitAccordion.close(0);
		projectGitAccordion.open(1);
	});
}

function loadAndViewGitBranches(repo) {	
	// generate a list of branches
	fileSystemBroker.getGithubRepoBranches(function(err, branches) {
		console.log(branches);
		
		if (branches.length > 0) {
			var ul = $('<ul/>');
			ul.css('list-style-type','none');
			
			for (i=0; i < branches.length; i++) {
				branch = branches[i];
				var li = $('<li/>');
				var b = $('<div/>');
				b.append(branch);
				b.addClass('smallButton');
				b.data({'branch':branch});
				b.click(function(e) {
					var branch = $(this).data().branch;
			
					loadAndViewGitProjects(branch);
				});
				
				li.append(b);
				ul.append(li);
			}
			
			$('#gitBranches').empty();
			$('#gitBranches').append('<p>Select a branch of: '+gitRepoInfo.name+'</p>');
			$('#gitBranches').append(ul);
			
			// hide/scroll
			$('#projectContent').scrollTop($('#gitBranches').position().top);
		} else {
			$('#gitBranches').empty();
			$('#gitBranches').append('<p>No branches found</p>');
		}
		
		projectGitAccordion.close(1);
		projectGitAccordion.open(2);
	});
}

function loadAndViewGitProjects(branch) {

	fileSystemBroker.getGithubRepoTree(branch, function(err, tree) {
		console.log(tree);
		
		if (tree.length > 0) {
			var ul = $('<ul/>');
			ul.css('list-style-type','none');
			
			for (i=0; i < tree.length; i++) {
				f = tree[i];
				
				var nameParts = f.path.split('.');
				var ext = '';
				
				if (nameParts.length>1) {
					ext = nameParts[nameParts.length-1];
				} else {
					ext = '';
				}
				
				if (ext == 'json') {				
					var li = $('<li/>');
					var b = $('<div/>');
					b.append(f.path);
					b.addClass('smallButton');
					b.data({'path':f.path});
					b.click(function(e) {
						var path = $(this).data().path;
			
						openProject(path);
					});
					
					li.append(b);
					ul.append(li);
				}
			}
			
			$('#gitProjectFiles').empty();
			$('#gitProjectFiles').append('<p>Select a project within '+gitRepoInfo.name+' ('+branch+')</p>');
			$('#gitProjectFiles').append(ul);
			
			// hide/scroll
			$('#projectContent').scrollTop($('#gitProjectFiles').position().top);
		} else {
			$('#gitProjectFiles').empty();
			$('#gitProjectFiles').append('<p>No project files</p>');
		}
		
		projectGitAccordion.close(2);
		projectGitAccordion.open(3);
	});
}
