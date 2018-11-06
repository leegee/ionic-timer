import * as path from 'path';
import * as fs from 'fs';

import * as chai from 'chai';
import * as  chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

import { Wordnet, WordnetIndexEntry, WordnetSense, WordnetPointer } from './wordnet';

const verbDataFilepath = path.resolve('./src/assets/wordnet/data.verb');

describe('binary-file-search', () => {
    let wordUnderTest;

    it('inits data file paths', () => {
        Object.keys(Wordnet.dataFiles).forEach(filetypeKey => {
            expect(
                fs.existsSync(Wordnet.dataFiles[filetypeKey].path),
                fs.existsSync(Wordnet.dataFiles[filetypeKey].path) + ' exists'
            ).to.equal(true);
        });
    });

    describe('index', () => {
        before(() => {
            wordUnderTest = Wordnet.findWord('import', 'v');
        });

        it('finds "import"', () => {
            expect(wordUnderTest).to.be.an.instanceof(WordnetIndexEntry);
            expect(wordUnderTest.word).to.equal('import');
            expect(wordUnderTest.pos).to.equal('v');
            expect(wordUnderTest.ptrSymbols).to.deep.equal('! @ ~ + ;'.split(' '));
            expect(wordUnderTest.tagsenseCnt).to.equal(1);
            expect(wordUnderTest.sysnetOffsets).to.deep.equal(
                '02346136 02232722 00932636'.split(' ').map(i => Number(i))
            );
        });

        it('loads all entries for "import"', () => {
            const definitions = wordUnderTest.load();
            expect(definitions).to.be.an.instanceof(Array);
            definitions.forEach(def => {
                expect(def).to.be.an.instanceof(WordnetSense);
            });
        });

        it('finds line by sysnet offset', async () => {
            const line: string = wordUnderTest._getLineBySysnetOffset(2346409);
            expect(line).to.equal(
                // tslint:disable-next-line:max-line-length
                '02346409 40 v 01 export 0 009 @ 02260362 v 0000 ;c 01090446 n 0000 + 03306207 n 0102 + 01111952 n 0102 + 03306207 n 0101 + 10073634 n 0101 + 01111952 n 0101 ! 02346136 v 0101 ~ 02345856 v 0000 03 + 08 00 + 16 00 + 21 00 | sell or transfer abroad; "we export less than we import and have a negative trade balance"'
            );
        });
    });

    describe('WordnetSense', () => {
        it('from line found by sysnet offset', async () => {
            const line: string = wordUnderTest._getLineBySysnetOffset(2346409);
            const sense: WordnetSense = WordnetSense.newFromLine(line);
            expect(sense).to.be.an.instanceof(WordnetSense);
            expect(sense.word).to.equal('export');
            expect(sense.synsetOffset).to.equal(2346409);
            expect(sense.wCnt).to.equal(1);
            expect(sense.pCnt).to.equal(9);
            expect(sense.lexId).to.equal('0');
            expect(sense.lexFilenum).to.equal(40);
            expect(sense.ptrs).to.be.an.instanceof(Array);
            expect(sense.ptrs).to.have.lengthOf(sense.pCnt);
            sense.ptrs.forEach(ptr => {
                expect(ptr).to.be.an.instanceof(WordnetPointer);
            });
            expect(sense.gloss).to.equal(
                'sell or transfer abroad; "we export less than we import and have a negative trade balance"'
            );
        });
    });

    xit('findWordOfForm finds the line containing "import"', async () => {
        expect(
            await Wordnet.findWordOfForm('import', 'v')
        ).to.equal(
            // tslint:disable-next-line:max-line-length
            '02232722 40 v 01 import 1 003 @ 02232190 v 0000 ;c 06128570 n 0000 ! 02232877 v 0101 01 + 08 00 | transfer (electronic data) into a database or document'
        );
    });


    xit('findAllWordForms finds the line containing "import" from all files', async () => {
        for (let i = 1; i <= 1; i++) {
            expect(
                await Wordnet.findAllWordForms('import')
            ).to.deep.equal(
                // tslint:disable:max-line-length
                [
                    '02346136 40 v 01 import 0 011 @ 02260362 v 0000 ;c 01090446 n 0000 + 03564667 n 0102 + 01111750 n 0102 + 10200531 n 0102 + 10200531 n 0101 + 03564667 n 0101 + 10201366 n 0101 + 01111750 n 0101 ! 02346409 v 0101 ~ 02345856 v 0000 02 + 08 00 + 21 00 | bring in from abroad',
                    '03564667 06 n 02 import 0 importation 0 004 @ 03076708 n 0000 + 02346136 v 0201 + 02346136 v 0101 ! 03306207 n 0101 | commodities (goods or services) bought from a foreign country'
                ]
                // tslint:enable:max-line-length
            );
        }
    });

    xit('finds line by sysnet offset', async () => {
        const [, num] = '02346409'.match(/^(\d+)$/);
        expect(
            await Wordnet._findSysnetOffset('v', Number(num))
        ).to.equal(
            // tslint:disable-next-line:max-line-length
            '02346409 40 v 01 export 0 009 @ 02260362 v 0000 ;c 01090446 n 0000 + 03306207 n 0102 + 01111952 n 0102 + 03306207 n 0101 + 10073634 n 0101 + 01111952 n 0101 ! 02346136 v 0101 ~ 02345856 v 0000 03 + 08 00 + 16 00 + 21 00 | sell or transfer abroad; "we export less than we import and have a negative trade balance"'
        );
    });

    // xit('finds "export" is the opposite of "import" by line input', async () => {
    //     expect(
    //         // tslint:disable-next-line:max-line-length
    //         await Wordnet._findOppositeFromLine('02346136 40 v 01 import 0 011 @ 02260362 v 0000 ;c 01090446 n 0000 + 03564667 n 0102 + 01111750 n 0102 + 10200531 n 0102 + 10200531 n 0101 + 03564667 n 0101 + 10201366 n 0101 + 01111750 n 0101 ! 02346409 v 0101 ~ 02345856 v 0000 02 + 08 00 + 21 00 | bring in from abroad')
    //     ).to.equal('export');
    // });

    xit('finds "export" is the opposite of "import"', async () => {
        expect(
            // tslint:disable-next-line:max-line-length
            await Wordnet.findOpposite('import')
        ).to.equal(['export']);
    });

});
