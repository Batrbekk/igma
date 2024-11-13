#!/usr/bin/env node
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import config from './config';
import {Component, FileResponse, ImagesResponse, Node} from "./types";

const FIGMA_API_BASE = 'https://api.figma.com/v1';

async function downloadIcons() {
  const headers = {
    'X-Figma-Token': config.figmaToken
  };

  // Получаем информацию о файле
  const fileResponse = await axios.get<FileResponse>(`${FIGMA_API_BASE}/files/${config.fileId}`, { headers });
  const components = extractComponents(fileResponse.data);

  if (components.length === 0) {
    console.error('Не удалось найти компоненты в файле Figma.');
    return;
  }

  // Получаем ссылки на изображения
  const ids = components.map(component => component.id).join(',');

  const imagesResponse = await axios.get<ImagesResponse>(`${FIGMA_API_BASE}/images/${config.fileId}`, {
    headers,
    params: {
      ids,
      format: 'svg'
    }
  });

  // Скачиваем и сохраняем иконки
  for (const [id, url] of Object.entries(imagesResponse.data.images) as [string, string][]) {
    const component = components.find(c => c.id === id);
    if (component && url) {
      const iconResponse = await axios.get<NodeJS.ReadableStream>(url, { responseType: 'stream' });

      // Форматируем имя файла
      const formattedName = formatName(component.name);
      const outputPath = path.join(config.outputDir, `${formattedName}.svg`);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });

      await new Promise<void>((resolve, reject) => {
        const writer = fs.createWriteStream(outputPath);
        iconResponse.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      console.log(`Сохранена иконка: ${formattedName}`);
    }
  }
}

function extractComponents(fileData: FileResponse): Component[] {
  const components: Component[] = [];

  function traverse(node: Node) {
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
function formatName(name: string): string {
  // Удаляем цифры и точки
  name = name.replace(/[0-9.]/g, '');
  // Разбиваем по пробелам и другим неалфавитным символам
  const words = name.match(/[A-Za-zА-Яа-яЁё]+/g) || [];
  // Конвертируем в camelCase
  return words.map((word, index) => {
    word = word.toLowerCase();
    if (index === 0) {
      return word;
    } else {
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
