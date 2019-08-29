const mock = require('ts-mockito');
import { TagStore, workingDir } from '../tag_store';
import {
  markerTagOut, markerTagCommand, sysCommandNull
} from '../block_parse';

const fs     = require('fs'); // include before mock-fs
const mockFS = require('mock-fs');
const path   = require('path');
const os     = require('os');

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
  //TODO how to insert only once
  const assert = require('assert');

  describe('TagStore', function() {
    // test constants
    const testDir:string  = path.resolve('/the/seven/bloody/hells/');
    const testFile:string = path.resolve(testDir, 'test.file');
    const testData:string = 'data\n';
    
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
        let fileText:string  = fs.readFileSync(testFile, 'utf8');
        assert.equal(fileText, testData+testData+testData);
        done();
      });
    });
    
    it("should end every output block with a newline", function(done) {
      const io:TagStore = new TagStore(testDir);
      const writer = fs.createWriteStream(testFile, {flags:'a'});
      io._setStream('tag', writer);
      
      io.writeFor('tag', 'block');
      io.close();
      
      writer.on('close', ()=>{
        let fileText:string  = fs.readFileSync(testFile, 'utf8');
        assert.equal(fileText, 'block\n');
        done();
      });
    });
    
    it("should end every input block with a newline", function() {
      fs.writeFileSync(testFile, 'block');
      
      const io:TagStore = new TagStore(testDir);
      io.readFor(testFile);
      io.close();
      
      assert.equal(io.editorText, 'block\n');
    });
    
    it("should read data from an input tag", function() {
      const dataFile:string = path.resolve(testDir, 'tag.txt');
      fs.writeFileSync(dataFile, 'block');
      
      const io:TagStore = new TagStore(testDir);
      io.readFor('tag');
      io.close();
  
      assert.equal(io.editorText, 'block\n');
    });
    
    it("should read data from an input file", function() {
      fs.writeFileSync(testFile, 'block');
      
      const io:TagStore = new TagStore(testDir);
      io.readFor(testFile);
      io.close();
      
      assert.equal(io.editorText, 'block\n');
    });
    
    it("should place a command tag on a line by itself", function() {
      const io:TagStore = new TagStore(testDir);
      //TODO what is this test for?
      io.writeFor('', markerTagCommand + sysCommandNull);
      io.writeFor('', 'output');
      io.writeFor('', markerTagOut);
      io.close();

      assert.equal(io.editorText,
        markerTagCommand + sysCommandNull + '\n'
        + 'output\n'
        + markerTagOut + '\n'
        );
    });

    it("should interpret a tag name with a period as a file", function(done) {
      const io:TagStore = new TagStore(testDir);
      const writer = fs.createWriteStream(testFile, {flags:'a'});

      io._setStream(testFile, writer);
      io.writeFor(testFile, testData);
      io.close();

      writer.on('close', ()=>{
        let fileText:string  = fs.readFileSync(testFile, 'utf8');
        assert.equal(fileText, testData);
        done();
      });
    });
  }); // describe('TagStore')

  describe('workingDir()', function() {
    it("should resolve a path that uses folder seperators from Windows and unix", function() {
      assert.equal(path.resolve(os.homedir(), 'blocks'), path.resolve(os.homedir() + '/blocks/'));
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