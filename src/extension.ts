import * as vscode from 'vscode';
import { TagStream } from './tag_stream';
import { blockParse } from './block_parse';

// VS Code properties
let myStatusBarItem: vscode.StatusBarItem;

export function activate({ subscriptions }: vscode.ExtensionContext) {
	// this runs once on extension activation

	const myCommandId = 'block-juggler.classify';

	// create a new status bar item that we can now manage
	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	myStatusBarItem.command = myCommandId;
	subscriptions.push(myStatusBarItem);

	myStatusBarItem.text = `$(megaphone) Block Juggler active!!`;

	const disposable = vscode.commands.registerCommand(myCommandId, () => {
		myStatusBarItem.show();

		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			const document    : vscode.TextDocument = activeEditor.document;
			const docSelection: vscode.Selection    = activeEditor.selection;
			const docRange    : vscode.Range        = document.validateRange(
				(docSelection.isEmpty)?
					new vscode.Range(0, 0, document.lineCount, 0):  // entire document
					docSelection); 									// hilighted selection

			let text:string = document.getText(docRange);

			const io:TagStream = new TagStream(vscode);
			text = blockParse(text, io);
			io.close();

			activeEditor.edit(builder => builder.replace(docRange, text))
			.then(success => {
				const postion = activeEditor.selection.end;
				activeEditor.selection = new vscode.Selection(postion, postion);
			});
		}

		vscode.window.showInformationMessage('Block Juggler finished.');
		myStatusBarItem.hide();
	});
	subscriptions.push(disposable);

}

// this method is called when your extension is deactivated
export function deactivate() {}

