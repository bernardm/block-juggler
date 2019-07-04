import * as vscode    from 'vscode';
import * as fs        from  'fs';

import { TagStore, workingDir }   from './tag_store';
import { blockParse } from './block_parse';
import { ShellExecute } from './shell_execute';

// VS Code properties
let myStatusBarItem: vscode.StatusBarItem;

export function activate({ subscriptions }: vscode.ExtensionContext) {
	// this runs once on extension activation
	const myCommandId = 'block-juggler.classify';

	// create a new status bar item
	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	myStatusBarItem.command = myCommandId;
	myStatusBarItem.text = `$(megaphone) Block Juggler active!!`;
	subscriptions.push(myStatusBarItem);

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

			const dir:string = workingDir(vscode, fs);
			const io:TagStore = new TagStore(dir);
			const shell:ShellExecute = new ShellExecute(dir);

			blockParse(document.getText(docRange), io, shell);
			io.close();

			activeEditor
			.edit(builder => builder.replace(docRange, io.editorText))
			.then(() => {
				const postion = activeEditor.selection.end;
				activeEditor.selection = new vscode.Selection(postion, postion);
			});
		}

		vscode.window.showInformationMessage('Block Juggler finished.');
		myStatusBarItem.hide();
	});
	subscriptions.push(disposable);
} // activate()

// this method is called when your extension is deactivated
export function deactivate() {}


