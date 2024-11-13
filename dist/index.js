#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_1 = __importDefault(require("./config"));
const FIGMA_API_BASE = 'https://api.figma.com/v1';
async function downloadIcons() {
    const headers = {
        'X-Figma-Token': config_1.default.figmaToken
    };
    // Получаем информацию о файле
    const fileResponse = await axios_1.default.get(`${FIGMA_API_BASE}/files/${config_1.default.fileId}`, { headers });
    const components = extractComponents(fileResponse.data);
    if (components.length === 0) {
        console.error('Не удалось найти компоненты в файле Figma.');
        return;
    }
    // Получаем ссылки на изображения
    const ids = components.map(component => component.id).join(',');
    const imagesResponse = await axios_1.default.get(`${FIGMA_API_BASE}/images/${config_1.default.fileId}`, {
        headers,
        params: {
            ids,
            format: 'svg'
        }
    });
    // Скачиваем и сохраняем иконки
    for (const [id, url] of Object.entries(imagesResponse.data.images)) {
        const component = components.find(c => c.id === id);
        if (component && url) {
            const iconResponse = await axios_1.default.get(url, { responseType: 'stream' });
            // Форматируем имя файла
            const formattedName = formatName(component.name);
            const outputPath = path.join(config_1.default.outputDir, `${formattedName}.svg`);
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            await new Promise((resolve, reject) => {
                const writer = fs.createWriteStream(outputPath);
                iconResponse.data.pipe(writer);
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            console.log(`Сохранена иконка: ${formattedName}`);
        }
    }
}
function extractComponents(fileData) {
    const components = [];
    function traverse(node) {
        console.log(`Node Name: ${node.name}, Node Type: ${node.type}`);
        if (['COMPONENT', 'FRAME', 'GROUP', 'INSTANCE', 'VECTOR', 'COMPONENT_SET'].includes(node.type)) {
            components.push({ id: node.id, name: node.name });
        }
        if (node.children) {
            for (const child of node.children) {
                traverse(child);
            }
        }
    }
    traverse(fileData.document);
    return components;
}
// Функция для форматирования названия файла
function formatName(name) {
    // Удаляем цифры и точки
    name = name.replace(/[0-9.]/g, '');
    // Разбиваем по пробелам и другим неалфавитным символам
    const words = name.match(/[A-Za-zА-Яа-яЁё]+/g) || [];
    // Конвертируем в camelCase
    return words.map((word, index) => {
        word = word.toLowerCase();
        if (index === 0) {
            return word;
        }
        else {
            return word.charAt(0).toUpperCase() + word.slice(1);
        }
    }).join('');
}
downloadIcons()
    .then(() => {
    console.log('Скачивание иконок завершено.');
})
    .catch(error => {
    console.error('Ошибка при скачивании иконок:', error);
});
