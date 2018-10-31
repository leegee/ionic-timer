import { BarChartModule } from './bar-chart.module';

describe('BarChartModule', () => {
  let barChartModule: BarChartModule;

  beforeEach(() => {
    barChartModule = new BarChartModule();
  });

  it('should create an instance', () => {
    expect(barChartModule).toBeTruthy();
  });
});
