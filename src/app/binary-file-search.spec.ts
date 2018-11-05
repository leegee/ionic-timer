import * as chai from 'chai';
import * as  chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

import { BinaryFileSearch } from './binary-file-search';

import * as path from 'path';

const verbDataFilepath = path.resolve( './src/assets/wordnet/data.verb' );
  
describe('binary-file-search', () => {
    it('finds', async () => {
        const res = await BinaryFileSearch.findLineContaining(verbDataFilepath, 'import');
        console.log('xxxxxxxxxxxxx', res);
          expect(
            res
        ).to.equal(
            // tslint:disable-next-line:max-line-length
            '02232722 40 v 01 import 1 003 @ 02232190 v 0000 ;c 06128570 n 0000 ! 02232877 v 0101 01 + 08 00 | transfer (electronic data) into a database or document  '
        );
    });
});