#!/bin/bash

# Google身份验证器Chrome扩展 - CRX打包脚本
# 用于创建可分发的CRX文件

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

# 创建临时打包目录
TEMP_DIR="temp-crx-build"
echo "📦 创建临时打包目录: $TEMP_DIR"

if [ -d "$TEMP_DIR" ]; then
    echo "🗑️  清理旧的临时目录..."
    rm -rf "$TEMP_DIR"
fi

mkdir -p "$TEMP_DIR"

# 复制必需文件到临时目录
echo "📋 复制扩展文件..."

# 核心文件
cp manifest.json "$TEMP_DIR/"
cp popup.html "$TEMP_DIR/"
cp popup.js "$TEMP_DIR/"
cp background.js "$TEMP_DIR/"
cp content.js "$TEMP_DIR/"

# 复制js目录
if [ -d "js" ]; then
    cp -r js "$TEMP_DIR/"
    echo "✅ 复制js目录"
fi

# 复制icons目录
if [ -d "icons" ]; then
    cp -r icons "$TEMP_DIR/"
    echo "✅ 复制icons目录"
fi

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

# 创建CRX文件
CRX_NAME="google-authenticator-extension-v$VERSION.crx"
echo "🔨 创建CRX文件: $CRX_NAME"

# 使用Chrome的打包工具创建CRX
if command -v chrome >/dev/null 2>&1; then
    # 如果Chrome命令行工具可用
    chrome --pack-extension="$TEMP_DIR" --pack-extension-key="$PRIVATE_KEY"
    mv "$TEMP_DIR.crx" "$CRX_NAME"
elif command -v chromium >/dev/null 2>&1; then
    # 如果Chromium命令行工具可用
    chromium --pack-extension="$TEMP_DIR" --pack-extension-key="$PRIVATE_KEY"
    mv "$TEMP_DIR.crx" "$CRX_NAME"
else
    # 使用Python脚本创建CRX（备用方法）
    echo "📝 使用Python脚本创建CRX..."
    python3 -c "
import os
import struct
import zipfile
import hashlib
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend

def create_crx(extension_dir, private_key_path, output_path):
    # 创建ZIP文件
    zip_path = extension_dir + '.zip'
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(extension_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arc_path = os.path.relpath(file_path, extension_dir)
                zipf.write(file_path, arc_path)
    
    # 读取ZIP文件
    with open(zip_path, 'rb') as f:
        zip_data = f.read()
    
    # 读取私钥
    with open(private_key_path, 'rb') as f:
        private_key_data = f.read()
    
    # 创建签名
    private_key = rsa.RSAPrivateKey.load_pem(private_key_data, default_backend())
    signature = private_key.sign(zip_data, padding.PKCS1v15(), hashes.SHA1())
    
    # 创建CRX文件
    crx_data = b'Cr24'  # CRX magic number
    crx_data += struct.pack('<I', 2)  # Version
    crx_data += struct.pack('<I', len(signature))  # Signature length
    crx_data += struct.pack('<I', 0)  # Key length (0 for no key)
    crx_data += signature
    crx_data += zip_data
    
    # 写入CRX文件
    with open(output_path, 'wb') as f:
        f.write(crx_data)
    
    # 清理临时ZIP文件
    os.remove(zip_path)
    
    print(f'✅ CRX文件创建成功: {output_path}')

create_crx('$TEMP_DIR', '$PRIVATE_KEY', '$CRX_NAME')
"
fi

# 检查CRX文件是否创建成功
if [ -f "$CRX_NAME" ]; then
    CRX_SIZE=$(du -sh "$CRX_NAME" | cut -f1)
    echo "✅ CRX文件创建成功: $CRX_NAME ($CRX_SIZE)"
else
    echo "❌ CRX文件创建失败"
    echo "💡 请尝试以下方法："
    echo "   1. 在Chrome中访问 chrome://extensions/"
    echo "   2. 启用开发者模式"
    echo "   3. 点击'打包扩展程序'"
    echo "   4. 选择目录: $TEMP_DIR"
    echo "   5. 选择私钥: $PRIVATE_KEY"
fi

# 清理临时目录
echo "🧹 清理临时目录..."
rm -rf "$TEMP_DIR"

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
