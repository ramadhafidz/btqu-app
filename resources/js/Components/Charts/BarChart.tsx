import { Bar } from 'react-chartjs-2';
import { forwardRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  chartData: any;
  title: string;
  onClick?: (event: React.MouseEvent<HTMLCanvasElement>) => void;
}

const BarChart = forwardRef<any, BarChartProps>(
  ({ chartData, title, onClick }, ref) => {
    const options = {
      /* ... */
    };
    return (
      <Bar options={options} data={chartData} ref={ref} onClick={onClick} />
    );
  }
);

export default BarChart;
