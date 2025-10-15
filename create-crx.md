# 创建CRX文件指南

## 方法一：使用Chrome浏览器打包（推荐）

### 步骤1：准备文件
确保项目目录包含以下文件：
```
chrome-tools/
├── manifest.json
├── popup.html
├── popup.js
├── background.js
├── content.js
├── js/
│   ├── authenticator.js
│   ├── jsQR.js
│   └── qrcode.min.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### 步骤2：打开Chrome扩展管理页面
1. 打开Chrome浏览器
2. 在地址栏输入：`chrome://extensions/`
3. 确保右上角的"开发者模式"已启用

### 步骤3：打包扩展
1. 点击"打包扩展程序"按钮
2. 在"扩展程序根目录"中选择项目文件夹（包含manifest.json的目录）
3. 在"私有密钥文件"中：
   - 如果是首次打包，留空（Chrome会自动生成）
   - 如果是更新，选择之前生成的.pem文件
4. 点击"打包扩展程序"

### 步骤4：获取CRX文件
- Chrome会在项目目录中生成两个文件：
  - `chrome-tools.crx` - 扩展文件
  - `chrome-tools.pem` - 私钥文件（请妥善保管）

## 方法二：使用命令行工具

### 使用Chrome命令行工具
```bash
# 生成私钥（首次使用）
openssl genrsa -out google-authenticator-private-key.pem 2048

# 打包扩展
chrome --pack-extension=/path/to/chrome-tools --pack-extension-key=google-authenticator-private-key.pem
```

### 使用Chromium命令行工具
```bash
# 生成私钥（首次使用）
openssl genrsa -out google-authenticator-private-key.pem 2048

# 打包扩展
chromium --pack-extension=/path/to/chrome-tools --pack-extension-key=google-authenticator-private-key.pem
```

## 方法三：使用Python脚本

创建一个Python脚本来生成CRX文件：

```python
#!/usr/bin/env python3
import os
import struct
import zipfile
import hashlib
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
    
    print(f'CRX文件创建成功: {output_path}')

# 使用示例
if __name__ == '__main__':
    create_crx('chrome-tools', 'google-authenticator-private-key.pem', 'google-authenticator-extension.crx')
```

## 安装CRX文件

### 方法1：拖拽安装
1. 将生成的.crx文件拖拽到Chrome浏览器窗口
2. 确认安装对话框
3. 点击"添加扩展程序"

### 方法2：通过扩展管理页面
1. 打开 `chrome://extensions/`
2. 启用开发者模式
3. 将.crx文件拖拽到扩展管理页面
4. 确认安装

## 重要提醒

1. **私钥文件**：请妥善保管.pem私钥文件，用于后续更新
2. **版本更新**：更新扩展时需要使用相同的私钥
3. **分发**：CRX文件可以直接分发给其他用户安装
4. **安全**：CRX文件是经过签名的，确保扩展的完整性

## 文件说明

- **.crx文件**：Chrome扩展的安装包
- **.pem文件**：私钥文件，用于签名和更新
- **manifest.json**：扩展的配置文件
- **其他文件**：扩展的功能文件

## 故障排除

### 常见问题
1. **打包失败**：检查manifest.json格式是否正确
2. **安装失败**：确保Chrome版本支持该扩展
3. **签名错误**：使用正确的私钥文件

### 解决方案
1. 检查所有必需文件是否存在
2. 验证manifest.json语法
3. 确保Chrome版本兼容
4. 重新生成私钥（如果丢失）
