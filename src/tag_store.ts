import * as fs from 'fs';

const path     = require("path");
const sanitize = require("sanitize-filename");

interface MyWriteStream extends fs.WriteStream {
	[tag: string]: any;
}
export class TagStore {
	private tagStream = Object.setPrototypeOf({}, null);
	private tagFolder:string = '';
	private editorStream:string = '';

	constructor (folder:string) {
		this.tagFolder = folder;
	} // constructor()

	get folder():string {
		return this.tagFolder;
	}

	public close():void {
		for(let tag in this.tagStream) {
			const stream = this.tagStream[tag];
			if( stream ) {
				stream.end();
			}
		}
		this.tagStream = {};
	}

	get editorText():string {
		return this.editorStream;
	}

	public writeFor( tag:string, block:string ):void {
		if( '' === tag ) {
			this.editorStream += block;
			return;
		}

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
		this.tagStream[tag].write(block);
	}
}
