const mock = require('ts-mockito');
import { TagStore } from '../tag_store';
import { ShellExecute } from '../shell_execute';
import {
  blockParse, markerTagIn, markerTagOut, markerTagCommand, sysCommandNull
} from '../block_parse';

function printArgs(fx:any, line:Number) {
  const [a, b] = mock.capture(fx).last();
  console.log("line(" + line + ")");
  console.log('a: "' + a + '"');
  console.log('b: "' + b + '"');
}

describe('blockParse()', function() {
  let mockTagStore:TagStore;
  let io:TagStore;

  let mockShellExecute: ShellExecute;
  let shell: ShellExecute;

  beforeEach(()=>{
    mockTagStore = mock.mock(TagStore);
    io = mock.instance(mockTagStore);

    mockShellExecute = mock.mock(ShellExecute);
    shell = mock.instance(mockShellExecute);
  });

  it("should process a block with no \\n in it", function() {
    blockParse(`\n${markerTagOut}no newline!!`, io, shell);
    mock.verify(mockTagStore.writeFor('no newline!!', '')).called();
  });

  it("should identify a marker when it has leading whitespace", function() {
    blockParse(`\n\r\t     ${markerTagOut}tag`, io, shell);
    mock.verify(mockTagStore.writeFor('tag', '')).called();
  });

  it(`should identify text annotated with ${markerTagOut} as a text block`, function() {
    blockParse(`${markerTagOut}tag\ntext`, io, shell);
    mock.verify(mockTagStore.writeFor('tag', 'text')).called();

    blockParse(`\n\n${markerTagOut}tag1\ntext1`, io, shell);
    mock.verify(mockTagStore.writeFor('tag1', 'text1')).called();
  });

  it(`should identify text annotated with ${markerTagCommand} as a command block`, function() {
    blockParse(`${markerTagCommand}${sysCommandNull}\ntext`, io, shell);
    mock.verify(mockShellExecute.run(sysCommandNull, 'text')).called();

    blockParse(`${markerTagCommand}${sysCommandNull}`, io, shell);
    mock.verify(mockShellExecute.run(sysCommandNull, '')).called();
  });

  it("should file a block with an empty tag back into the edit buffer", function() {
    blockParse(`before\n${markerTagOut}\nafter\n`, io, shell);
    mock.verify(mockTagStore.writeFor('', 'before\n')).called();
    mock.verify(mockTagStore.writeFor('', 'after\n')).called();
  });

  it(`should not interpret ${markerTagOut}> as the tag >`, function() {
    blockParse(`${markerTagOut}>\ntext`, io, shell);
    mock.verify(mockTagStore.writeFor('>', 'text\n')).never();
  });

  it(`should interpret '${markerTagOut}\\n' as an empty tag`, function() {
    blockParse(`${markerTagOut}\ntext`, io, shell);
    mock.verify(mockTagStore.writeFor('', 'text')).called();
  });

  it("should parse 3 blocks from given data", function() {
    blockParse(`${markerTagOut}t1\nd1\n${markerTagOut}t2\nd2\n${markerTagOut}t3\nd3\n`, io, shell);
    mock.verify(mockTagStore.writeFor('t1', 'd1\n')).called();
    mock.verify(mockTagStore.writeFor('t2', 'd2\n')).called();
    mock.verify(mockTagStore.writeFor('t3', 'd3\n')).called();
  });

  it("should file a block to every tag it was annotated with", function() {
    blockParse(`${markerTagOut}t1,t2,t3\ndata`, io, shell);
    mock.verify(mockTagStore.writeFor('t1', 'data')).called();
    mock.verify(mockTagStore.writeFor('t2', 'data')).called();
    mock.verify(mockTagStore.writeFor('t3', 'data')).called();
  });

  it("should file multiple blocks annotated with 't1' in the sequence they appear in the edit buffer", function() {
    blockParse(`${markerTagOut}t1\nd1\n${markerTagOut}t1\nd2\n${markerTagOut}t1\nd3`, io, shell);
    mock.verify(mockTagStore.writeFor('t1', 'd1\n')).called();
    mock.verify(mockTagStore.writeFor('t1', 'd2\n')).called();
    mock.verify(mockTagStore.writeFor('t1', 'd3')).called();
  });

  // bug. deleting start of doc before first tag
  it("should save untagged text before the first marker", function() {
    blockParse(`one\n${markerTagOut}tag\ntext`, io, shell);
    mock.verify(mockTagStore.writeFor('', 'one\n')).called();

    blockParse(`two\n${markerTagIn}tag\ntext`, io, shell);
    mock.verify(mockTagStore.writeFor('', 'two\n')).called();

    blockParse(`three\n${markerTagCommand}cd\ntext`, io, shell);
    mock.verify(mockTagStore.writeFor('', 'three\n')).called();
  });
});