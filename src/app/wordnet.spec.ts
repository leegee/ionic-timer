import * as path from 'path';
import * as fs from 'fs';
import { Console } from 'console';
import * as devnull from 'dev-null';

import * as chai from 'chai';
import * as  chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

import { Wordnet } from './wordnet';

Wordnet.Wordnet.logger = new Console({
    stderr: devnull(),
    stdout: devnull() // process.stdout
});

describe('Wordnet', () => {
    it('inits data file paths', () => {
        Object.keys(Wordnet.Wordnet.dataFiles).forEach(filetypeKey => {
            expect(
                fs.existsSync(Wordnet.Wordnet.dataFiles[filetypeKey].path),
                fs.existsSync(Wordnet.Wordnet.dataFiles[filetypeKey].path) + ' exists'
            ).to.equal(true);
        });
    });

    describe('index', () => {
        let wordUnderTest;

        before(() => {
            wordUnderTest = Wordnet.Wordnet.findWord('import', 'v');
        });

        it('finds verb "import"', () => {
            expect(wordUnderTest).to.be.an.instanceof(Wordnet.IndexEntry);
            expect(wordUnderTest.word).to.equal('import');
            expect(wordUnderTest.pos).to.equal('v');
            expect(wordUnderTest.ptrSymbols).to.deep.equal('! @ ~ + ;'.split(' '));
            expect(wordUnderTest.tagsenseCnt).to.equal(1);
            expect(wordUnderTest.synsetOffsets).to.deep.equal(
                '02346136 02232722 00932636'.split(' ').map(i => Number(i))
            );
        });

        it('loads all entries for "import"', () => {
            const definitions = wordUnderTest.wordnetSenses;
            expect(definitions).to.be.an.instanceof(Array);
            expect(definitions).to.have.length(3);
            definitions.forEach(def => {
                expect(def).to.be.an.instanceof(Wordnet.Sense);
                expect(def.word).to.match(/import|spell/); // wordnet bug?
            });
        });
    });

    describe('WordnetDatafile', () => {
        it('finds line by synset offset', async () => {
            const line: string = Wordnet.Wordnet.dataFiles.v._getLineBySynsetOffset(2346409);
            expect(line).to.equal(
                // tslint:disable-next-line:max-line-length
                '02346409 40 v 01 export 0 009 @ 02260362 v 0000 ;c 01090446 n 0000 + 03306207 n 0102 + 01111952 n 0102 + 03306207 n 0101 + 10073634 n 0101 + 01111952 n 0101 ! 02346136 v 0101 ~ 02345856 v 0000 03 + 08 00 + 16 00 + 21 00 | sell or transfer abroad; "we export less than we import and have a negative trade balance"'
            );
        });
    });

    describe('WordnetSense', () => {
        it('from line found by synset offset', async () => {
            const line: string = Wordnet.Wordnet.dataFiles.v._getLineBySynsetOffset(2346409);
            const sense: Wordnet.Sense = Wordnet.Sense.fromLine(line);
            expect(sense).to.be.an.instanceof(Wordnet.Sense);
            expect(sense.word).to.equal('export');
            expect(sense.synsetOffset).to.equal(2346409);
            expect(sense.wCnt).to.equal(1);
            expect(sense.pCnt).to.equal(9);
            expect(sense.lexId).to.equal('0');
            expect(sense.lexFilenum).to.equal(40);
            expect(sense.ptrs).to.be.an.instanceof(Array);
            expect(sense.ptrs).to.have.lengthOf(sense.pCnt);
            sense.ptrs.forEach(ptr => {
                expect(ptr).to.be.an.instanceof(Wordnet.Pointer);
            });
            expect(sense.gloss).to.equal(
                'sell or transfer abroad; "we export less than we import and have a negative trade balance"'
            );
        });
    });

    it('finds the opposite of verb "import"', () => {
        const inputWord = Wordnet.Wordnet.findWord('import', 'v');
        const antonyms = inputWord.antonym;
        expect(antonyms).to.be.an.instanceof(Array);
        expect(antonyms).to.have.length(2);
        antonyms.forEach(word => {
            expect(word).to.be.an.instanceof(Wordnet.Sense);
            expect(word.word).to.equal('export');
        });
    });

    it('finds all forms of  "like"', () => {
        const indexEntries = Wordnet.Wordnet.findWord('excuse');
        expect(indexEntries).to.be.an.instanceof(Array);
        expect(indexEntries).to.have.length(1);
        indexEntries.forEach(indexEntry => {
            expect(indexEntry).to.be.an.instanceof(Wordnet.IndexEntry);
            expect(indexEntry.word).to.equal('excuse');
            const senses = indexEntry.wordnetSenses;
            expect(senses).to.be.an.instanceof(Array);
            senses.forEach(sense => {
                expect(sense).to.be.an.instanceof(Wordnet.Sense);
            });
        });
    });
});
