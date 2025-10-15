@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM Google身份验证器Chrome扩展打包脚本 (Windows版本)
REM 用于创建可分发的扩展包

echo 🚀 Google身份验证器Chrome扩展打包工具
echo ========================================

REM 检查是否在正确的目录
if not exist "manifest.json" (
    echo ❌ 错误：请在包含manifest.json的目录中运行此脚本
    pause
    exit /b 1
)

REM 创建打包目录
set PACKAGE_DIR=chrome-extension-package
echo 📦 创建打包目录: %PACKAGE_DIR%

if exist "%PACKAGE_DIR%" (
    echo 🗑️  清理旧的打包目录...
    rmdir /s /q "%PACKAGE_DIR%"
)

mkdir "%PACKAGE_DIR%"

REM 复制必需文件
echo 📋 复制扩展文件...

REM 核心文件
copy manifest.json "%PACKAGE_DIR%\" >nul
copy popup.html "%PACKAGE_DIR%\" >nul
copy popup.js "%PACKAGE_DIR%\" >nul
copy background.js "%PACKAGE_DIR%\" >nul
copy content.js "%PACKAGE_DIR%\" >nul

REM 复制js目录
if exist "js" (
    xcopy js "%PACKAGE_DIR%\js\" /e /i /q >nul
    echo ✅ 复制js目录
)

REM 复制icons目录
if exist "icons" (
    xcopy icons "%PACKAGE_DIR%\icons\" /e /i /q >nul
    echo ✅ 复制icons目录
)

REM 复制文档文件
if exist "README.md" copy README.md "%PACKAGE_DIR%\" >nul
if exist "IFLOW.md" copy IFLOW.md "%PACKAGE_DIR%\" >nul
if exist "INSTALL.md" copy INSTALL.md "%PACKAGE_DIR%\" >nul

REM 创建版本信息文件
echo 📝 创建版本信息文件...
for /f "tokens=4 delims=:" %%a in ('findstr "version" manifest.json') do (
    set VERSION=%%a
    set VERSION=!VERSION:"=!
    set VERSION=!VERSION:,=!
    set VERSION=!VERSION: =!
)

(
echo Google身份验证器Chrome扩展
echo 版本: %VERSION%
echo 打包时间: %date% %time%
echo 打包脚本: package.bat
) > "%PACKAGE_DIR%\VERSION.txt"

REM 创建安装说明
echo 📖 创建安装说明...
(
echo Google身份验证器Chrome扩展 - 安装说明
echo =====================================
echo.
echo 快速安装步骤：
echo 1. 打开Chrome浏览器
echo 2. 在地址栏输入：chrome://extensions/
echo 3. 开启右上角的"开发者模式"
echo 4. 点击"加载已解压的扩展程序"
echo 5. 选择此文件夹
echo 6. 完成安装！
echo.
echo 详细安装说明请查看：INSTALL.md
echo.
echo 功能特性：
echo - 支持TOTP双因素认证
echo - 二维码扫描和导入
echo - Google Authenticator迁移
echo - 智能账户管理
echo - 一键复制验证码
echo.
echo 如有问题，请查看文档或提交Issue。
echo.
echo 版本: %VERSION%
echo 打包时间: %date% %time%
) > "%PACKAGE_DIR%\安装说明.txt"

REM 计算目录大小
for /f %%i in ('dir "%PACKAGE_DIR%" /s /-c ^| find "个文件"') do set FILES=%%i
echo 📊 打包完成！
echo    目录: %PACKAGE_DIR%
echo    文件数: %FILES%
echo    版本: %VERSION%

REM 创建ZIP压缩包
echo 🗜️  创建ZIP压缩包...
set ZIP_NAME=google-authenticator-extension-v%VERSION%.zip

REM 检查是否有PowerShell
where powershell >nul 2>&1
if %errorlevel% equ 0 (
    echo 使用PowerShell创建ZIP包...
    powershell -command "Compress-Archive -Path '%PACKAGE_DIR%' -DestinationPath '%ZIP_NAME%' -Force" >nul 2>&1
    if exist "%ZIP_NAME%" (
        echo ✅ ZIP包创建成功: %ZIP_NAME%
    ) else (
        echo ⚠️  ZIP包创建失败
    )
) else (
    echo ⚠️  PowerShell不可用，跳过ZIP压缩包创建
    echo 💡 提示：可以手动压缩 %PACKAGE_DIR% 目录
)

echo.
echo 🎉 打包完成！
echo ========================================
echo 📁 扩展目录: %PACKAGE_DIR%
echo 📦 ZIP文件: %ZIP_NAME% (如果可用)
echo 📖 安装说明: %PACKAGE_DIR%\安装说明.txt
echo 📚 详细文档: %PACKAGE_DIR%\INSTALL.md
echo.
echo 💡 提示：
echo    1. 可以直接使用 %PACKAGE_DIR% 目录安装扩展
echo    2. 或者分发 %ZIP_NAME% 文件给其他用户
echo    3. 安装时请参考安装说明文档
echo.
echo 🔗 安装地址: chrome://extensions/
echo ========================================
echo.
pause
