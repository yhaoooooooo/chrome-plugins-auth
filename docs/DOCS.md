# 文档索引

## 📚 文档概览

本项目包含完整的文档体系，涵盖安装、使用、开发和常见问题等各个方面。

## 📖 主要文档

### 用户文档
- **[README.md](../README.md)** - 项目主入口，快速开始指南
- **[INSTALL.md](INSTALL.md)** - 详细安装指南和系统要求
- **[IMPORT_EXPORT.md](IMPORT_EXPORT.md)** - 数据导入导出功能使用指南
- **[FAQ.md](FAQ.md)** - 常见问题解答和故障排除

### 开发文档
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - 技术实现、开发环境和版本历史
- **[IFLOW.md](../IFLOW.md)** - 完整的开发历程和技术细节

## 🚀 快速导航

### 新用户
1. 阅读 [README.md](../README.md) 了解项目概况
2. 按照 [INSTALL.md](INSTALL.md) 进行安装
3. 遇到问题时查看 [FAQ.md](FAQ.md)

### 开发者
1. 阅读 [DEVELOPMENT.md](DEVELOPMENT.md) 了解技术架构
2. 查看 [IFLOW.md](../IFLOW.md) 了解开发历程
3. 参考代码注释和API文档

### 数据管理
1. 查看 [IMPORT_EXPORT.md](IMPORT_EXPORT.md) 了解备份功能
2. 学习数据迁移和同步方法
3. 了解安全注意事项

## 📋 文档结构

```
chrome-tools/
├── README.md              # 项目主入口
├── docs/                  # 文档目录
│   ├── INSTALL.md         # 安装指南
│   ├── DEVELOPMENT.md     # 开发文档
│   ├── IMPORT_EXPORT.md   # 导入导出指南
│   ├── FAQ.md             # 常见问题
│   └── DOCS.md            # 文档索引（本文件）
├── scripts/               # 脚本目录
│   ├── package.sh         # Linux/macOS打包脚本
│   ├── package.bat        # Windows打包脚本
│   ├── build-crx.sh       # CRX打包脚本
│   └── build-crx-simple.sh # 简化CRX打包脚本
└── IFLOW.md              # 开发历程
```

## 🔍 功能分类

### 核心功能
- **TOTP认证** - 基于时间的一次性密码
- **二维码扫描** - 多格式支持（图片、SVG、Canvas、CSS背景）
- **账户管理** - 智能排序、搜索、统计
- **数据迁移** - Google Authenticator兼容

### 高级功能
- **导入导出** - JSON格式数据备份
- **多设备同步** - 跨设备数据迁移
- **使用统计** - 智能排序和频率统计
- **错误处理** - 完善的错误恢复机制

## 🛠️ 技术文档

### 架构设计
- **Manifest V3** - 最新Chrome扩展标准
- **模块化设计** - 清晰的代码结构
- **事件驱动** - 基于消息传递的通信
- **异步处理** - Promise和async/await

### 核心技术
- **Web Crypto API** - HMAC-SHA1加密
- **Canvas API** - 二维码图像处理
- **Chrome Storage API** - 数据持久化
- **Chrome Scripting API** - 动态脚本注入

## 📊 版本信息

### 当前版本
- **版本号**: v1.2.2
- **发布日期**: 2024-01-15
- **主要特性**: 扫描功能完善、用户体验优化

### 版本历史
- **v1.2.2** - 扫描功能完善版本
- **v1.2.1** - 用户体验优化版本
- **v1.2.0** - 导入导出功能版本
- **v1.0.0** - 初始版本

## 🔒 安全说明

### 数据安全
- ✅ 本地存储，无网络传输
- ✅ 标准TOTP算法
- ✅ 权限最小化
- ✅ 开源可审计

### 隐私保护
- ❌ 不收集个人信息
- ❌ 不跟踪用户行为
- ❌ 不上传数据到服务器
- ✅ 所有计算本地进行

## 📞 获取帮助

### 支持渠道
- 📖 查看相关文档
- 🔍 搜索常见问题
- 📧 提交GitHub Issue
- 💬 参与社区讨论

### 问题报告
1. 查看 [FAQ.md](FAQ.md) 寻找解决方案
2. 检查 [DEVELOPMENT.md](DEVELOPMENT.md) 了解技术细节
3. 提供详细的错误信息和复现步骤
4. 通过GitHub Issues提交问题

## 📝 文档维护

### 更新原则
- 保持文档与代码同步
- 及时更新版本信息
- 完善用户反馈的问题
- 持续改进文档质量

### 贡献指南
- 发现文档问题请提交Issue
- 改进建议欢迎Pull Request
- 保持文档风格一致
- 遵循Markdown格式规范

---

**💡 提示**: 如果您是第一次使用本项目，建议按照 [README.md](../README.md) → [INSTALL.md](INSTALL.md) → [FAQ.md](FAQ.md) 的顺序阅读文档。
