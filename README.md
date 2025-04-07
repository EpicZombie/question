# 答案解析工具

## 项目介绍

这是一个用于解析学习题目答案的工具，可以将格式化的答案文本转换为四级手风琴结构，便于复习和查阅。支持单个答案输入和批量答案文件处理，支持内容编辑和JSON导出。

## 功能特点

1. 支持输入完整的答案文本
2. 支持上传文本文件批量处理多个答案
3. 自动按照"一、二、三"等大点进行拆分
4. 自动按照"1、2、3"等小点进行拆分
5. 生成可交互的四级手风琴结构
6. 提供填充示例功能，便于了解使用方法
7. 批量处理模式下可浏览所有答案
8. 支持编辑标题和内容
9. 支持展开/折叠所有手风琴
10. 支持导出为JSON格式

## 使用方法

### 单个答案处理

1. 在文本框中输入完整答案（或点击"填充示例"按钮查看示例）
2. 点击"解析答案"按钮将答案转换为手风琴结构
3. 点击大点标题展开/折叠该部分内容
4. 点击小点标题展开/折叠该小点详细内容
5. 点击"重新输入"按钮可以清空当前内容，重新开始

### 批量答案处理

1. 点击"上传答案文件"按钮，选择包含多个答案的文本文件（每行一个答案）
2. 或者点击"下载示例文件"获取预设的多个答案示例，然后上传此文件进行测试
3. 系统会自动解析文件中的所有答案并显示第一个
4. 使用"上一个"和"下一个"按钮在不同答案之间切换
5. 点击"返回"按钮退出批量处理模式

### 内容编辑功能

1. 点击大点标题的文本部分可以编辑大点标题
2. 点击小点标题的文本部分可以编辑小点标题
3. 点击小点内容可以编辑内容
4. 在编辑弹窗中修改内容后，点击"保存"按钮保存更改，或点击"取消"放弃更改

### 手风琴控制与导出

1. 点击"展开全部"按钮可以展开所有手风琴
2. 点击"折叠全部"按钮可以折叠所有手风琴
3. 点击"导出为JSON"按钮可以将当前数据导出为JSON格式文件
   - 在单个答案模式下导出当前答案
   - 在批量处理模式下导出所有答案

## 输入格式要求

- 答案文本应包含大点（如"一、二、三"等）和小点（如"1、2、3"等）
- 每个大点和小点后面应紧跟着相应的内容
- 示例格式：

```
一、主题一
1、小点一：内容...
2、小点二：内容...
二、主题二
3、小点三：内容...
```

- 批量处理文件格式：文本文件，每行包含一个完整的答案

## 开发指南

### 本地开发

1. 克隆仓库
2. 安装依赖：`npm install`
3. 启动开发服务器：`npm run dev`
4. 在浏览器中访问：
   - 本地访问: `http://localhost:5173/`
   - 局域网访问: 使用开发服务器显示的网络IP地址
   - 公网访问: 将您的公网IP地址加上端口号 `:5173` 即可从外部访问（需确保防火墙和路由器已配置端口转发）

### 构建部署

#### 方法一：使用批处理文件（Windows）

1. 双击运行 `build.bat` 文件
2. 构建完成后，将 `dist` 目录中的文件部署到您的网站服务器

#### 方法二：手动构建

1. 运行命令：`npm run build`
2. 构建完成后，`dist` 目录包含所有可部署的静态文件
3. 将这些文件上传到任何支持静态网站的服务器

## 技术栈

- Vue 3 - 前端框架
- Vite - 构建工具
- JavaScript - 编程语言

## 可扩展功能

- 支持更多格式的答案输入
- 添加保存/导出功能
- 支持暗黑模式
- 增加更多自定义样式选项
- 添加答案搜索功能
- 实现答案导出为PDF功能
- 添加导入JSON文件功能
- 提供更多编辑选项（如格式化、添加/删除项目）

## Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## GitHub Pages 部署指南

### 简单部署方法（推荐）

我们提供了一个简单的部署脚本，可以自动将构建好的文件复制到docs目录：

```bash
# 一步完成构建和准备部署文件
npm run deploy
```

这个命令会：
1. 构建项目
2. 修复资源路径
3. 将构建文件复制到项目根目录的docs文件夹中

完成后，您只需要：
1. 提交所有更改到GitHub仓库
2. 在仓库设置中选择"Pages"选项
3. 选择部署源为"Deploy from a branch"
4. 在Branch下拉菜单中选择"main"和"/docs"文件夹
5. 点击Save保存设置

### 手动部署方法

如果您想手动部署，可以执行以下步骤：

1. 使用专门的构建命令生成优化后的文件：

```bash
npm run build:github
```

2. 将`dist`目录中的所有文件上传到您的GitHub仓库。您可以：
   - 直接将文件推送到您的`gh-pages`分支
   - 或者在仓库设置中选择主分支下的`/docs`目录作为GitHub Pages源（需要先将`dist`目录重命名为`docs`）

3. 确保在GitHub仓库设置中启用了GitHub Pages功能。

### 常见问题解决

如果部署后页面显示为空白或资源无法加载，请检查：

1. 浏览器控制台中的错误信息
2. 确保您使用了`npm run build:github`或`npm run deploy`命令而不是普通的`npm run build`
3. 确保GitHub Pages设置正确（在仓库设置中可以看到实际的部署URL）
4. 清除浏览器缓存后重试
5. 检查网络请求路径是否正确（应该是相对路径或与base配置匹配的路径）

## 许可证

MIT
