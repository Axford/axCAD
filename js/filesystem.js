
/*

Namespace = VFS

Classes
-------

Entry  (shared by File and Directory)

FileEntry

DirectoryEntry - in memory representation of a directoryEntry, backs off to a filesystem to do useful stuff

FileSystem - interface
FileSystemGithub
FileSystemMemory
FileSystemDropbox

FileReader

FileWriter

DirectoryReader

Mount - binds a filesystem to a directoryEntry


*/
var VFS = VFS || {};


// util
if (typeof Object.create !== 'function') {
    Object.create = function (o) {
        function F() {}
        F.prototype = o;
        return new F();
    };
}


// Message types
VFS.UnknownFileSystemError = {};



// VFS.Entry
(function(entry) {
	
	// private
	// var zzzz
	
	// public
	entry.isFile = false;
	entry.isDirectory = false;
	entry.isMountPoint = false;
	entry.name = '';
	entry.fileSystem = null;
	entry.parent = null;
	
	
})(VFS.Entry = VFS.Entry || {});


// VFS.FileEntry
(function(fileEntry) {
	fileEntry.isFile = true;
	
		
})(VFS.FileEntry = VFS.FileEntry || Object.create(VFS.Entry));


// VFS.DirectoryEntry
(function(dirEntry) {
	dirEntry.isDirectory = true;	
	
		
})(VFS.DirectoryEntry = VFS.DirectoryEntry || Object.create(VFS.Entry));


// VFS.FileSystem
(function(fs) {
	
	// private
	// var zzzz
	
	// public
	fs.name = '';
	
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
