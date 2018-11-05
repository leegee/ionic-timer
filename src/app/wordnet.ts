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

export interface GetBasicSysnetInfoRe {
    wordSynsetOffset: number;
    wordLexFilenum: string;
    wordSsType: string;
    word: string;
}

export interface GetSysnetPointerReGroups {
    pointerSymbol: string;
    pointerSysnetOffset: number;
    pos: string;
    source: string;
    target: string;
}

export class DataFile {

    static descriptorCache: { [key: string]: number } = {};

    suffix: string;
    type: string;
    path: string;

    constructor(suffix: string, type: string, filepath: string) {
        this.suffix = suffix;
        this.type = type;
        this.path = filepath;
    }

    get descriptor() {
        let FH;
        if (DataFile.descriptorCache[this.type]) {
            FH = DataFile.descriptorCache[this.type];
        } else {
            try {
                FH = fs.openSync(this.path, 'r');
                DataFile.descriptorCache[this.type] = FH;
            } catch (e) {
                throw e;
            }
        }
        return FH;
    }
}

export class Wordnet {
    // tslint:disable-next-line:max-line-length
    static GET_BASIC_SYSNET_INFO_RE = /^(?<wordSynsetOffset>\d+)\s(?<wordLexFilenum>\d\d)\s(?<wordSsType>[nvasr])\s(?<wCnt>\d\d)(?<word>\S+)\s/;
    static GET_SYSNET_POINTER_RE = /(?<pointerSymbol>\!)\s(?<pointerSysnetOffset>\d+)\s(?<pos>\w)\s(?<source>\d\d)(?<target>\d\d)/;

    static dataFiles: { [key: string]: DataFile } = {
        r: new DataFile('adj', 'r', path.resolve('src/assets/wordnet/data.adj')),
        a: new DataFile('adv', 'a', path.resolve('src/assets/wordnet/data.adv')),
        n: new DataFile('noun', 'n', path.resolve('src/assets/wordnet/data.noun')),
        v: new DataFile('verb', 'v', path.resolve('src/assets/wordnet/data.verb'))
    };

    /**
     * Parse (only the antonym) from a data file line
     * @param line Line to parse
     * @see https://wordnet.princeton.edu/documentation/wndb5wn
     * @see https://wordnet.princeton.edu/documentation/wninput5wn
     */
    static async _findOppositeFromLine(line: string): Promise<string> {
        // ! 02346409 v 0101 ~ 02345856 v 0000 02 + 08 00 + 21 00 | bring in from abroad')
        const result = Wordnet.GET_SYSNET_POINTER_RE.exec(line) as RegExpMatchArrayGetSysnetPointerReGroups;
        const foundLine = await Wordnet.findLineContainingSysnetOffset(
            result.groups.pos,
            Number(result.groups.pointerSysnetOffset)
        );
        return foundLine;
    }

    static async findLineContainingSysnetOffset(filetype: string, sysnetOffset: number): Promise<string | null> {
        const FH = Wordnet.dataFiles[filetype].descriptor;
        const inputBuffer = Buffer.alloc(INPUT_BUFFER_READ_LINE_SIZE);
        const readRv = await read(FH, inputBuffer, 0, inputBuffer.byteLength, sysnetOffset);
        let line = readRv.buffer.toString();

        if (line.indexOf('\n') === -1) {
            const finalReadRv = await read(FH, inputBuffer, 0, inputBuffer.byteLength, sysnetOffset + INPUT_BUFFER_READ_LINE_SIZE);
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
    static async findLineContainingWord(subject: string, filetypeKey: string): Promise<string | null> {
        const FH = Wordnet.dataFiles[filetypeKey].descriptor;
        const inputBuffer = Buffer.alloc(INPUT_BUFFER_READ_LINE_SIZE);
        const stats = fs.fstatSync(FH);
        const pos = Math.floor(stats.size / 2);
        return Wordnet._findLineContaining(subject.toLocaleLowerCase(), FH, inputBuffer, pos, stats.size);
    }

    /**
     * Find the Wordnet lien that defines a word.
     * @param subject The word
     */
    static async findAllLinesContainingWord(subject: string): Promise<string[]> {
        const promises = [];
        const rvs = [];
        Object.keys(Wordnet.dataFiles).forEach(filetypeKey => {
            promises.push(
                Wordnet.findLineContainingWord(subject, filetypeKey).then(rv => {
                    if (rv !== null) {
                        // rvs.push(Wordnet.parseDatafileLine(rv));
                        rvs.push(rv);
                    }
                })
            );
        });
        await Promise.all(promises);
        return rvs;
    }

    /**
     * Closes all open file descriptors.
     */
    static destroy(): void {
        Object.keys(Wordnet.dataFiles).forEach(filetypeKey => {
            Wordnet.dataFiles[filetypeKey].descriptor.close();
        });
    }
}
