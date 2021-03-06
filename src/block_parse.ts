import { TagStore } from './tag_store';
import { ShellExecute } from './shell_execute';

export const markerTagIn      = '=<<';
export const markerTagOut     = '=>>';
export const markerTagCommand = '=\\\\';
export const sysCommandNull   = 'exit 0;';


/**
 * Parses tagged text blocks from  given input text.
 *
 * @export blockParse()
 * @param {string}   docText text to parse
 * @param {TagStore} io      initialized TagStore object
 */
export function blockParse(docText: string, io: TagStore, shell: ShellExecute) {
   // all tag markers must be preceded by a \n, even the very first one in the text
   switch( docText.substring(0,3) ) {
      case markerTagIn: case markerTagOut: case markerTagCommand:
         docText = '\n' + docText;
   }

   /**
    * tag:
    *    =\\ command
    *    =>> output to tags
    *    =<< input from tags
    */
   const regxBlock = /(?<=\n)\s*(\=\\\\(?!\\)|\=>>(?!>)|\=<<(?!<))/m;
   const docBlocks = docText.split(regxBlock);

   // no tags. save entire document
   if( !docBlocks ) {
      io.writeFor('', docText);
      return;
   }

   // save untagged text at the start of document
   io.writeFor('', docBlocks[0]);

   for (let blockIndex = 1; blockIndex < docBlocks.length; blockIndex += 2) {
      const blockType  = docBlocks[blockIndex];
      const blockData  = docBlocks[blockIndex + 1];
      let blockAction:string;
      let blockText:string;

      let  lineEndPos = blockData.indexOf('\n');

      // when the block only has one line, that line is an action
      if( lineEndPos === -1 ) {
         blockAction = blockData;
         blockText   = '';
      } else {
         blockAction = blockData.slice(0, lineEndPos);
         blockText   = blockData.slice(lineEndPos + 1);
      }

      switch (blockType) {
      case markerTagIn:
         blockAction.split(',').map(tag => io.readFor(tag.trim()));
         break;

      case markerTagOut:
         blockAction.split(',').map(tag => io.writeFor(tag.trim(), blockText));
         break;

      case markerTagCommand:
         const cmdOutput = shell.run(blockAction, blockText);

         // display output if present
         if ( cmdOutput ) {
            io.writeFor('', `${markerTagCommand}${sysCommandNull} ${blockAction}`);
            io.writeFor('', cmdOutput);
            io.writeFor('', markerTagOut);
         }
         break;
      }
   }
} // blockParse()


