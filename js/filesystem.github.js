// Extends VFS, defined in filesystem.js

/* args format for mounting a github filesystem:

{
	personalToken: '',
	user:'',
	repo: '',
	branch: '',
	rootPath:'',
	defaultCommitMessage: ''
}

*/


// VFS.GithubFileSystem
(function(fs) {

	fs.name = 'github';

	fs.constructor = function(args) {
		VFS.FileSystem.constructor.call(this,args);
	
		this.github = null;
		this.repo = null;
		this.tree = null;
		this.rootPath = '/';
	}
	
	fs.mount = function(dirEntry,args,callback) {
		dirEntry.isMountPoint = true;
		dirEntry.remotePath = args.rootPath;
		
		// instance a new filesystem and bind to dirEntry
		dirEntry.fileSystem = Object.construct(VFS.GithubFileSystem);
		
		// initialise fileSystem
		dirEntry.fileSystem.init(args,callback);
	}
	
	fs.init = function(args,callback) {
		// actually make the connections to github here, using args
		this.callback = callback;
		this.rootPath = args.rootPath;
		
		
		this.github = new Github({
			token: args.personalToken
		});
		
	
		this.repo = this.github.getRepo(args.user, args.repo);
		
		this.isMounted = true;
		
		this.updateTree(callback);
	}
	
	fs.updateTree = function(callback) {
		if (!this.isMounted) callback();
		
		var me = this;
		
		this.repo.getTree('master?recursive=true', function(err, tree) {
			me.tree = tree;
			
			callback('success');
		});
	}
	
	fs.ls = function(dirEntry, recursive, callback) {
		if (!this.isMounted) callback();
		var me = this;
		
		// enumerate immediate contents of dirEntry, by walking tree
		
		var rPath = dirEntry.remotePath.slice(1);  // remove starting slash
		if (rPath.length > 0) rPath += '/';  // add trailing slash
		
		
		for (var i=0; i<this.tree.length;i++) {
			var f = this.tree[i];
			
			if (f.path.startsWith(rPath)) {
				
				// work out if immediate child
				var remPath = f.path.slice(rPath.length);
				if (remPath.indexOf('/') < 0) {
					
					if (f.type == 'tree') {
						
						var de = Object.construct(VFS.DirectoryEntry);
						de.name = remPath;
						de.fileSystem = dirEntry.fileSystem;
						
						de.localPath = dirEntry.localPath;
						if (de.localPath.length > 1) de.localPath += '/';
						de.localPath += de.name;
						
						de.remotePath = '/' + f.path;
						de.parent = dirEntry;
						
						dirEntry.directories.push(de);
						
						if (recursive) {
							de.fileSystem.ls(de, true, callback);
						}
						
					} else {
						
						var fe = Object.construct(VFS.FileEntry);
						
						fe.name = remPath;
						fe.fileSystem = dirEntry.fileSystem;
						
						fe.localPath = dirEntry.localPath;
						if (fe.localPath.length > 1) fe.localPath += '/';
						fe.localPath += fe.name;
						
						fe.remotePath = '/' + f.path;
						fe.parent = dirEntry;
						
						dirEntry.files.push(fe);
					}
				}
				
			}
			
		}
		
		
		callback(this,'success');
		
	}
		
})(VFS.GithubFileSystem = VFS.GithubFileSystem || Object.create(VFS.FileSystem));

// register the filesystem
VFS.Mount.registerFileSystem(VFS.GithubFileSystem);