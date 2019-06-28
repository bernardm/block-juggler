const os       = require('os');
const path     = require("path");

//TODO why does fs mock make new directory on file system?. it does not do this when this function is in the test file
export function workingDir(vscode:any, fsObj:any):string {
	let returnDir:string = '';
	const activeEditor = vscode.window.activeTextEditor;

	// first, try the project folder
	if ( vscode.workspace.rootPath ) {
		returnDir = vscode.workspace.rootPath;
	}

	// second, try the current document folder
	else if ( activeEditor ) {
		returnDir = path.dirname(activeEditor.document.fileName);
	}

	// default, use the users home directory
	if ( returnDir === '.' ) {
		returnDir = path.resolve(os.homedir(), 'blocks/');

		// create directory if it does not exist
		// throw error if it is read only
		fsObj.access(returnDir, fsObj.constants.F_OK | fsObj.constants.W_OK, (err:any) => {
			if (err) {
				if (err.code === 'ENOENT') { // does not exist
					fsObj.mkdir(returnDir, null, (err:any) => {
						if (err) {throw err;}
					});
				} else {                     // read only
					throw err;
				}
			}
		});
	}

	return returnDir;
} // workingDir()

