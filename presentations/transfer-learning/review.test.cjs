const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

test('student worksheet ends with an eight-question final review', () => {
  assert.match(html, /<section id="check"[^>]*class="lab"/);
  assert.doesNotMatch(html, /<section id="assets"/);
  assert.match(html, /href="#check"/);
  assert.equal((html.match(/data-review-question/g) || []).length, 8);
  assert.match(html, /id="final-check"/);
  assert.equal((html.match(/data-synthesis-prompt/g) || []).length, 3);
});

test('final review answers can be checked and saved', () => {
  assert.match(app, /\.chkbtn/);
  assert.match(app, /dataset\.a/);
  assert.match(app, /\.qin/);
});
