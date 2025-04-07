import fs from 'fs';
import path from 'path';

// 读取dist目录下的index.html文件
const indexPath = path.resolve('dist', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 将所有以/assets/开头的路径替换为./assets/
html = html.replace(/src="\/assets\//g, 'src="./assets/');
html = html.replace(/href="\/assets\//g, 'href="./assets/');

// 将修改后的内容写回index.html
fs.writeFileSync(indexPath, html);

console.log('资源路径已修复为相对路径!'); 