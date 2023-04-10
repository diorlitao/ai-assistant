const os = require('os');
const package = require('./package.json');

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  document.getElementById('version').innerText = package.version;
  document.getElementById('author').innerText = package.author;

  const type = os.type();
  const platfrom = os.platform();
  const version = os.release();
  document.getElementById('os').innerText = `${type} ${platfrom} ${version}`;
  document.getElementById('date').innerText = new Date();

  for (const dependency of ['chrome', 'node', 'electron', 'v8']) {
    replaceText(`${dependency}-version`, process.versions[dependency]);
  }
});
