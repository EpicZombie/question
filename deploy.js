import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 源目录和目标目录
const sourceDir = path.join(__dirname, 'dist');
const targetDir = path.join(__dirname, '..', 'docs');

// 创建目标目录（如果不存在）
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 复制文件的函数
function copyFileSync(source, target) {
  let targetFile = target;
  
  // 如果目标是一个目录，则将源文件名附加到目标
  if (fs.existsSync(target) && fs.lstatSync(target).isDirectory()) {
    targetFile = path.join(target, path.basename(source));
  }
  
  fs.writeFileSync(targetFile, fs.readFileSync(source));
}

// 递归复制目录的函数
function copyFolderSync(source, target) {
  // 确保目标目录存在
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  
  // 读取源目录中的所有项目
  const items = fs.readdirSync(source);
  
  // 遍历所有项目
  for (const item of items) {
    const sourcePath = path.join(source, item);
    const targetPath = path.join(target, item);
    
    // 检查是文件还是目录
    const stat = fs.statSync(sourcePath);
    
    if (stat.isFile()) {
      copyFileSync(sourcePath, targetPath);
    } else if (stat.isDirectory()) {
      copyFolderSync(sourcePath, targetPath);
    }
  }
}

// 复制dist目录到docs目录
try {
  copyFolderSync(sourceDir, targetDir);
  console.log('✅ 已成功将构建文件复制到docs目录');
  console.log('👉 现在您可以提交到GitHub了，确保在GitHub Pages设置中选择main分支的/docs目录作为部署源');
} catch (error) {
  console.error('❌ 复制文件时出错:', error);
} 