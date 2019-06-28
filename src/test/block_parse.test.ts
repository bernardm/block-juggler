const mock = require('ts-mockito');
import { TagStore } from '../tag_store';
import { blockParse } from '../block_parse';

describe('blockParse()', function() {
  const mockTagStore:TagStore = mock.mock(TagStore);

  it("should identify text annotated with === as a text block", function() {
    const io:TagStore = mock.instance(mockTagStore);

    blockParse('===tag\ntext', io);
    mock.verify(mockTagStore.writeFor('tag', 'text\n')).called();

    blockParse('\n\n===tag1\ntext1', io);
    mock.verify(mockTagStore.writeFor('tag1', 'text1\n')).called();
  });

  it("should parse 3 blocks from given data", function() {
    const io:TagStore = mock.instance(mockTagStore);

    blockParse('===t1\nd1\n===t2\nd2\n===t3\nd3', io);
    mock.verify(mockTagStore.writeFor('t1', 'd1\n')).called();
    mock.verify(mockTagStore.writeFor('t2', 'd2\n')).called();
    mock.verify(mockTagStore.writeFor('t3', 'd3\n')).called();
  });

  it("should file a block to every tag it was annotated with", function() {
    const io:TagStore = mock.instance(mockTagStore);

    blockParse('===t1,t2,t3\ndata', io);
    mock.verify(mockTagStore.writeFor('t1', 'data\n')).called();
    mock.verify(mockTagStore.writeFor('t2', 'data\n')).called();
    mock.verify(mockTagStore.writeFor('t3', 'data\n')).called();
  });

  it("should file multiple blocks annotated with 't1' in the sequence they appear in the edit buffer", function() {
    const io:TagStore = mock.instance(mockTagStore);

    blockParse('===t1\nd1\n===t1\nd2\n===t1\nd3', io);
    mock.verify(mockTagStore.writeFor('t1', 'd1\n')).called();
    mock.verify(mockTagStore.writeFor('t1', 'd2\n')).called();
    mock.verify(mockTagStore.writeFor('t1', 'd3\n')).called();
  });
});


