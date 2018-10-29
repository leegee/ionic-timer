import * as d3Scale from 'd3-scale';
import * as d3Color from 'd3-color';
import * as d3ScaleChromatic from 'd3-scale-chromatic';

export class Colors {

    static NUMBER_OF_COLORS = 10;

    static CATEGORY_COLORS: string[] = Colors._initCategoryColors();

    private static _cachedForegroundColor: { [key: number]: string } = {};

    static colourRange = {
        min: 'white',
        max: 'steelblue'
    };

    private static _initCategoryColors(): string[] {
        const categoryColors: string[] = [];
        for (let i = 0; i < Colors.NUMBER_OF_COLORS; i++) {
            const v = (1 / (Colors.NUMBER_OF_COLORS)) * (i + 1);
            categoryColors[i] = d3ScaleChromatic.interpolatePlasma(v);
        }
        return categoryColors;
    }

    static rgbaFromAny(input: string): [string, number, number, number, number] {
        let rgbaStr = 'rgba(0,0,0,0)';
        let rgbaArray: number[] = [];
        console.log('input', input);
        if (typeof input === 'undefined' || input === null || input === 'transparent' || input === '') {
            rgbaArray = [0, 0, 0, 0];
        } else {
            if (input.indexOf('#') === 0) {
                [rgbaStr, ...rgbaArray] = Colors.hex2rgba(input);
            } else {
                rgbaStr = input.replace(/\s+/g, '');
                const [, ...mRgba] = rgbaStr.match(/^rgba?\((\d+),(\d+),(\d+)(?:,?([.\d]+))?\)$/);
                if (mRgba.length === 3) {
                    mRgba.push('1');
                }
                mRgba.forEach(str => {
                    rgbaArray.push(Number(str));
                });
            }
        }
        return [rgbaStr, rgbaArray[0], rgbaArray[1], rgbaArray[2], rgbaArray[3]];
    }

    static hex2rgba(hex: string): [string, number, number, number, number] {
        const rgbaHex: string[] = [];
        const rgbaDec: number[] = [];
        let alphaStr: string;
        console.log('hex2rgba input', hex);
        if (hex.length <= 4) {
            [, rgbaHex[0], rgbaHex[1], rgbaHex[2], alphaStr] = hex.match(/^\#(.)(.)(.)(.)?$/);
        } else {
            [, rgbaHex[0], rgbaHex[1], rgbaHex[2], alphaStr] = hex.match(/^\#(..)(..)(..)(..)?$/);
        }

        for (let i = 0; i < rgbaHex.length; i++) {
            rgbaDec.push(parseInt(rgbaHex[i], 16));
        }

        console.log('hex alpha = ', alphaStr);
        if (alphaStr === undefined) {
            alphaStr = '1';
        }

        return ['rgba(' + rgbaDec.join(',') + ')', rgbaDec[0], rgbaDec[1], rgbaDec[2], Number(alphaStr)];
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
            Colors._cachedForegroundColor.hasOwnProperty(datasetOrMax as number)
        ) {
            return Colors._cachedForegroundColor[datasetOrMax as number];
        }
        return d3Color.hsl(
            Colors.getColorRange(datasetOrMax) as any
        ).l > 0.5 ? Colors.colourRange.max : Colors.colourRange.min;
        // '#000' : '#fff';
    }

}
