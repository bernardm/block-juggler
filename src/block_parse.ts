import { TagStream } from './tag_stream';
const cp = require('child_process');

/**
 * Parses tagged text blocks from  given input text.
 *
 * @export blockParse()
 * @param {string}    docText text to parse
 * @param {TagStream} io      initialized TagStream object
 * @returns document text with tagged data removed.
 */
export function blockParse(docText: string, io: TagStream) {
   docText = '\ntag#\n' + docText;
   const regxBlock = /\n(tag|cmd)\#/m;
   const docBlocks = docText.split(regxBlock);

   if (docBlocks) {
      docText = '';
      for (let blockIndex = 1; blockIndex < docBlocks.length; blockIndex += 2) {
         const blockData   =  docBlocks[blockIndex + 1];
         const lineEndPos  =  blockData.indexOf('\n');

         // the first line always contains comma delimited tags or is empty
         const blockAction = blockData.slice(0, lineEndPos);
         const blockText   = blockData.slice(lineEndPos + 1) + '\n';
         const blockType   = docBlocks[blockIndex];
         switch (blockType) {
            case 'tag':
               for (let tag of blockAction.split(',').map(s => s.trim().toLowerCase())) {
                  if (tag)  { io.streamFor(tag).write(blockText); }  //  write to tag file
                  else      { docText = docText + blockText; }       //  write to editor  
               } // for( tag )
               break;

            case 'cmd':
               let cmdOutput:string;
               try        { cmdOutput = cp.execSync(blockAction, { input: blockText }).toString(); }
               catch(err) { cmdOutput = err.message; }
               if (cmdOutput) { docText = `${docText}cmd# rem\n${cmdOutput}tag#\n`; }
         }
      }
   }
   return docText;
} // blockParse()
