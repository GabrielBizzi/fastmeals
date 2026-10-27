import {
	BarElement,
	CategoryScale,
	Chart,
	Filler,
	LinearScale,
	LineElement,
	PointElement,
	Tooltip,
} from 'chart.js';
import { colors, fontFamily } from '@/styles/tokens';

Chart.register(
	CategoryScale,
	LinearScale,
	BarElement,
	LineElement,
	PointElement,
	Filler,
	Tooltip,
);

Chart.defaults.font.family = fontFamily;
Chart.defaults.font.size = 12;
Chart.defaults.color = colors.textMuted;
Chart.defaults.borderColor = colors.line;
Chart.defaults.plugins.tooltip.backgroundColor = colors.asphalt;
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 4;
Chart.defaults.plugins.tooltip.displayColors = false;
Chart.defaults.maintainAspectRatio = false;
