import { TagStore } from '../tag_store';

const fs     = require('fs'); // include before mock-fs
const path   = require('path');
const mockFS = require('mock-fs');
const os     = require('os');
import { workingDir } from '../dir';

// mock for vscode
namespace vscode {
  export namespace window {
    export let activeTextEditor:any;

    export namespace document {
      export let fileName:string = '';
    }
  }
  export namespace workspace {
    export let rootPath:any = null;
  }
}

describe('Persistence', function() {
  const assert = require('assert');

  describe('TagStore', function() {
    it('should alter fs with mocked dir structure', function() {
      const Filename:string = path.resolve('C:\\Users\\martisb\\DUMMY.txt');
      const returnDir:string = path.resolve('C:\\Users\\martisb\\HELLO\\HI');
      const DirTree: {[key: string]: string;} = {};
      const testData = 'TEST';

      DirTree[Filename] = testData;
      mockFS(DirTree);

      const readStream = fs.createReadStream(Filename);
      fs.mkdir(returnDir, null, (err:any) => {
        if (err) {throw err;}
      });

      let fileData:string  = '';
      readStream.on('data',function(data:any){
        fileData += data.toString();
      });

      readStream.on('end',function(){
        assert.equal(fileData, testData);
      });
    });

  });

  describe('workingDir()', function() {
    it("should resolve a path that uses folder seperators from Windows and unix", function() {
      assert.equal(path.resolve(os.homedir(), 'blocks\\'), path.resolve(os.homedir() + '/blocks/'));
    });

    it("should return projectFolder when projectFolder is valid and fileFolder is valid", function() {
      vscode.workspace.rootPath = 'projectFolder';
      vscode.window.activeTextEditor = vscode.window;
      vscode.window.activeTextEditor.document.fileName = 'fileFolder/file.name';

      assert.equal(workingDir(vscode, fs), 'projectFolder');
    });

    it("should return fileFolder when projectFolder is invalid and fileFolder is valid", function() {
      vscode.workspace.rootPath = undefined;
      vscode.window.activeTextEditor = vscode.window;
      vscode.window.activeTextEditor.document.fileName = 'fileFolder/file.name';

      assert.equal(workingDir(vscode, fs), 'fileFolder');
    });

  }); // describe('workingDir()')

});
