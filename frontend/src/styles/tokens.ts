export const colors = {
	asphalt: '#1B2430',
	asphaltSoft: '#2A3542',
	asphaltMuted: '#8A98A8',
	basil: '#1E6B52',
	basilDark: '#154D3B',
	basilTint: '#E3F0EA',
	mint: '#7FC8A9',
	route: '#2F5D8C',
	routeTint: '#E4ECF5',
	plate: '#F4F6F5',
	surface: '#FFFFFF',
	line: '#DCE2DF',
	lineStrong: '#C3CCC8',
	text: '#1B2430',
	textMuted: '#5A6675',
	textSubtle: '#7D8895',
	danger: '#B42318',
	dangerTint: '#FDECEA',
	warning: '#8A6D00',
	warningTint: '#FBF3D5',
	focus: '#2F5D8C',
} as const;

export const statusColors = {
	pending: { fg: '#4B5563', bg: '#EEF0F2', accent: '#6B7480' },
	preparing: { fg: '#5B3FB0', bg: '#EFEBFA', accent: '#6E52C7' },
	ready: { fg: '#0B6577', bg: '#E1F2F5', accent: '#0F7F95' },
	delivering: { fg: '#1D4F86', bg: '#E4ECF6', accent: '#2F66A6' },
	delivered: { fg: '#1E6B52', bg: '#E3F0EA', accent: '#2C8A6A' },
	cancelled: { fg: '#A1281C', bg: '#FBEAE8', accent: '#C0392B' },
} as const;

export const chartPalette = ['#1E6B52', '#2F5D8C', '#6E52C7', '#0F7F95', '#8A98A8', '#C0392B'];

export const radii = {
	sm: 4,
	md: 6,
	lg: 10,
} as const;

export const fontFamily =
	"'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

export const layout = {
	sidebarWidth: 232,
	topbarHeight: 56,
	contentMaxWidth: 1440,
} as const;
