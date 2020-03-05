import {ShellExecute} from '../shell_execute';

const os = require('os');
const fs = require('fs');

describe('ShellExecute', function() {
  const assert = require('assert');

  it('should use specified folder as working directory', function() {
    const shell = new ShellExecute(__dirname);

    let commandPWD:string;
    switch( os.platform() ) {
    case 'win32':
      commandPWD = 'cd';
      break;

    default:
      commandPWD = 'pwd';
    }

    //TODO fix realpathsync() -- ENOENT on any path other than root
    assert.equal(shell.run(commandPWD, ''), __dirname);
  });
});