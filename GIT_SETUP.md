# Git仓库设置指南

## 📋 概述

本指南将帮助您为Google身份验证器Chrome扩展项目设置Git版本控制。

## 🚀 快速设置

### 1. 初始化Git仓库
```bash
# 在项目根目录运行
git init
```

### 2. 创建.gitignore文件
```bash
# 将模板文件重命名为.gitignore
mv gitignore-template.txt .gitignore
```

### 3. 添加文件到Git
```bash
# 添加所有文件
git add .

# 查看将要提交的文件
git status
```

### 4. 首次提交
```bash
# 创建首次提交
git commit -m "Initial commit: Google Authenticator Chrome Extension v1.0.0"
```

## 📁 .gitignore文件说明

### 被忽略的文件类型

#### 操作系统文件
- `.DS_Store` - macOS系统文件
- `Thumbs.db` - Windows缩略图文件
- `.Spotlight-V100` - macOS搜索索引

#### 编辑器配置
- `.vscode/` - Visual Studio Code配置
- `.idea/` - IntelliJ IDEA配置
- `*.swp`, `*.swo` - Vim临时文件

#### 构建和打包文件
- `*.crx` - Chrome扩展包文件
- `*.pem` - 私钥文件（重要！）
- `*.zip` - 压缩包文件
- `chrome-extension-package/` - 临时打包目录

#### 开发工具文件
- `.cursorindexingignore` - Cursor编辑器文件
- `.specstory/` - 开发工具目录

#### 日志和临时文件
- `*.log` - 日志文件
- `*.tmp`, `*.temp` - 临时文件
- `*.bak`, `*.backup` - 备份文件

## ⚠️ 重要提醒

### 私钥文件安全
- **绝对不要**将`.pem`私钥文件提交到Git仓库
- 私钥文件用于签名Chrome扩展
- 丢失私钥将无法更新已发布的扩展
- 建议将私钥文件存储在安全的地方

### 打包文件
- `*.crx`文件是构建产物，不需要版本控制
- 每次构建都会生成新的CRX文件
- 可以通过CI/CD自动构建和分发

## 🔧 常用Git命令

### 查看状态
```bash
# 查看工作区状态
git status

# 查看被忽略的文件
git status --ignored
```

### 添加文件
```bash
# 添加特定文件
git add manifest.json

# 添加所有文件（除了.gitignore中的）
git add .
```

### 提交更改
```bash
# 提交所有更改
git commit -m "描述更改内容"

# 提交特定文件
git commit -m "更新popup.js" popup.js
```

### 查看历史
```bash
# 查看提交历史
git log --oneline

# 查看文件更改历史
git log --follow popup.js
```

## 📦 分支管理

### 创建分支
```bash
# 创建并切换到新分支
git checkout -b feature/new-feature

# 创建分支但不切换
git branch feature/new-feature
```

### 合并分支
```bash
# 切换到主分支
git checkout main

# 合并功能分支
git merge feature/new-feature
```

## 🌐 远程仓库

### 添加远程仓库
```bash
# 添加GitHub远程仓库
git remote add origin https://github.com/username/google-authenticator-extension.git

# 查看远程仓库
git remote -v
```

### 推送代码
```bash
# 首次推送
git push -u origin main

# 后续推送
git push
```

### 拉取代码
```bash
# 拉取最新代码
git pull origin main
```

## 🏷️ 标签管理

### 创建标签
```bash
# 创建版本标签
git tag -a v1.0.0 -m "Release version 1.0.0"

# 推送标签
git push origin v1.0.0
```

### 查看标签
```bash
# 查看所有标签
git tag

# 查看标签详情
git show v1.0.0
```

## 🔄 工作流程建议

### 开发流程
1. 创建功能分支：`git checkout -b feature/feature-name`
2. 开发功能并提交：`git commit -m "Add new feature"`
3. 推送到远程：`git push origin feature/feature-name`
4. 创建Pull Request
5. 合并到主分支

### 发布流程
1. 更新版本号：修改`manifest.json`中的version
2. 创建发布标签：`git tag -a v1.1.0 -m "Release v1.1.0"`
3. 推送标签：`git push origin v1.1.0`
4. 构建CRX文件
5. 发布到Chrome Web Store

## 📚 相关文档

- [Git官方文档](https://git-scm.com/doc)
- [GitHub使用指南](https://docs.github.com/)
- [Chrome扩展开发文档](https://developer.chrome.com/docs/extensions/)

## ❓ 常见问题

### Q: 如何撤销最后一次提交？
A: 使用 `git reset --soft HEAD~1` 撤销提交但保留更改

### Q: 如何查看文件的具体更改？
A: 使用 `git diff filename` 查看文件更改

### Q: 如何恢复被删除的文件？
A: 使用 `git checkout HEAD -- filename` 恢复文件

### Q: 如何忽略已经被跟踪的文件？
A: 使用 `git rm --cached filename` 停止跟踪文件
