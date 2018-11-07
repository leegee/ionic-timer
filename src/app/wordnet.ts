import * as path from 'path';
import * as fs from 'fs';

export namespace Wordnet {
    const INPUT_BUFFER_READ_LINE_SIZE = 256;

    /**
     * Entries in the Wordnet `index.*` files, whose format in 3.1 is as follows:
     *
     *  lemma  pos  synset_cnt  p_cnt  [ptr_symbol...]  sense_cnt  tagsense_cnt   synset_offset  [synset_offset...]
     */
    export class IndexEntry {
        static _pointerMapEngToSymbol: { [key: string]: string } = {
            antonym: '!',
            hypernym: '@',
            instanceHypernym: '@i',
            hypnym: '~',
            instanceHyponym: '~i',
            memberHolonym: '#m',
            substanceHolonym: '#s',
            partHolonym: '#p',
            memberMeronym: '%m',
            substanceMeronym: '%s',
            partMeronym: '%p',
            attribute: '=',
            derivationallyRelatedForm: '+',
            domainofSynsetTopic: ';c',
            memberofThisDomainTopic: '-c',
            domainofSynsetRegion: ';r',
            memberofThisDomainRegion: '-r',
            domainofSynsetUsage: ';u',
            memberofThisDomainUsage: '-u'
        };

        word: string; // lemma
        pos: string; // pos
        ptrSymbols: string[] = [];
        synsetOffsets: number[] = [];
        tagsenseCnt: number;
        _wordnetSenses: Sense[] = [];
        _antonyms: Sense[] = [];
        _pointedAt: { [key: string]: Sense[] } = {};

        /**
         *
         * @param line The line from an `index.*` "database file".
         */
        constructor(line: string) {
            const parts = line.trim().split(/\s+/);
            this.word = parts.shift();
            this.pos = parts.shift();
            parts.shift(); // sense_cnt
            const p_cnt = Number(parts.shift());
            for (let i = 0; i < p_cnt; i++) {
                this.ptrSymbols.push(parts.shift());
            }
            parts.shift();  // sense_cnt
            this.tagsenseCnt = Number(parts.shift());
            this.synsetOffsets = parts.map(i => Number(i));

            Object.keys(IndexEntry._pointerMapEngToSymbol).forEach(englishKey => {
                Object.defineProperty(this, englishKey, {
                    get: () => this.getPointer(
                        IndexEntry._pointerMapEngToSymbol[englishKey]
                    )
                });
            });
        }

        /**
         * Dereferences the entry's senses.
         * @returns Sense[]
         */
        get wordnetSenses(): Sense[] {
            Wordnet.logger.debug('get wordnetSenses from [%s]', this._wordnetSenses);
            if (!this._wordnetSenses.length) {
                this.synsetOffsets.forEach(synsetOffset => {
                    Wordnet.logger.debug('Try synsetOffset', synsetOffset, 'with pos', this.pos);
                    this._wordnetSenses.push(
                        Wordnet.dataFiles[this.pos].getSense(synsetOffset)
                    );
                });
            }
            return this._wordnetSenses;
        }

        /**
         * Dereferences the entry's semantic pointers from the entry's sense definitions, 
         * as identified by their `wininput(5WN)` pointer symbol.
         * @param ptrSymbol Pointer symbol.
         * @returns Sense[]
         * @see 'Pointers' in  https://wordnet.princeton.edu/documentation/wninput5wn
         */
        getPointer(ptrSymbol: string): Sense[] {
            if (!this._pointedAt[ptrSymbol]) {
                this._pointedAt[ptrSymbol] = [];
                this.wordnetSenses.forEach(sense => {
                    sense.ptrs.filter(ptr => ptr.pointerSymbol === ptrSymbol).forEach(ptr => {
                        const word = Sense.fromPointer(ptr);
                        this._pointedAt[ptrSymbol].push(word);
                    });
                });
            }
            return this._pointedAt[ptrSymbol];
        }
    }

    export class Pointer {
        pointerSymbol: string;
        synsetOffset: number;
        pos: string;
        source: string; // two-digit hex
        target: string; // two-digit hex

        constructor(
            pointerSymbol: string,
            synsetOffset: number,
            pos: string,
            sourceTarget: string
        ) {
            this.pointerSymbol = pointerSymbol;
            this.synsetOffset = synsetOffset;
            this.pos = pos;
            this.source = sourceTarget.substr(0, 2);
            this.target = sourceTarget.substr(2, 2);
        }

        static fromParts(pCnt: number, parts: string[]): [Pointer[], string[]] {
            const ptrs: Pointer[] = [];
            for (let i = 1; i <= pCnt; i++) {
                ptrs.push(
                    new Pointer(
                        parts.shift(),
                        Number(parts.shift()),
                        parts.shift(),
                        parts.shift()
                    )
                );
            }
            return [ptrs, parts];
        }
    }

    // synset_offset  lex_filenum  ss_type  w_cnt  word  lex_id  [word  lex_id...]  p_cnt  [ptr...]  [frames...]  |   gloss
    export class Sense {
        synsetOffset: number;
        lexFilenum: number;
        ssType: string; // aka pos
        wCnt: number;
        word: string;
        lexId: string; // 1-digit hex
        pCnt: number; // 3-digit decimal
        ptrs: Pointer[];
        franes: string; // TODO
        gloss: string;

        static fromPointer(ptr: Pointer): Sense {
            return Wordnet.dataFiles[ptr.pos].getSense(ptr.synsetOffset);
        }

        static fromLine(line: string): Sense {
            const self = new Sense();

            let parts = line.split('|', 2);
            self.gloss = parts[1].trim();

            parts = line.split(' ');

            self.synsetOffset = Number(parts.shift());
            self.lexFilenum = Number(parts.shift());
            self.ssType = parts.shift();
            self.wCnt = Number(parts.shift());
            self.word = parts.shift();
            self.lexId = parts.shift();
            self.pCnt = Number(parts.shift());
            [self.ptrs, parts] = Pointer.fromParts(self.pCnt, parts);
            return self;
        }
    }


    export class SourceFile {
        static descriptorCache: { [key: string]: number } = {};

        suffix: string;
        type: string; // aka pos, ssType
        path: string;
        fd: number;

        constructor(suffix: string, type: string, filepath: string) {
            this.suffix = suffix;
            this.type = type;
            this.path = filepath;
            if (!SourceFile.descriptorCache.hasOwnProperty(this.path)) {
                SourceFile.descriptorCache[this.path] = fs.openSync(this.path, 'r');
            }
            this.fd = SourceFile.descriptorCache[this.path];
        }
    }

    export class DataFile extends SourceFile {
        /**
         * Returns a Wordnet sense object representing  the given line.
         * @param synsetOffset The line offset in the `data.${this.type}` file.
         */
        getSense(synsetOffset: number): Sense {
            Wordnet.logger.debug('getSense for pos [%s] synset [%d]', this.type, synsetOffset);
            const line = this._getLineBySynsetOffset(synsetOffset);
            Wordnet.logger.debug('Got line: ', line);
            return Sense.fromLine(line);
        }

        _getLineBySynsetOffset(synsetOffset: number): string {
            if (!synsetOffset || typeof synsetOffset !== 'number') {
                throw new TypeError('Expected a synsetOffset as a Number');
            }
            let readFrom = synsetOffset;
            const inputBuffer = Buffer.alloc(INPUT_BUFFER_READ_LINE_SIZE);
            fs.readSync(this.fd, inputBuffer, 0, inputBuffer.byteLength, readFrom);
            let line = inputBuffer.toString();

            while (line.indexOf('\n') === -1) {
                readFrom += INPUT_BUFFER_READ_LINE_SIZE;
                Wordnet.logger.debug('Read more from ', readFrom);
                fs.readSync(this.fd, inputBuffer, 0, inputBuffer.byteLength, readFrom);
                line = line + inputBuffer.toString();
            }

            line = line.substring(0, line.indexOf('\n')).trimRight();
            return line;
        }
    }


    export class IndexFile extends SourceFile {
        /**
        * Returns a `WordnetIndexEntry` object for the supplied string.
        * @param subject Word sought.
        */
        findIndexEntry(subject: string) {
            const stats = fs.fstatSync(this.fd);
            return this._findIndexEntry(
                subject.toLocaleLowerCase(),
                Buffer.alloc(INPUT_BUFFER_READ_LINE_SIZE),
                Math.floor(stats.size / 2),
                stats.size
            );
        }

        /*
         * Binary search.
         * @param subject The subject of the search.
         * @param inputBuffer Preallocated input buffer.
         * @param pos Current position within the intput file.
         * @param totalLength Total length of the file.
         */
        _findIndexEntry(
            subject: string,
            inputBuffer: Buffer,
            pos: number,
            totalLength: number
        ): IndexEntry | null {
            fs.readSync(this.fd, inputBuffer, 0, inputBuffer.byteLength, pos);
            // Wordnet.logger.debug('\n[%s] Read from %d / %d: %s', subject, pos, totalLength, inputBuffer.toString());

            const newlineStartPos = inputBuffer.indexOf('\n') + 1;
            const wordStartPos = newlineStartPos;
            const wordEndPos = inputBuffer.indexOf(` `, wordStartPos);
            const word = inputBuffer.toString().substring(wordStartPos, wordEndPos);
            // Wordnet.logger.debug('Reading word [%s] looking for [%s]', word, subject);

            const comparision = subject.localeCompare(word);
            if (comparision === 0) {
                // Wordnet.logger.info('FOUND! [%s]');
                let line = inputBuffer.toString().substring(newlineStartPos);
                // Wordnet.logger.info('Line [%s]', line);
                if (line.indexOf('\n') === -1) {
                    // Wordnet.logger.log('Read more');
                    fs.readSync(this.fd, inputBuffer, 0, inputBuffer.byteLength, pos + newlineStartPos);
                    // Wordnet.logger.info('Final read [%s]', inputBuffer);
                    line = line + inputBuffer.toString();
                }
                line = line.substring(0, line.indexOf('\n')).trimRight();
                // Wordnet.logger.info('\n\nFINAL FOUND LINE [%s] ', line);
                return new IndexEntry(line);
            }

            if (comparision < 0) {
                totalLength = pos;
                pos = Math.floor(pos = pos / 2);
                // Wordnet.logger.debug('<', pos);
            } else {
                pos = pos + Math.floor((totalLength - pos) / 2);
                // Wordnet.logger.debug('>', pos, totalLength);
            }

            if (totalLength - pos <= INPUT_BUFFER_READ_LINE_SIZE) {
                // return this._findWordInIndex(subject, inputBuffer, totalLength - INPUT_BUFFER_READ_LINE_SIZE, totalLength);
                return null;
            } else if (pos >= totalLength || pos <= 0) {
                Wordnet.logger.warn('Not found', subject, pos, totalLength);
                return null;
            }

            // Wordnet.logger.log('recurse ', subject, pos, totalLength);
            return this._findIndexEntry(subject, inputBuffer, pos, totalLength);
        }
    }

    // tslint:disable-next-line:no-shadowed-variable
    export class Wordnet {
        static GET_synset_POINTER_RE = /(?<pointerSymbol>\!)\s(?<synsetOffset>\d+)\s(?<pos>\w)\s(?<source>\d\d)(?<target>\d\d)/;

        static indexFiles: { [key: string]: IndexFile } = {
            r: new IndexFile('adj', 'r', path.resolve('src/assets/wordnet/index.adj')),
            a: new IndexFile('adv', 'a', path.resolve('src/assets/wordnet/index.adv')),
            n: new IndexFile('noun', 'n', path.resolve('src/assets/wordnet/index.noun')),
            v: new IndexFile('verb', 'v', path.resolve('src/assets/wordnet/index.verb'))
        };

        static dataFiles: { [key: string]: DataFile } = {
            r: new DataFile('adj', 'r', path.resolve('src/assets/wordnet/data.adj')),
            a: new DataFile('adv', 'a', path.resolve('src/assets/wordnet/data.adv')),
            n: new DataFile('noun', 'n', path.resolve('src/assets/wordnet/data.noun')),
            v: new DataFile('verb', 'v', path.resolve('src/assets/wordnet/data.verb'))
        };

        static _logger: any = console;

        static set logger(_logger) {
            this._logger = _logger;
        }

        static get logger() {
            return Wordnet._logger;
        }

        static findWord(subject: string, filetypeKey?: string) {
            const types = filetypeKey ? [filetypeKey] : Object.keys(this.indexFiles);
            const rv = [];
            types.forEach(type => {
                const word = this.indexFiles[type].findIndexEntry(subject);
                if (word !== null) {
                    rv.push(word);
                }
            });

            if (filetypeKey) {
                return rv.length ? rv[0] : null;
            }
            return rv;
        }

    }
}










