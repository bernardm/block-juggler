import * as fs from 'fs';

const os       = require('os');
const path     = require("path");
const sanitize = require("sanitize-filename");

export interface TagAlias {
	tag: string;
	filePath: string;
 }

export class TagStore {
	private tagStream: {[key: string]: any;} = {};
	private tagFolder:string;
	private tagAlias:TagAlias[] = [];

	private editorStream:string = '';

	constructor (folder:string) {
		this.tagFolder = folder;
	} // constructor()
	
	public addAlias(aliasList:TagAlias[]) {
		this.tagAlias = Object.assign(aliasList);
	}

	// for unit testing only
	public _setStream(tag:string, writer:any):void {
		this.tagStream[tag] = writer;
	}

	public close():void {
		for(let tag in this.tagStream) {
			const writer = this.tagStream[tag];
			writer.write('', ()=>{writer.close();});
		}
		this.tagStream = {};
	}

	get editorText():string {
		return this.editorStream;
	}

	public readFor( tag:string ):void {
		let tagFile:string;

		// tag
		if( '' === tag ) {                   // tag indicates editor data
			return;

		} else if( tag.indexOf('.') > -1 ) { // tag is a file
			tagFile = path.resolve(this.tagFolder, tag);

		} else {                      // tag is a word
			tag = sanitize(tag.toLowerCase());
			tagFile = path.resolve(this.tagFolder, tag+'.txt');
		}

		// TODO put block data validation here. method
		// if block is empty return empty
		let block = fs.readFileSync(tagFile, 'utf8');
		if( block.slice(-1) !== '\n' ) { // block does not end with a newline
			block += '\n';
		}
		this.editorStream += block;
	}

	public writeFor( tag:string, block:string ):void {
		let tagFile:string;

		// block
		if( this.isEmpty(block) ) {
			return;
		} else if( block.slice(-1) !== '\n' ) { // block does not end with a newline
			block += '\n';
		}

		// tag
		if( '' === tag ) {                   // tag indicates editor data
			this.editorStream += block;
			return;

		} else if( tag.indexOf('.') > -1 ) { // tag is a file
			tagFile = path.resolve(this.tagFolder, tag);

		} else {                      // tag is a word
			tag = sanitize(tag.toLowerCase());
			tagFile = path.resolve(this.tagFolder, tag+'.txt');
		}

		// file
		if( !this.tagStream[tag] ) {
			const writer = fs.createWriteStream(tagFile, {flags:'a'});
			this.tagStream[tag] = writer;
			writer.on('error', function(err: string) {
				console.error(err);
				writer.end();
			});
		}
		this.tagStream[tag].write(block);
	} // writeFor()

	private isEmpty(str:String):Boolean {
		return (str.length === 0 || !str.trim());
	}
}

export function blockSaveDirectory(vscode:any, fsObj:any):string {
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
		if( !fsObj.existsSync(returnDir) ) {
			fs.mkdir(returnDir, { recursive: true }, (err) => {
				if (err) {throw err;}
			});
		}
	}

	return returnDir;
} // workingDir()
