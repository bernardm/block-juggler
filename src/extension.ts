import * as vscode from 'vscode';
import { TagStream } from './tag_stream';
import { blockParse } from './block_parse';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "Block Juggler" is now active!');

	let disposable = vscode.commands.registerCommand('block-juggler.classify', () => {
		vscode.window.showInformationMessage('Extension started!');
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			const document    : vscode.TextDocument = activeEditor.document;
			const docSelection: vscode.Selection    = activeEditor.selection;
			const docRange    : vscode.Range        = document.validateRange(
				(docSelection.isEmpty)?
					new vscode.Range(0, 0, document.lineCount, 0):  // entire document
					docSelection); 									// hilighted selection

			let text:string = document.getText(docRange);

			// TODO move TagStream inside blockPares
			const io:TagStream = new TagStream(vscode);
			text = blockParse(text, io);
			io.close();

			activeEditor.edit(builder => builder.replace(docRange, text))
			.then(success => {
				const postion = activeEditor.selection.end;
				activeEditor.selection = new vscode.Selection(postion, postion);
			});
		}
		vscode.window.showInformationMessage('Extension executed!');
	});
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
