import * as d3 from 'd3-selection';
import * as d3Shape from 'd3-shape';
import { Colors } from './Colors';

export interface LabelsColorsValuesDataset {
    label: string;
    color: string | undefined;
    value: number;
}

export class Pie {
    public width = 400;
    public height = 400;
    public radius: number;
    public targetSelector: string;

    constructor(
        targetSelector: string,
        width: number,
        height: number
    ) {
        this.targetSelector = targetSelector;
        if (width) {
            this.width = width;
        }
        if (height) {
            this.height = height;
        }
        this.radius = Math.min(this.width, this.height) / 2;
    }

    draw(dataset: LabelsColorsValuesDataset[]) {
        // const color = Colors.getColorRange(
        //     dataset.map(i => i.value)
        // );

        const arc = d3Shape.arc()
            .outerRadius(this.radius - 10)
            .innerRadius(0);
        const labelArc = d3Shape.arc()
            .outerRadius(this.radius - 40)
            .innerRadius(this.radius - 40);

        const pie = d3Shape.pie()
            .sort(null)
            .value((d: any) => d.value);

        const svg = d3.select(this.targetSelector)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', '0 0 ' + Math.min(this.width, this.height) + ' ' + Math.min(this.width, this.height))
            .append('g')
            .attr('transform', 'translate(' + Math.min(this.width, this.height) / 2 + ',' + Math.min(this.width, this.height) / 2 + ')');

        const g = svg.selectAll('.arc')
            .data(
                pie(dataset as any)
            )
            .enter().append('g')
            .attr('class', 'arc');

        g.append('path').attr('d', arc as any)
            .style('fill', (d: any) => (d.data.color))
            .style('stroke', (d: any) => 'var(--ion-color-dark-contrast)')
            ;

        g.append('text').attr('transform', (d: any) => 'translate(' + labelArc.centroid(d) + ')')
            .attr('dy', '.35em')
            .attr('class', 'arc')
            .text((d: any) => d.data.label + ' ' + d.data.value + '%');
    }
}
