const fs     = require('fs'); // include before mock-fs
const path   = require('path');
const mockFS = require('mock-fs');

describe('TagStream', function() {
  const Filename:string = path.resolve('file.txt');
  const DirTree: {[key: string]: string;} = {};

  before(function() {
    mockFS(DirTree);
  });
  after(function() {
    mockFS.restore();
  });

  it('should alter fs with mocked dir structure', function() {
    const testData = 'TEST';
    DirTree[Filename] = testData;

    const readStream = fs.createReadStream(Filename);

    let fileData:string  = '';
    readStream.on('data',function(data:any){
      fileData += data.toString();
    });

    readStream.on('end',function(){
      assert.equal(fileData, testData);
    });
  });
}); // TagStream class