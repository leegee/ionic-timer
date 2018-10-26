import * as d3 from 'd3-selection';
import * as d3Shape from 'd3-shape';
import { Colors } from './Colors';

export class Pie {
    public width = 400;
    public height = 400;
    public radius: number;

    constructor(width: number, height: number) {
        this.radius = Math.min(this.width, this.height) / 2;
    }

    draw(dataset: any[]) {
        const color = Colors.getColorRange(
            dataset.map(i => i.value)
        );

        const arc = d3Shape.arc()
            .outerRadius(this.radius - 10)
            .innerRadius(0);
        const labelArc = d3Shape.arc()
            .outerRadius(this.radius - 40)
            .innerRadius(this.radius - 40);
        const labelPercent = d3Shape.arc()
            .outerRadius(this.radius - 80)
            .innerRadius(this.radius - 80);

        const pie = d3Shape.pie()
            .sort(null)
            .value((d: any) => d.value);

        const svg = d3.select('#pieChart')
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', '0 0 ' + Math.min(this.width, this.height) + ' ' + Math.min(this.width, this.height))
            .append('g')
            .attr('transform', 'translate(' + Math.min(this.width, this.height) / 2 + ',' + Math.min(this.width, this.height) / 2 + ')');

        const g = svg.selectAll('.arc')
            .data(pie(dataset))
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
