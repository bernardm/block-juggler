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
   // when input starts with a incomplete tag marker
   if( docText.substring(0,3) === '===' ) {
      docText = '\n' + docText;
   }

   // tag marker is === , execute marker is \\\
   const regxBlock = /\n(\=\=\=|\\\\\\)/m;
   const docBlocks = docText.split(regxBlock);

   if (docBlocks) {
      docText = '';
      for (let blockIndex = 1; blockIndex < docBlocks.length; blockIndex += 2) {
         const blockType   = docBlocks[blockIndex];
         const blockData  =  docBlocks[blockIndex + 1];
         let blockAction:string;
         let blockText:string;

         // the first line always contains comma delimited tags or is empty
         //TODO refactor - move to appropriate case
         let  lineEndPos  =  blockData.indexOf('\n');
         if( lineEndPos === -1 ) {
            blockAction = blockData;
            blockText   = '';
         } else {
            blockAction = blockData.slice(0, lineEndPos);
            blockText   = blockData.slice(lineEndPos + 1) + '\n';
         }

         switch (blockType) {
         case '===':
            for (let tag of blockAction.split(',').map(s => s.trim().toLowerCase())) {
               if (tag)  { //  write to tag file
                  io.writeFor(tag, blockText);
               } else {    //  write to editor
                  docText = docText + blockText;
               }
            } // for( tag )
            break;

         case '\\\\\\':
            let cmdOutput:string;
            try { cmdOutput = cp.execSync(blockAction, { input: blockText }).toString(); }
            catch(err) { cmdOutput = err.message; }
            // display output if present
            if ( cmdOutput ) {
               // output ends on a new line
               if( cmdOutput.substr(-1) !== '\n' ) {
                  cmdOutput.concat('\n');
               }
               docText = `${docText}\\\\\\ rem ${blockAction}\n${cmdOutput}===\n`;
            }
            break;
         }
      }
   }
   return docText;
} // blockParse()