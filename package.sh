#!/bin/bash

# Google身份验证器Chrome扩展打包脚本
# 用于创建可分发的扩展包

echo "🚀 Google身份验证器Chrome扩展打包工具"
echo "========================================"

# 检查是否在正确的目录
if [ ! -f "manifest.json" ]; then
    echo "❌ 错误：请在包含manifest.json的目录中运行此脚本"
    exit 1
fi

# 创建打包目录
PACKAGE_DIR="chrome-extension-package"
echo "📦 创建打包目录: $PACKAGE_DIR"

if [ -d "$PACKAGE_DIR" ]; then
    echo "🗑️  清理旧的打包目录..."
    rm -rf "$PACKAGE_DIR"
fi

mkdir -p "$PACKAGE_DIR"

# 复制必需文件
echo "📋 复制扩展文件..."

# 核心文件
cp manifest.json "$PACKAGE_DIR/"
cp popup.html "$PACKAGE_DIR/"
cp popup.js "$PACKAGE_DIR/"
cp background.js "$PACKAGE_DIR/"
cp content.js "$PACKAGE_DIR/"

# 复制js目录
if [ -d "js" ]; then
    cp -r js "$PACKAGE_DIR/"
    echo "✅ 复制js目录"
fi

# 复制icons目录
if [ -d "icons" ]; then
    cp -r icons "$PACKAGE_DIR/"
    echo "✅ 复制icons目录"
fi

# 复制文档文件
if [ -f "README.md" ]; then
    cp README.md "$PACKAGE_DIR/"
fi

if [ -f "IFLOW.md" ]; then
    cp IFLOW.md "$PACKAGE_DIR/"
fi

if [ -f "INSTALL.md" ]; then
    cp INSTALL.md "$PACKAGE_DIR/"
fi

# 创建版本信息文件
VERSION=$(grep '"version"' manifest.json | cut -d'"' -f4)
echo "📝 创建版本信息文件..."
cat > "$PACKAGE_DIR/VERSION.txt" << EOF
Google身份验证器Chrome扩展
版本: $VERSION
打包时间: $(date)
打包脚本: package.sh
EOF

# 创建安装说明
echo "📖 创建安装说明..."
cat > "$PACKAGE_DIR/安装说明.txt" << EOF
Google身份验证器Chrome扩展 - 安装说明
=====================================

快速安装步骤：
1. 打开Chrome浏览器
2. 在地址栏输入：chrome://extensions/
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择此文件夹
6. 完成安装！

详细安装说明请查看：INSTALL.md

功能特性：
- 支持TOTP双因素认证
- 二维码扫描和导入
- Google Authenticator迁移
- 智能账户管理
- 一键复制验证码

如有问题，请查看文档或提交Issue。

版本: $VERSION
打包时间: $(date)
EOF

# 计算文件大小
PACKAGE_SIZE=$(du -sh "$PACKAGE_DIR" | cut -f1)
echo "📊 打包完成！"
echo "   目录: $PACKAGE_DIR"
echo "   大小: $PACKAGE_SIZE"
echo "   版本: $VERSION"

# 创建ZIP压缩包
echo "🗜️  创建ZIP压缩包..."
ZIP_NAME="google-authenticator-extension-v$VERSION.zip"
if command -v zip >/dev/null 2>&1; then
    zip -r "$ZIP_NAME" "$PACKAGE_DIR" > /dev/null
    ZIP_SIZE=$(du -sh "$ZIP_NAME" | cut -f1)
    echo "✅ ZIP包创建成功: $ZIP_NAME ($ZIP_SIZE)"
else
    echo "⚠️  zip命令不可用，跳过ZIP压缩包创建"
fi

echo ""
echo "🎉 打包完成！"
echo "========================================"
echo "📁 扩展目录: $PACKAGE_DIR"
echo "📦 ZIP文件: $ZIP_NAME (如果可用)"
echo "📖 安装说明: $PACKAGE_DIR/安装说明.txt"
echo "📚 详细文档: $PACKAGE_DIR/INSTALL.md"
echo ""
echo "💡 提示："
echo "   1. 可以直接使用 $PACKAGE_DIR 目录安装扩展"
echo "   2. 或者分发 $ZIP_NAME 文件给其他用户"
echo "   3. 安装时请参考安装说明文档"
echo ""
echo "🔗 安装地址: chrome://extensions/"
echo "========================================"
