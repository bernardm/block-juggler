const cp = require('child_process');

export class ShellExecute {
    constructor() {
    }

    public run(cmd: string, input: string): string {
console.log('input: '+input);
console.log('cmd: '+cmd);
        return '';
    }
}


