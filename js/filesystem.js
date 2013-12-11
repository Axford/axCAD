
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
	
		// default name reflects root
		this.name = '/';
		this.localPath = '/';
	
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
