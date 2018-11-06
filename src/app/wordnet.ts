import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';

const read = util.promisify(fs.read);
const INPUT_BUFFER_READ_LINE_SIZE = 256;

export interface RegExpMatchArrayX10d extends RegExpMatchArray {
    groups: {};
}

export interface RegExpMatchArrayGetSysnetPointerReGroups extends RegExpMatchArray {
    groups: GetSysnetPointerReGroups;
}

export interface GetSysnetPointerReGroups {
    pointerSymbol: string;
    sysnetOffset: number;
    pos: string;
    source: string;
    target: string;
}

export class WordnetIndexEntry {
    // lemma  pos  synset_cnt  p_cnt  [ptr_symbol...]  sense_cnt  tagsense_cnt   synset_offset  [synset_offset...] 
    word: string; // lemma
    pos: string; // pos
    ptrSymbols: string[] = [];
    sysnetOffsets: string[] = [];
    tagsenseCnt: number;

    constructor(line: string) {
        const parts = line.split(/\s+/);
        this.word = parts.shift();
        this.pos = parts.shift();
        parts.shift(); // sense_cnt
        const  p_cnt = Number( parts.shift() );
        for (let i = 0; i < p_cnt; i++ ){
            this.ptrSymbols.push( parts.shift() );
        }
        parts.shift();  // sense_cnt
        this.tagsenseCnt = Number( parts.shift() );
        this.sysnetOffsets = parts;
    }
}

export class WordnetSourceFile {
    static descriptorCache: { [key: string]: number } = {};

    suffix: string;
    type: string;
    path: string;
    descriptor: number;

    constructor(suffix: string, type: string, filepath: string) {
        this.suffix = suffix;
        this.type = type;
        this.path = filepath;
        this.descriptor = fs.openSync(this.path, 'r');
    }

    close() {
        if (WordnetSourceFile.descriptorCache[this.type]) {
            console.log('--- close fd ', WordnetSourceFile.descriptorCache[this.type]);
            fs.closeSync(WordnetSourceFile.descriptorCache[this.type]);
            delete WordnetSourceFile.descriptorCache[this.type];
        }
    }

    // get descriptor() {
    //     let fd;
    //     if (DataFile.descriptorCache[this.type]) {
    //         fd = DataFile.descriptorCache[this.type];
    //         console.log('--- cached fd, ', fd);
    //     } else {
    //         try {
    //             fd = fs.openSync(this.path, 'r');
    //             DataFile.descriptorCache[this.type] = fd;
    //             console.log('--- new fd, ', fd);
    //         } catch (e) {
    //             throw e;
    //         }
    //     }
    //     return fd;
    // }
}


export interface GetBasicSysnetInfoReGroups extends RegExpMatchArray {
    groups: GetBasicSysnetInfoRe;
}

export interface GetBasicSysnetInfoRe {
    synsnetOffset: number;
    lexFilenum: string;
    ssType: string;
    wCnt: number;
    word: string | null;
}

export class WordnetLine {
    // tslint:disable-next-line:max-line-length
    static GET_BASIC_SYSNET_INFO_RE = /^(?<synsnetOffset>\d+)\s(?<lexFilenum>\d\d)\s(?<ssType>[nvasr])\s(?<wCnt>\d\d)\s+(?<word>\S+)\s/;

    synsnetOffset: number;
    lexFilenum: number;
    ssType: string;
    wCnt: number;
    word: string | null = null;

    constructor(line: string) {
        const result = WordnetLine.GET_BASIC_SYSNET_INFO_RE.exec(line) as GetBasicSysnetInfoReGroups;
        if (result) {
            Object.keys(result.groups).forEach(key => {
                this[key] = result.groups[key];
            });
        }
    }
}

export class Wordnet {
    static GET_SYSNET_POINTER_RE = /(?<pointerSymbol>\!)\s(?<sysnetOffset>\d+)\s(?<pos>\w)\s(?<source>\d\d)(?<target>\d\d)/;

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

    /**
     * Parse (only the antonym) from a data file line
     * @param line Line to parse
     * @see https://wordnet.princeton.edu/documentation/wndb5wn
     * @see https://wordnet.princeton.edu/documentation/wninput5wn
     */
    static async _findOppositeFromLine(line: string): Promise<string | null> {
        // ! 02346409 v 0101 ~ 02345856 v 0000 02 + 08 00 + 21 00 | bring in from abroad')
        const result = Wordnet.GET_SYSNET_POINTER_RE.exec(line) as RegExpMatchArrayGetSysnetPointerReGroups;
        if (!result) {
            return null;
        }
        const foundLine = await Wordnet._findSysnetOffset(
            result.groups.pos,
            Number(result.groups.sysnetOffset)
        );
        return new WordnetLine(foundLine).word;
    }

    static async _findSysnetOffset(filetype: string, sysnetOffset: number): Promise<string | null> {
        const fd = Wordnet.dataFiles[filetype].descriptor;
        const inputBuffer = Buffer.alloc(INPUT_BUFFER_READ_LINE_SIZE);
        const readRv = await read(fd, inputBuffer, 0, inputBuffer.byteLength, sysnetOffset);
        let line = readRv.buffer.toString();

        if (line.indexOf('\n') === -1) {
            const finalReadRv = await read(fd, inputBuffer, 0, inputBuffer.byteLength, sysnetOffset + INPUT_BUFFER_READ_LINE_SIZE);
            line = line + finalReadRv.buffer.toString().substring(0, finalReadRv.buffer.indexOf('\n'));
        }

        return line.trimRight();
    }

    static async _findLineContaining(
        subject: string,
        FH: number,
        inputBuffer: Buffer,
        pos: number,
        totalLength: number
    ): Promise<string | null> {
        const readRv = await read(FH, inputBuffer, 0, inputBuffer.byteLength, pos);
        // console.debug('read from %d: %s', pos, readRv.buffer.toString());

        const newlineStartPos = readRv.buffer.indexOf('\n') + 1;
        const wordStartPos = newlineStartPos + 17;
        const wordEndPos = readRv.buffer.indexOf(` `, wordStartPos);
        const word = readRv.buffer.toString().substring(wordStartPos, wordEndPos);
        // console.debug('Reading word [%s]', word);

        const comparision = subject.localeCompare(word);
        if (comparision === 0) {
            // console.info('FOUND! [%s]', readRv.buffer.toString().substring(newlineStartPos));
            let line = readRv.buffer.toString().substring(newlineStartPos);
            // console.debug('Line a: [%s], idx of lf: [%d]', line, line.indexOf('\n'));
            if (line.indexOf('\n') === -1) {
                // console.log('Read more');
                const finalReadRv = await read(FH, inputBuffer, 0, inputBuffer.byteLength, pos + newlineStartPos);
                // console.info('Final read [%s]', finalReadRv.buffer);
                line = line + finalReadRv.buffer.toString().substring(0, finalReadRv.buffer.indexOf('\n'));
            }
            // console.info('\n\nFINAL FOUND LINE [%s] ', line);
            return line.trimRight();
        }

        if (comparision < 0) {
            Math.floor(pos = pos / 2);
            // console.debug('<', pos);
        } else {
            pos = pos + Math.floor((totalLength - pos) / 2);
            // console.debug('>', pos, totalLength);
        }

        if (pos >= totalLength || pos <= 0) {
            return null;
        }

        return Wordnet._findLineContaining(subject, FH, inputBuffer, pos, totalLength);
    }

    /**
     * Performs a binary search to get the line containing the specified Wordnet subject from specified filepath.
     * @param subject The subject to find.
     * @param filetypeKey Key describing the file type - @see TODO
     * @return A `Promise` resolving in the found line, or `null`.
     */
    static async findWordOfForm(subject: string, filetypeKey: string): Promise<string | null> {
        const fd = Wordnet.dataFiles[filetypeKey].descriptor;
        const readBuffer = Buffer.alloc(INPUT_BUFFER_READ_LINE_SIZE);
        const stats = fs.fstatSync(Wordnet.dataFiles[filetypeKey].descriptor);
        const pos = Math.floor(stats.size / 2);
        const rv = await Wordnet._findLineContaining(
            subject.toLocaleLowerCase(),
            fd,
            readBuffer, pos,
            stats.size
        );
        return rv;
    }

    /**
     * Find the Wordnet lien that defines a word.
     * @param subject The word
     */
    static async findAllWordForms(subject: string) {
        const rvs = [];
        Object.keys(Wordnet.dataFiles).forEach((filetypeKey) => {
            console.log('findAllWordForms: ', filetypeKey);
            const foundWord = Wordnet.findWordOfForm(subject, filetypeKey);
            console.log(':: foundWord: ', foundWord);
            rvs.push(foundWord);
        });
        console.log('DONE ---------------', rvs);
        const rv = await Promise.all(rvs);
        console.log('RV  ---------------', rv);
        return rv;
    }

    static async findOpposite(subject: string): Promise<string[]> {
        const rv = [];
        console.log('findOpposite', subject);
        const lines: string[] = await Wordnet.findAllWordForms(subject);

        console.log('findOpposite', lines);
        // lines.forEach(line => {
        //     rv.push(Wordnet._findOppositeFromLine(line));
        // });
        return lines;
    }

    /**
     * Closes all open file descriptors.
     */
    static closeAll(): void {
        Object.keys(Wordnet.dataFiles).forEach(filetypeKey => {
            Wordnet.dataFiles[filetypeKey].close();
        });
    }

    static findWord(subject: string, filetypeKey: string) {
        const stats = fs.fstatSync(Wordnet.indexFiles[filetypeKey].descriptor);
        const rv = Wordnet._findWord(
            subject.toLocaleLowerCase(),
            Wordnet.indexFiles[filetypeKey].descriptor,
            Buffer.alloc(INPUT_BUFFER_READ_LINE_SIZE),
            Math.floor(stats.size / 2),
            stats.size
        );
        return rv;
    }

    /**
     * Binary search.
     * @param subject The subject of the search.
     * @param fd File descriptor to read-only opened file.
     * @param inputBuffer Preallocated input buffer.
     * @param pos Current position within the intput file.
     * @param totalLength Total length of the file.
     */
    static _findWord(
        subject: string,
        fd: number,
        inputBuffer: Buffer,
        pos: number,
        totalLength: number
    ): WordnetIndexEntry | null {
        const readRv = fs.readSync(fd, inputBuffer, 0, inputBuffer.byteLength, pos);
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
                fs.readSync(fd, inputBuffer, 0, inputBuffer.byteLength, pos + newlineStartPos);
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

        return Wordnet._findWord(subject, fd, inputBuffer, pos, totalLength);
    }

}











