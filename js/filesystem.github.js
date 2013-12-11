// Extends VFS, defined in filesystem.js

/* args format for mounting a github filesystem:

{
	

}

*/


// VFS.GithubFileSystem
(function(fs) {
	fs.name = 'github';
	
	fs.mount = function(dirEntry,args,callback) {
		dirEntry.isMountPoint = true;
		
		// instance a new filesystem and bind to dirEntry
		dirEntry.fileSystem = Object.create(VFS.GithubFileSystem);
		
		// initialise fileSystem
		dirEntry.fileSystem.init(args,callback);
	}
	
	fs.init = function(args) {
		// actually make the connections to github here, using args
		
	}
		
})(VFS.GithubFileSystem = VFS.GithubFileSystem || Object.create(VFS.FileSystem));

// register the filesystem
VFS.Mount.registerFileSystem(VFS.GithubFileSystem);