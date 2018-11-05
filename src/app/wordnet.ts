import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';

const read = util.promisify(fs.read);
const INPUT_BUFFER_SIZE = 256;

const Paths2FH = {};

export class Wordnet {

    static DATA_PATHS = Wordnet._initPaths('src/assets/wordnet');

    static _initPaths(relativeRootDir: string): string[] {
        const rv = [];
        ['adj', 'adv', 'noun', 'verb'].forEach(suffix => {
            rv.push(
                path.resolve(relativeRootDir + '/data.' + suffix)
            );
        });
        return rv;
    }

    /**
     * Closes all open file descriptors.
     */
    static destroy(): void {
        Object.keys(Paths2FH).forEach(key => {
            Paths2FH[key].close();
        });
    }

    /**
     * Get a filehandle for a filepath.
     * @param filepath File path of a Wordnet data file.
     * @returns A file descriptor.
     * @throws If the file is not found or cannot be opened.
     */
    static getFilehandle(filepath: string): number {
        let FH;
        if (Paths2FH[filepath]) {
            FH = Paths2FH[filepath];
        } else {
            try {
                FH = fs.openSync(filepath, 'r');
                Paths2FH[filepath] = FH;
            } catch (e) {
                throw e;
            }
        }
        return FH;
    }

    static async findOppositeOf(subject: string) { }

    /**
     * Find the Wordnet lien that defines a word.
     * @param subject The word
     */
    static async findDefinition(subject: string): Promise<string[]> {
        const promises = [];
        const rvs = [];
        Wordnet.DATA_PATHS.forEach(filepath => {
            promises.push(
                Wordnet.findLineContaining(filepath, subject).then(rv => {
                    if (rv !== null) {
                        rvs.push(rv);
                    }
                })
            );
        });
        await Promise.all(promises);
        return rvs;
    }

    /**
     * Performs a binary search to get the line containing the specified Wordnet subject from specified filepath.
     * @param filepath Path to a Wordnet data file.
     * @param subject The subject to find.
     * @return A `Promise` resolving in the found line, or `null`.
     */
    static async findLineContaining(filepath: string, subject: string): Promise<string | null> {
        const FH = Wordnet.getFilehandle(filepath);
        const inputBuffer = Buffer.alloc(INPUT_BUFFER_SIZE);
        const stats = fs.fstatSync(FH);
        const pos = Math.floor(stats.size / 2);
        return Wordnet._findLineContaining(subject.toLocaleLowerCase(), FH, inputBuffer, pos, stats.size);
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
            return line;
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
}
