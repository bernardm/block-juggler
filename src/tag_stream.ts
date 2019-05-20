import * as fs from 'fs';

const path = require("path");
const sanitize = require("sanitize-filename");

export class TagStream {
	private tagStream = Object.setPrototypeOf({}, null);
	private tagFolder:string = '';

	constructor(vscode:any) {
		// first, try the project folder
		this.tagFolder = vscode.workspace.rootPath;

		// second, try the current document folder
		const activeEditor = vscode.window.activeTextEditor;
		if( !this.tagFolder && activeEditor ) {
			const currentFileName = activeEditor.document.fileName;
			if( currentFileName ) {
				this.tagFolder = path.dirname(currentFileName);
			}
		}
		// default to current working directory
		this.tagFolder = path.resolve(this.tagFolder, 'tag/');

		// create directory if needed
		if( !fs.existsSync(this.tagFolder) ) {
			fs.mkdirSync(this.tagFolder);
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

	public streamFor( tag: string) {
		if( !this.tagStream[tag] ) {
			const tagFile = path.resolve(this.tagFolder, sanitize(tag)+'.txt');
			const out = fs.createWriteStream(tagFile, {flags:'a'});
			this.tagStream[tag] = out;
			out.on('error', function(this: TagStream, err: string) {
				console.error(err);
				out.end();
				this.tagStream[tag] = null;
			});
		}
		return this.tagStream[tag];
	}
}