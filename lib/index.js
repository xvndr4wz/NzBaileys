import './Utils/long-safe.js';
import makeWASocket from './Socket/index.js';
import chalk from 'chalk';

const logo = `
███╗   ██╗██████╗ ██████╗  █████╗  █████╗ ██╗    ██╗███████╗
████╗  ██║██╔══██╗██╔══██╗██╔══██╗██║  ██║██║    ██║╚══███╔╝
██╔██╗ ██║██║  ██║██████╔╝███████║███████║██║ █╗ ██║  ███╔╝
██║╚██╗██║██║  ██║██╔══██╗██╔══██║██╔══██║██║███╗██║ ███╔╝
██║ ╚████║██████╔╝██║  ██║██║  ██║██║  ██║╚███╔███╔╝███████╗
╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚══════╝
`;

const cyan = [
    [0, 230, 255],
    [0, 190, 255],
    [0, 150, 255],
    [40, 110, 255],
    [80, 90, 255],
    [110, 75, 255]
];

const orange = [
    [255, 245, 190],
    [255, 195, 90],
    [255, 145, 35],
    [255, 105, 15],
    [255, 175, 65],
    [255, 225, 150]
];

const red = [
    [255, 150, 150],
    [255, 95, 105],
    [255, 55, 70],
    [220, 25, 45],
    [180, 0, 30]
];

const gradient = (text, colors) => {
    const chars = [...text];

    return chars.map((char, i) => {
        const index = Math.round(
            i / Math.max(1, chars.length - 1) * (colors.length - 1)
        );

        return chalk.rgb(...colors[index])(char);
    }).join('');
};

const logoGradient = logo
    .split('\n')
    .map((line, i) => {
        const color = cyan[Math.min(i, cyan.length - 1)];
        return chalk.rgb(...color)(line);
    })
    .join('\n');

console.log(logoGradient);

console.log(
    gradient('Creator', red) +
    chalk.white(' : ') +
    gradient('Ndraawz', orange) +
    chalk.gray('   │   ') +
    gradient('Created', red) +
    chalk.white(' : ') +
    chalk.white('22 Nov 2026')
);

console.log(
    '\n' +
    gradient('NdraawzBaileys', orange) +
    chalk.white(' — a Best Baileys Fork-based WhatsApp Web library') +
    chalk.hex('#ffad42')(' ✨🔥') +
    '\n'
);

export * from '../WAProto/index.js';
export * from './Utils/index.js';
export * from './Types/index.js';
export * from './Defaults/index.js';
export * from './WABinary/index.js';
export * from './WAM/index.js';
export * from './WAUSync/index.js';
export * from './Store/index.js';
export { makeWASocket };
export default makeWASocket;