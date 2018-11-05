import * as fs from 'fs';
import * as util from 'util';

const read = util.promisify(fs.read);
const inputBufferSize = 256;

export class BinaryFileSearch {
    static async findLineContaining(path: string, subject: string) {
        let FH;
        try {
            FH = fs.openSync(path, 'r');
        } catch (e) {
            throw e;
        }


        const inputBuffer = Buffer.alloc(inputBufferSize);

        const stats = fs.fstatSync(FH);
        const pos = Math.floor(stats.size / 2);

        return BinaryFileSearch._findLineContaining(subject, FH, inputBuffer, pos, stats.size);
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

        return BinaryFileSearch._findLineContaining(subject, FH, inputBuffer, pos, totalLength);
    }
}
