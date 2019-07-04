const cp = require('child_process');

export class ShellExecute {
    private shellFolder:string;

	constructor (folder:string) {
		this.shellFolder = folder;
    } // constructor()

    public run(cmd: string, input: string): string {
                 //TODO execAsync
        let cmdOutput:string;
        try {
            cmdOutput = cp.execSync(cmd, { input, cwd: this.shellFolder }).toString().trimRight();
        } catch(err) {
            cmdOutput = err.message;
        }

        return cmdOutput;
    }

    get cwd():string {
        return this.shellFolder;
    }
}


