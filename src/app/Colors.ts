import * as d3Scale from 'd3-scale';
import * as d3Color from 'd3-color';

export class Colors {
    static cachedForegroundColor: { [key: number]: string } = {};

    static colourRange = {
        min: 'white',
        max: 'steelblue'
    };

    static rgbaFromAny(input: string): [string, number, number, number, number] {
        let rgbaStr = 'rgba(0,0,0,0)';
        let rgbaArray = [0, 0, 0, 0];
        console.log('input', input);
        if (typeof input !== 'undefined' && input !== null && input !== 'transparent' && input !== '') {
            if (input.indexOf('#') === 0) {
                [rgbaStr, ...rgbaArray] = Colors.hex2rgba(input);
            } else {
                rgbaStr = input.replace(/\s+/g, '');
                const [, ...mRgba] = rgbaStr.match(/^rgba?\((\d+),(\d+),(\d+),(\d+)?\)$/);
                if (mRgba.length === 3) {
                    mRgba.push('1');
                }
                mRgba.forEach(str => {
                    rgbaArray.push(Number(str));
                });
            }
        }
        console.log('output', [rgbaStr, rgbaArray[0], rgbaArray[1], rgbaArray[2], rgbaArray[3]]);
        return [rgbaStr, rgbaArray[0], rgbaArray[1], rgbaArray[2], rgbaArray[3]];
    }

    static hex2rgba(hex: string): [string, number, number, number, number] {
        const rgbaHex: string[] = [];
        const rgbaDec: number[] = [];
        let alpha: number;
        console.log('hex2rgba input', hex);
        if (hex.length <= 4) {
            [, rgbaHex[0], rgbaHex[1], rgbaHex[2], alpha] = hex.match(/^\#(.)(.)(.)(.)?$/);
        } else {
            [, rgbaHex[0], rgbaHex[1], rgbaHex[2], alpha] = hex.match(/^\#(..)(..)(..)(..)?$/);
        }

        for (let i = 0; i < rgbaHex.length; i++) {
            rgbaDec.push(parseInt(rgbaHex[i], 16));
        }

        console.log('hex alpha = ', alpha);
        if (alpha === undefined) {
            alpha = 1;
        }

        return ['rgba(' + rgbaDec.join(',') + ')', rgbaDec[0], rgbaDec[1], rgbaDec[2], alpha];
    }

    // https://github.com/d3/d3-scale/blob/master/README.md#quantize-scales
    static getColorRange(datasetOrMax: number | number[]) {
        let minTemp = 0;
        let maxTemp: number;
        if (datasetOrMax instanceof Array) {
            minTemp = Math.min(...datasetOrMax);
            maxTemp = Math.max(...datasetOrMax);
        } else {
            maxTemp = datasetOrMax;
        }
        return d3Scale.scaleQuantize()
            .domain([minTemp, maxTemp])
            .range([Colors.colourRange.min as any, Colors.colourRange.max]);
    }

    static getForegroundColor(datasetOrMax: number | number[]): string {
        if ((!(datasetOrMax instanceof Array)) &&
            Colors.cachedForegroundColor.hasOwnProperty(datasetOrMax as number)
        ) {
            return Colors.cachedForegroundColor[datasetOrMax as number];
        }
        return d3Color.hsl(
            Colors.getColorRange(datasetOrMax) as any
        ).l > 0.5 ? Colors.colourRange.max : Colors.colourRange.min;
        // '#000' : '#fff';
    }
}
