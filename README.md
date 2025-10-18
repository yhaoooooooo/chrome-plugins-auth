# Google身份验证器Chrome扩展

[![Version](https://img.shields.io/badge/version-1.2.2-blue.svg)](https://github.com/your-repo/google-authenticator-extension)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://chrome.google.com/webstore)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

一个功能强大的Google身份验证器Chrome浏览器扩展，支持二维码扫描、密钥导入和Google Authenticator数据迁移。

## ✨ 主要特性

- 🔐 **TOTP双因素认证** - 完整的基于时间的一次性密码支持
- 📱 **多格式二维码扫描** - 支持摄像头、页面图片、SVG、Canvas等多种扫描方式
- 🔄 **数据迁移** - 完整支持Google Authenticator迁移格式
- 🎨 **现代界面** - 美观的用户界面和流畅的交互体验
- 📊 **智能管理** - 使用统计、自动筛选和排序功能
- 📋 **一键复制** - 点击验证码直接复制到剪贴板
- 🔍 **智能搜索** - 按域名或账户名快速筛选
- 📱 **响应式设计** - 适配不同屏幕尺寸
- 💾 **数据备份** - 支持JSON格式导入导出

## 🚀 快速开始

### 安装方法

#### 方法一：开发者模式安装（推荐）
1. 下载项目文件到本地
2. 打开Chrome浏览器，访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目文件夹
6. 完成安装！

#### 方法二：使用打包脚本
```bash
# Linux/macOS
./scripts/package.sh

# Windows
scripts/package.bat
```

### 使用指南

1. **添加账户**：点击"+ 添加账户"按钮
2. **查看验证码**：扩展自动显示6位验证码
3. **复制验证码**：点击验证码直接复制
4. **筛选账户**：使用搜索框快速查找
5. **管理账户**：点击"⋯"菜单进行管理

## 📖 详细文档

- 📚 [文档索引](docs/DOCS.md) - 完整的文档导航和概览
- 📋 [安装指南](docs/INSTALL.md) - 详细的安装和使用说明
- 🔧 [开发文档](docs/DEVELOPMENT.md) - 技术实现和开发历程
- 📤 [导入导出指南](docs/IMPORT_EXPORT.md) - 数据备份和恢复
- ❓ [常见问题](docs/FAQ.md) - 问题排查和解决方案

## 🛠️ 技术栈

- **前端**：HTML5, CSS3, JavaScript (ES6+)
- **加密**：Web Crypto API (HMAC-SHA1)
- **二维码**：jsQR (扫描), qrcode.js (生成)
- **存储**：Chrome Storage API
- **架构**：Chrome Extension Manifest V3

## 📁 项目结构

```
chrome-tools/
├── manifest.json              # 扩展配置文件
├── popup.html                 # 弹出窗口界面
├── popup.js                   # 弹出窗口逻辑
├── background.js              # 后台脚本
├── content.js                 # 内容脚本
├── js/                        # JavaScript库
│   ├── authenticator.js       # TOTP算法实现
│   ├── jsQR.js               # 二维码扫描库
│   └── qrcode.min.js         # 二维码生成库
├── icons/                     # 扩展图标
├── scripts/                   # 打包脚本
│   ├── package.sh            # Linux/macOS打包脚本
│   ├── package.bat           # Windows打包脚本
│   ├── build-crx.sh          # CRX打包脚本
│   └── build-crx-simple.sh   # 简化CRX打包脚本
├── docs/                      # 文档目录
│   ├── INSTALL.md            # 安装指南
│   ├── DEVELOPMENT.md        # 开发文档
│   ├── IMPORT_EXPORT.md      # 导入导出指南
│   ├── FAQ.md                # 常见问题
│   └── DOCS.md               # 文档索引
├── IFLOW.md                   # 开发历程
└── README.md                  # 项目说明
```

## 🔒 安全特性

- ✅ **本地存储** - 所有数据仅存储在本地浏览器中
- ✅ **无网络传输** - 不会向任何服务器发送数据
- ✅ **标准算法** - 使用RFC 6238标准的TOTP算法
- ✅ **权限最小化** - 仅请求必要的浏览器权限

## 🌟 功能演示

### 添加账户
- 手动输入密钥和账户名称
- 扫描网页上的二维码
- 导入本地二维码图片
- 拖拽图片到指定区域

### 账户管理
- 智能排序（按使用频率）
- 快速搜索和筛选
- 一键复制验证码
- 圆形倒计时显示

### 数据迁移
- 支持Google Authenticator迁移格式
- 自动解析protobuf和明文数据
- 批量导入多个账户
- 保留issuer信息

## 📊 支持的格式

- ✅ **otpauth://** - 单个账户格式
- ✅ **otpauth-migration://** - Google Authenticator迁移格式
- ✅ **Base32编码** - 标准密钥格式
- ✅ **UTF-8编码** - 支持中文账户名称

## 🔧 开发

### 环境要求
- Chrome 88+ 或基于Chromium的浏览器
- 支持Manifest V3的浏览器版本

### 本地开发
1. 克隆项目到本地
2. 在Chrome中加载扩展（开发者模式）
3. 修改代码后点击"重新加载"按钮

### 打包分发
```bash
# 使用打包脚本
./scripts/package.sh        # Linux/macOS
scripts/package.bat         # Windows

# 创建CRX文件
./scripts/build-crx.sh      # 完整CRX打包
./scripts/build-crx-simple.sh  # 简化CRX打包
```

## 📝 更新日志

### v1.2.2 - 扫描功能完善版本（2024-01-15）
- ✅ 完善页面二维码扫描功能，支持多种载体格式
- ✅ 扩展扫描范围，支持SVG、Canvas、CSS背景图片
- ✅ 优化扫描体验，添加进度反馈和智能通知
- ✅ 增强错误处理，完善跨域处理和错误恢复机制

### v1.2.1 - 用户体验优化版本（2024-01-15）
- ✅ 修复验证码刷新滚动位置问题
- ✅ 优化验证码更新机制，减少不必要的DOM重建
- ✅ 智能渲染策略，区分完整渲染和轻量更新

### v1.2.0 - 导入导出功能版本（2024-01-15）
- ✅ 完整的JSON格式数据导出功能
- ✅ JSON格式数据导入功能
- ✅ 二维码导出功能（生成迁移二维码）
- ✅ 数据验证和完整性检查

## 🤝 贡献

欢迎提交Issue和Pull Request！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## ⚠️ 免责声明

本扩展仅用于学习和个人使用。在生产环境中使用前，请确保充分测试所有功能。开发者不对使用本扩展造成的任何损失负责。

## 📞 支持

- 📧 提交Issue：[GitHub Issues](https://github.com/your-repo/issues)
- 📖 查看文档：[项目文档](docs/DOCS.md)
- 🔍 常见问题：[FAQ](docs/FAQ.md)

---

**⭐ 如果这个项目对您有帮助，请给它一个星标！**