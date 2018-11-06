import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';

const read = util.promisify(fs.read);
const INPUT_BUFFER_READ_LINE_SIZE = 256;

export interface RegExpMatchArrayX10d extends RegExpMatchArray {
    groups: {};
}

export interface RegExpMatchArrayGetsynsetPointerReGroups extends RegExpMatchArray {
    groups: GetsynsetPointerReGroups;
}

export interface GetsynsetPointerReGroups {
    pointerSymbol: string;
    synsetOffset: number;
    pos: string;
    source: string;
    target: string;
}

export class WordnetIndexEntry {
    // lemma  pos  synset_cnt  p_cnt  [ptr_symbol...]  sense_cnt  tagsense_cnt   synset_offset  [synset_offset...]
    word: string; // lemma
    pos: string; // pos
    ptrSymbols: string[] = [];
    synsetOffsets: number[] = [];
    tagsenseCnt: number;
    _wordnetSenses: WordnetSense[] = [];
    _antonyms: WordnetSense[] = [];

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
    }

    get wordnetSenses(): WordnetSense[] {
        if (!this._wordnetSenses.length) {
            this.synsetOffsets.forEach(synsetOffset => {
                const line = Wordnet.dataFiles[this.pos]._getLineBySynsetOffset(synsetOffset);
                this._wordnetSenses.push(WordnetSense.fromLine(line));
            });
        }
        return this._wordnetSenses;
    }

    get antonyms(): WordnetSense[] {
        if (this._antonyms.length === 0) {
            this.wordnetSenses.forEach(sense => {
                sense.ptrs.filter(ptr => ptr.pointerSymbol === '!').forEach(ptr => {
                    const word = WordnetSense.fromPointer(ptr);
                    this._antonyms.push(word );
                });
            });
        }
        return this._antonyms;
    }
}

export class WordnetPointer {
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

    static fromParts(pCnt: number, parts: string[]): [WordnetPointer[], string[]] {
        const ptrs: WordnetPointer[] = [];
        for (let i = 1; i <= pCnt; i++) {
            ptrs.push(
                new WordnetPointer(
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
export class WordnetSense {
    synsetOffset: number;
    lexFilenum: number;
    ssType: string; // aka pos
    wCnt: number;
    word: string;
    lexId: string; // 1-digit hex
    pCnt: number; // 3-digit decimal
    ptrs: WordnetPointer[];
    franes: string; // TODO
    gloss: string;

    static fromPointer(ptr: WordnetPointer): WordnetSense {
        const line = Wordnet.dataFiles[ptr.pos]._getLineBySynsetOffset(ptr.synsetOffset);
        return WordnetSense.fromLine(line);
    }

    static fromLine(line: string): WordnetSense {
        const self = new WordnetSense();

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
        [self.ptrs, parts] = WordnetPointer.fromParts(self.pCnt, parts);
        return self;
    }
}


export class WordnetSourceFile {
    static descriptorCache: { [key: string]: number } = {};

    suffix: string;
    type: string;
    path: string;
    fd: number;

    constructor(suffix: string, type: string, filepath: string) {
        this.suffix = suffix;
        this.type = type;
        this.path = filepath;
        this.fd = fs.openSync(this.path, 'r');
    }

    findWord(subject: string) {
        const stats = fs.fstatSync(this.fd);
        const rv = this._findWordInIndex(
            subject.toLocaleLowerCase(),
            Buffer.alloc(INPUT_BUFFER_READ_LINE_SIZE),
            Math.floor(stats.size / 2),
            stats.size
        );
        return rv;
    }

    /**
     * Binary search.
     * @param subject The subject of the search.
     * @param inputBuffer Preallocated input buffer.
     * @param pos Current position within the intput file.
     * @param totalLength Total length of the file.
     */
    _findWordInIndex(
        subject: string,
        inputBuffer: Buffer,
        pos: number,
        totalLength: number
    ): WordnetIndexEntry | null {
        fs.readSync(this.fd, inputBuffer, 0, inputBuffer.byteLength, pos);
        // console.debug('\n[%s] Read from %d / %d: %s', subject, pos, totalLength, inputBuffer.toString());

        const newlineStartPos = inputBuffer.indexOf('\n') + 1;
        const wordStartPos = newlineStartPos;
        const wordEndPos = inputBuffer.indexOf(` `, wordStartPos);
        const word = inputBuffer.toString().substring(wordStartPos, wordEndPos);
        // console.debug('Reading word [%s] looking for [%s]', word, subject);

        const comparision = subject.localeCompare(word);
        if (comparision === 0) {
            // console.info('FOUND! [%s]');
            let line = inputBuffer.toString().substring(newlineStartPos);
            // console.info('Line [%s]', line);
            if (line.indexOf('\n') === -1) {
                // console.log('Read more');
                fs.readSync(this.fd, inputBuffer, 0, inputBuffer.byteLength, pos + newlineStartPos);
                // console.info('Final read [%s]', inputBuffer);
                line = line + inputBuffer.toString();
            }
            line = line.substring(0, line.indexOf('\n')).trimRight();
            // console.info('\n\nFINAL FOUND LINE [%s] ', line);
            return new WordnetIndexEntry(line);
        }

        if (comparision < 0) {
            totalLength = pos;
            pos = Math.floor(pos = pos / 2);
            // console.debug('<', pos);
        } else {
            pos = pos + Math.floor((totalLength - pos) / 2);
            // console.debug('>', pos, totalLength);
        }

        if (pos >= totalLength || pos <= 0) {
            console.warn('Not found', subject, pos, totalLength);
            return null;
        }

        return this._findWordInIndex(subject, inputBuffer, pos, totalLength);
    }

    _getLineBySynsetOffset(synsetOffset: number): string {
        if (!synsetOffset) {
            throw new TypeError('Expected a synsetOffset');
        }
        const inputBuffer = Buffer.alloc(INPUT_BUFFER_READ_LINE_SIZE);
        fs.readSync(this.fd, inputBuffer, 0, inputBuffer.byteLength, synsetOffset);
        let line = inputBuffer.toString();

        while (line.indexOf('\n') === -1) {
            fs.readSync(this.fd, inputBuffer, 0, inputBuffer.byteLength, synsetOffset + INPUT_BUFFER_READ_LINE_SIZE);
            line = line + inputBuffer.toString();
        }

        line = line.substring(0, line.indexOf('\n')).trimRight();
        return line;
    }
}

export class Wordnet {
    static GET_synset_POINTER_RE = /(?<pointerSymbol>\!)\s(?<synsetOffset>\d+)\s(?<pos>\w)\s(?<source>\d\d)(?<target>\d\d)/;

    static indexFiles: { [key: string]: WordnetSourceFile } = {
        r: new WordnetSourceFile('adj', 'r', path.resolve('src/assets/wordnet/index.adj')),
        a: new WordnetSourceFile('adv', 'a', path.resolve('src/assets/wordnet/index.adv')),
        n: new WordnetSourceFile('noun', 'n', path.resolve('src/assets/wordnet/index.noun')),
        v: new WordnetSourceFile('verb', 'v', path.resolve('src/assets/wordnet/index.verb'))
    };

    static dataFiles: { [key: string]: WordnetSourceFile } = {
        r: new WordnetSourceFile('adj', 'r', path.resolve('src/assets/wordnet/data.adj')),
        a: new WordnetSourceFile('adv', 'a', path.resolve('src/assets/wordnet/data.adv')),
        n: new WordnetSourceFile('noun', 'n', path.resolve('src/assets/wordnet/data.noun')),
        v: new WordnetSourceFile('verb', 'v', path.resolve('src/assets/wordnet/data.verb'))
    };

    static findWord(subject: string, filetypeKey: string) {
        return Wordnet.indexFiles[filetypeKey].findWord(subject);
    }

}











