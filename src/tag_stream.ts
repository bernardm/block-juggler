import * as fs from 'fs';

const path = require("path");
const sanitize = require("sanitize-filename");

export interface MyWriteStream extends fs.WriteStream {
	[tag: string]: any;
}
export class TagStream {
	private tagStream = Object.setPrototypeOf({}, null);
	private tagFolder:string = '.';

	constructor (vscode:any) {
		// first, try the current document folder
		const activeEditor = vscode.window.activeTextEditor;
		if ( activeEditor ) {
			const currentFileName = activeEditor.document.fileName;
			if ( currentFileName ) {
				this.tagFolder = path.dirname(currentFileName);
			}
		}

		// second, try the project folder
		if ( this.tagFolder === '.' ) {
			this.tagFolder = vscode.workspace.rootPath;
		}

		// default to users home directory
		if( !this.tagFolder ) {
			this.tagFolder = path.resolve(require('os').homedir(), 'blocks/');

			// create directory if needed
			try {
				if( !fs.existsSync(this.tagFolder) ) {
					fs.mkdirSync(this.tagFolder);
				}
			}
			catch (err) {
				vscode.window.showErrorMessage('Cannot write to block directory.\n' + this.tagFolder);
				throw err;
			}
		}
	} // constructor()

	public close() {
		for(let tag in this.tagStream) {
			const stream = this.tagStream[tag];
			if( stream ) {
				stream.end();
			}
		}
		this.tagStream = {};
	}

	public streamFor( tag:string ) {
		let tagFile:string;
		if( !this.tagStream[tag] ) {
			if (tag.indexOf('.') > -1) { // tag is a file
				tagFile = path.resolve(this.tagFolder, sanitize(tag));
			} else { // tag is a word
				tagFile = path.resolve(this.tagFolder, sanitize(tag)+'.txt');
			}

			const out:MyWriteStream = fs.createWriteStream(tagFile, {flags:'a'});
			this.tagStream[tag] = out;
			out.tag = tag;
			out.write('\n===\n');
			out.on('error', function(this: MyWriteStream, err: string) {
				console.error(err);
				console.table(this.tag);
				out.end();
			});
		}
		return this.tagStream[tag];
	}
}