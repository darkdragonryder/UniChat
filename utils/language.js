import fs from 'fs';
const FILE = './userlangs.json';

let langs = fs.existsSync(FILE)
  ? JSON.parse(fs.readFileSync(FILE))
  : {};

export async function getUserLanguage(id) {
  return langs[id];
}

export async function setUserLanguage(id, lang) {
  langs[id] = lang;
  fs.writeFileSync(FILE, JSON.stringify(langs, null, 2));
}