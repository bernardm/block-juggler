import { TagStore, workingDir } from '../tag_store';

const fs     = require('fs'); // include before mock-fs
const mockFS = require('mock-fs');
const path   = require('path');
const os     = require('os');

// test constants
const testDir:string  = path.resolve('/the/seven/bloody/hells/');
const testFile:string = path.resolve(testDir, 'test.file');
const testData:string = 'data\n';

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
    beforeEach(()=>{
      mockFS({[testDir]: {}});
    });
    after(()=>{
      mockFS.restore();
    });

    it('should alter fs with mocked dir structure', function() {
      const newDir = path.resolve(testDir, 'new/');

      fs.mkdirSync(newDir);
      assert.ok(fs.existsSync(newDir));
    });

    it("should map a pure tag to the same file regardless of case", function(done) {
      const io:TagStore = new TagStore(testDir);
      const writer = fs.createWriteStream(testFile, {flags:'a'});
      io._setStream('tag', writer);

      io.writeFor('tag', testData);
      io.writeFor('Tag', testData);
      io.writeFor('TAG', testData);
      io.close();

      writer.on('close', ()=>{
        let fileData:string  = fs.readFileSync(testFile, 'utf8');
        assert.equal(fileData, testData+testData+testData);
        done();
      });
    });

    it("should interpret a tag name with a period as a file", function(done) {
      const io:TagStore = new TagStore(testDir);
      const writer = fs.createWriteStream(testFile, {flags:'a'});

      io._setStream(testFile, writer);
      io.writeFor(testFile, testData);
      io.close();

      writer.on('close', ()=>{
        let fileData:string  = fs.readFileSync(testFile, 'utf8');
        assert.equal(fileData, testData);
        done();
      });
    });
  }); // describe('TagStore')

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

    it("should return homeFolder when projectFolder is invalid and fileFolder is invalid", function() {
      vscode.workspace.rootPath = undefined;
      vscode.window.activeTextEditor = vscode.window;
      vscode.window.activeTextEditor.document.fileName = 'Untitled-1';

      mockFS({[path.resolve(os.homedir())]: {}});
      assert.equal(workingDir(vscode, fs), path.resolve(os.homedir(), 'blocks/'));
    });
  }); // describe('workingDir()')
});