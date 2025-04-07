@echo off
echo 正在构建答案解析工具应用...
call npm run build
echo 构建完成！
echo 构建文件位于dist目录中。您可以将此目录中的文件部署到任何静态网站托管服务。
echo.
echo 本版本功能包括:
echo - 单个答案处理和批量文件处理
echo - 手风琴式答案展示结构
echo - 内容编辑功能（点击标题或内容可编辑）
echo - 展开/折叠控制
echo - JSON格式导出
echo.
pause 