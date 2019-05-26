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
         const blockType   = docBlocks[blockIndex];
         const blockData  =  docBlocks[blockIndex + 1];
         let blockAction:string;
         let blockText:string;

         // the first line always contains comma delimited tags or is empty
         let  lineEndPos  =  blockData.indexOf('\n');
         if( lineEndPos > 0 ) {
            blockAction = blockData.slice(0, lineEndPos);
            blockText   = blockData.slice(lineEndPos + 1) + '\n';
         } else {
            blockAction = blockData;
            blockText   = '';
         }

         switch (blockType) {
            case 'tag':
               for (let tag of blockAction.split(',').map(s => s.trim().toLowerCase())) {
                  if (tag)  { 
                     io.streamFor(tag).write(blockText); 
                  }  //  write to tag file
                  else      { docText = docText + blockText; }       //  write to editor
               } // for( tag )
               break;

            case 'cmd':
               let cmdOutput:string;
               try { cmdOutput = cp.execSync(blockAction, { input: blockText }).toString(); }
               catch(err) { cmdOutput = err.message; }
               if ( cmdOutput && cmdOutput.substr(-1) !== '\n' ) {
                  cmdOutput.concat('\n');
               }
               docText = `${docText}cmd# rem\n${blockAction}\n\n${cmdOutput}tag#\n`;
         }
      }
   }
   return docText;
} // blockParse()

