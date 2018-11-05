import * as path from 'path';
import * as fs from 'fs';

import * as chai from 'chai';
import * as  chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

import { Wordnet } from './wordnet';

const verbDataFilepath = path.resolve('./src/assets/wordnet/data.verb');

describe('binary-file-search', () => {
    it('inits data file paths', () => {
        Wordnet.DATA_PATHS.forEach(filepath => {
            expect(fs.existsSync(filepath), filepath + ' exists').to.equal(true);
        })

    });

    it('finds the line containing "import"', async () => {
        expect(
            await Wordnet.findLineContaining(verbDataFilepath, 'import')
        ).to.equal(
            // tslint:disable-next-line:max-line-length
            '02232722 40 v 01 import 1 003 @ 02232190 v 0000 ;c 06128570 n 0000 ! 02232877 v 0101 01 + 08 00 | transfer (electronic data) into a database or document  '
        );
    });

    it('finds the line containing "import" from all files', async () => {
        expect(
            await Wordnet.findDefinition('import')
        ).to.deep.equal(
            // tslint:disable:max-line-length
            [
                '02346136 40 v 01 import 0 011 @ 02260362 v 0000 ;c 01090446 n 0000 + 03564667 n 0102 + 01111750 n 0102 + 10200531 n 0102 + 10200531 n 0101 + 03564667 n 0101 + 10201366 n 0101 + 01111750 n 0101 ! 02346409 v 0101 ~ 02345856 v 0000 02 + 08 00 + 21 00 | bring in from abroad  ',
                '03564667 06 n 02 import 0 importation 0 004 @ 03076708 n 0000 + 02346136 v 0201 + 02346136 v 0101 ! 03306207 n 0101 | commodities (goods or services) bought from a foreign country  '
            ]
            // tslint:enable:max-line-length
        );
    });

    xit('finds "export" is the opposite of "import"', async () => {
        expect(
            await Wordnet.findOppositeOf('import')
        ).to.equal('export');
    });
});
