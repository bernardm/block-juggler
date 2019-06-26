const mock       = require('ts-mockito');
import { TagStream } from '../tag_stream';
import { blockParse } from '../block_parse';

describe('blockParse()', function() {
  const mockedTagStream:TagStream = mock.mock(TagStream);

  it("should identify text annotated with === as a text block", function() {
    const io:TagStream = mock.instance(mockedTagStream);

    blockParse('===tag\ntext', io);
    mock.verify(mockedTagStream.writeFor('tag', 'text\n')).called();

    blockParse('\n\n===tag1\ntext1', io);
    mock.verify(mockedTagStream.writeFor('tag1', 'text1\n')).called();
  });

  it("should parse 3 blocks from given data", function() {
    const io:TagStream = mock.instance(mockedTagStream);

    blockParse('===t1\nd1\n===t2\nd2\n===t3\nd3', io);
    mock.verify(mockedTagStream.writeFor('t1', 'd1\n')).called();
    mock.verify(mockedTagStream.writeFor('t2', 'd2\n')).called();
    mock.verify(mockedTagStream.writeFor('t3', 'd3\n')).called();
  });

  it("should file a block to every tag it was annotated with", function() {
    const io:TagStream = mock.instance(mockedTagStream);

    blockParse('===t1,t2,t3\ndata', io);
    mock.verify(mockedTagStream.writeFor('t1', 'data\n')).called();
    mock.verify(mockedTagStream.writeFor('t2', 'data\n')).called();
    mock.verify(mockedTagStream.writeFor('t3', 'data\n')).called();
  });

  it("should file multiple blocks annotated with 't1' in the sequence they appear in the edit buffer", function() {
    const io:TagStream = mock.instance(mockedTagStream);

    blockParse('===t1\nd1\n===t1\nd2\n===t1\nd3', io);
    mock.verify(mockedTagStream.writeFor('t1', 'd1\n')).called();
    mock.verify(mockedTagStream.writeFor('t1', 'd2\n')).called();
    mock.verify(mockedTagStream.writeFor('t1', 'd3\n')).called();
  });
});


