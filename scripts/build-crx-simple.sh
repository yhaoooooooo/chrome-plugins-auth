#!/bin/bash

# Google身份验证器Chrome扩展 - 简化CRX打包脚本

echo "🚀 Google身份验证器Chrome扩展 - CRX打包工具"
echo "=============================================="

# 检查是否在正确的目录
if [ ! -f "manifest.json" ]; then
    echo "❌ 错误：请在包含manifest.json的目录中运行此脚本"
    exit 1
fi

# 获取版本号
VERSION=$(grep '"version"' manifest.json | cut -d'"' -f4)
echo "📋 扩展版本: $VERSION"

# Chrome路径
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# 检查Chrome是否存在
if [ ! -f "$CHROME_PATH" ]; then
    echo "❌ 错误：找不到Chrome浏览器"
    echo "请确保Chrome已安装在 /Applications/Google Chrome.app/"
    exit 1
fi

echo "✅ 找到Chrome浏览器: $CHROME_PATH"

# 创建私钥文件（如果不存在）
PRIVATE_KEY="google-authenticator-private-key.pem"
if [ ! -f "$PRIVATE_KEY" ]; then
    echo "🔑 生成私钥文件..."
    openssl genrsa -out "$PRIVATE_KEY" 2048
    echo "✅ 私钥文件已生成: $PRIVATE_KEY"
    echo "⚠️  请妥善保管此私钥文件，用于后续更新"
else
    echo "✅ 使用现有私钥文件: $PRIVATE_KEY"
fi

# 获取当前目录的绝对路径
CURRENT_DIR=$(pwd)
echo "📁 扩展目录: $CURRENT_DIR"

# 创建CRX文件
CRX_NAME="google-authenticator-extension-v$VERSION.crx"
echo "🔨 创建CRX文件: $CRX_NAME"

# 使用Chrome命令行工具打包
echo "⏳ 正在打包扩展..."
"$CHROME_PATH" --pack-extension="$CURRENT_DIR" --pack-extension-key="$PRIVATE_KEY"

# 检查是否成功创建CRX文件
if [ -f "$CRX_NAME" ]; then
    CRX_SIZE=$(du -sh "$CRX_NAME" | cut -f1)
    echo "✅ CRX文件创建成功: $CRX_NAME ($CRX_SIZE)"
else
    # 尝试查找生成的CRX文件（Chrome可能使用目录名作为文件名）
    DIR_NAME=$(basename "$CURRENT_DIR")
    if [ -f "${DIR_NAME}.crx" ]; then
        mv "${DIR_NAME}.crx" "$CRX_NAME"
        CRX_SIZE=$(du -sh "$CRX_NAME" | cut -f1)
        echo "✅ CRX文件创建成功: $CRX_NAME ($CRX_SIZE)"
    else
        echo "❌ CRX文件创建失败"
        echo "💡 请尝试以下方法："
        echo "   1. 在Chrome中访问 chrome://extensions/"
        echo "   2. 启用开发者模式"
        echo "   3. 点击'打包扩展程序'"
        echo "   4. 选择目录: $CURRENT_DIR"
        echo "   5. 选择私钥: $PRIVATE_KEY"
        exit 1
    fi
fi

# 创建安装说明
echo "📖 创建CRX安装说明..."
cat > "CRX-安装说明.txt" << EOF
Google身份验证器Chrome扩展 - CRX安装说明
========================================

CRX文件: $CRX_NAME
版本: $VERSION
创建时间: $(date)

安装方法：
1. 打开Chrome浏览器
2. 将 $CRX_NAME 文件拖拽到Chrome窗口中
3. 确认安装对话框，点击"添加扩展程序"
4. 完成安装！

注意事项：
- CRX文件是Chrome扩展的标准分发格式
- 安装后扩展会自动启用
- 如需更新，请使用相同私钥重新打包
- 私钥文件: $PRIVATE_KEY (请妥善保管)

功能特性：
- 支持TOTP双因素认证
- 二维码扫描和导入
- Google Authenticator迁移
- 智能账户管理
- 一键复制验证码

如有问题，请查看项目文档或提交Issue。
EOF

echo ""
echo "🎉 CRX打包完成！"
echo "=============================================="
echo "📦 CRX文件: $CRX_NAME"
echo "🔑 私钥文件: $PRIVATE_KEY"
echo "📖 安装说明: CRX-安装说明.txt"
echo ""
echo "💡 安装方法："
echo "   1. 将 $CRX_NAME 拖拽到Chrome窗口"
echo "   2. 确认安装对话框"
echo "   3. 完成安装！"
echo ""
echo "⚠️  重要提醒："
echo "   - 请妥善保管私钥文件 $PRIVATE_KEY"
echo "   - 私钥用于后续更新和签名"
echo "   - 丢失私钥将无法更新扩展"
echo "=============================================="
