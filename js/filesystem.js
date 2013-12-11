
/*

Namespace = VFS

Classes
-------

Entry  (shared by File and Directory)

FileEntry

DirectoryEntry - in memory representation of a directoryEntry, backs off to a filesystem to do useful stuff

FileSystem - interface

FileReader

FileWriter

Mount - manages mounting, where filesystems register


*/

var VFS = VFS || {};


// utils
if (typeof Object.construct !== 'function') {
    Object.construct = function (o,args) {
        function F() {}
        F.prototype = o;
        f = new F();
        
        if (typeof f.constructor == 'function') {
        	f.constructor(args);
        }
        
        return f;
    };
}

if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
  };
}

if (typeof String.prototype.splitFirst != 'function') {
  String.prototype.splitFirst = function (sep){
  	var i = this.indexOf(sep);
  	if (i<0) return [this.substr(0), '']
  	else return [this.substr(0,i), this.substr(i+1)];
  };
}


// Message types
VFS.UnknownFileSystemError = {};



// VFS.Entry
(function(entry) {
	
	// private
	// var zzzz
	
	// public
	
	entry.constructor = function(args) {
		this.isFile = false;
		this.isDirectory = false;
		this.isMountPoint = false;
		this.name = '';
		this.fileSystem = null;
		this.parent = null;
		this.localPath = '';  // absolute path in VFS
		this.remotePath = '';  // absolute path in actual filesystem
	}
	
	
})(VFS.Entry = VFS.Entry || {});


// VFS.FileEntry
(function(fileEntry) {
	
	fileEntry.constructor = function(args) {
		VFS.Entry.constructor.call(this, args);
		this.isFile = true;
		
	}
	
		
})(VFS.FileEntry = VFS.FileEntry || Object.create(VFS.Entry));


// VFS.DirectoryEntry
(function(dirEntry) {

	dirEntry.constructor = function(args) {
		VFS.Entry.constructor.call(this,args);
	
		this.isDirectory = true;	
	
		this.directories = [];
		this.files = [];
	
		// default properties are for root
		this.name = '/';
		this.localPath = '/';
		this.parent = this; 
	
	}
	
	dirEntry.clear = function() {
		this.directories.length = 0;
		this.files.length = 0;
	}
	
	// read/load directories and files from fileSystem
	dirEntry.read = function(recursive,callback) {
		var me = this;
		var cb = callback;
		
		if (this.fileSystem) {
			this.fileSystem.ls(this, true, function(err) {
				
				
				callback(err);
			});
			
			
			
		}
	}
	
	dirEntry.getRoot = function() {
		if (this.parent != this) {
			return this.parent.getRoot();
		} else {
			return this;
		}
	}
	
	dirEntry.getFile = function(path, options) {
		if (path.length < 1) return null;
		
		
	}
	
	dirEntry.getDirectory = function(path, options) {
		// blank path refers to current dirNode
		if (path.length < 1) return this;
		
		var startFrom = this;
		if (path.startsWith('/')) {
			// reset start to root
			startFrom = this.getRoot();
			path = path.substr(1);
		} 
		
		// get first dir of path
		parts = path.splitFirst('/');
		while (parts[0] == '.') {
			parts = parts[1].splitFirst('/');
		}
		
		
		// see if we're at the end of the path
		if (parts[1] == '') {
			if (parts[0] == this.name) 
				return this;
		}
		
		// look for a sub dir called part[0]
		var subdir = null;
		for (var i = 0; i< this.directories.length; i++) {
			var d = this.directories[i];
			if (d.name == parts[0]) {
				subdir = d;
				break;
			}
		}
		
		if (subdir) {
			return subdir.getDirectory(parts[1], options);
		} else {
			// clearly couldn't find a match
			return null;
		}
	}
		
})(VFS.DirectoryEntry = VFS.DirectoryEntry || Object.create(VFS.Entry));


// VFS.FileSystem
(function(fs) {
	
	// private
	// var zzzz
	
	// public
	fs.name = '';
	
	fs.constructor = function(args) {
		this.isMounted = false;
	}
	
	// fs.mount
	
	
})(VFS.FileSystem = VFS.FileSystem || {});


// VFS.Mount
(function(mount) {
	
	// private
	// associative array of fileSystem handlers - link to concrete fileSystem object
	var registeredFileSystems = {};   
	
	
	
	// public
	
	mount.registerFileSystem = function(fs) {
		registeredFileSystems[fs.name] = fs;
	}
	
	// mount - callback is fired with error flags
	mount.mount = function(dirEntry,fs,args,callback) {
		if (fs in registeredFileSystems) {
			registeredFileSystems[fs].mount(dirEntry,args,callback);
		} else {
			callback(VFS.UnknownFileSystemError);
		}
	}
	
	mount.getRegisteredFileSystems = function() {
		return registeredFileSystems;
	}
	
	
})(VFS.Mount = VFS.Mount || {});
