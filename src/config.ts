import * as fs from 'fs';
import * as path from 'path';

interface Config {
  figmaToken: string;
  fileId: string;
  outputDir: string;
}

const configPath = path.resolve(process.cwd(), 'figma.config.json');

let config: Config;

if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} else {
  throw new Error('Конфигурационный файл figma.config.json не найден в корневой директории.');
}

export default config;
