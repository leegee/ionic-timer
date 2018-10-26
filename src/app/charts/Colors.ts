import * as d3Scale from 'd3-scale';
import * as d3Color from 'd3-color';

export class Colors {
    static cachedForegroundColor: { [key: number]: string } = {};

    static colourRange = {
        min: 'white',
        max: 'steelblue'
    };

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
