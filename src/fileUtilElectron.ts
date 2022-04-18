import { ipcRenderer } from 'electron';
import path from 'path';

const os = require('os');
const fs = require('fs-extra');

export const openFile = (fileName, folderPath) => {
  console.log('Open file:', path.join(folderPath, fileName));
  ipcRenderer.send('open-file', path.join(folderPath, fileName));
};

export const readFile = (fileName) =>
  new Promise((resolve, reject) => {
    fs.readFile(fileName, (err, content) => {
      if (err) return reject(err);

      resolve(content);
    });
  });

export const writeFile = (fileName, content) =>
  new Promise((resolve, reject) => {
    console.log('write file');
    fs.writeFile(fileName, content, (err) => {
      if (err) return reject(err);

      resolve();
    });
  });

export function decode(input) {
  if (!input) return '';
  const decodedBase64 = atob(input.replace(/-/g, '+').replace(/_/g, '/'));
  const escaped = escape(decodedBase64);
  return decodeURIComponent(escaped);
}

export function decodeAttachment(input) {
  if (!input) return '';

  return atob(encodeURI(input.replace(/-/g, '+').replace(/_/g, '/')));
}

export const readFileSync = (filePath: string) =>
  fs.readFileSync(filePath, { encoding: 'utf-8' });