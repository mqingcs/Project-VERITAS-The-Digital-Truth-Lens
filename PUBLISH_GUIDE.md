# 发布Veritas到GitHub Packages指南

## 📦 方案一:发布为npm包(推荐用于库/组件分发)

### 前置要求
- GitHub账号(mqingcs)
- GitHub Personal Access Token (需要`write:packages`权限)

### 步骤

#### 1. 更新package.json
需要添加以下字段到`package.json`:

```json
{
  "name": "@mqingcs/veritas",
  "repository": {
    "type": "git",
    "url": "git://github.com/mqingcs/Veritas-Autonomous-Multi-Agent-Truth-Engine.git"
  },
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

> **注意**:包名必须使用scoped格式`@username/package-name`

#### 2. 配置GitHub Token
创建`.npmrc`文件(项目根目录):
```
@mqingcs:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

或使用npm login:
```bash
npm login --scope=@mqingcs --auth-type=legacy --registry=https://npm.pkg.github.com
# Username: mqingcs
# Password: YOUR_GITHUB_TOKEN
# Email: your-email@example.com
```

#### 3. 构建项目
```bash
npm run build
```

#### 4. 发布
```bash
npm publish
```

---

## 🌐 方案二:发布Chrome扩展(推荐用于扩展分发)

### Chrome Web Store发布

#### 1. 打包扩展
```bash
npm run package
```
这会在`build/chrome-mv3-prod`目录生成打包文件。

#### 2. 创建ZIP文件
```bash
cd build/chrome-mv3-prod
zip -r ../../veritas-extension.zip *
```

#### 3. 上传到Chrome Web Store
1. 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. 点击"New Item"
3. 上传`veritas-extension.zip`
4. 填写Store Listing信息
5. 提交审核

---

## 🔧 方案三:通过GitHub Releases分发

适合同时提供源码和构建产物:

#### 1. 构建并打包
```bash
npm run build
npm run package
```

#### 2. 创建GitHub Release
```bash
git tag v0.0.1
git push origin v0.0.1
```

#### 3. 在GitHub上创建Release
- 访问仓库的Releases页面
- 创建新Release,选择tag `v0.0.1`
- 上传构建产物:
  - `build/chrome-mv3-prod.zip` (Chrome扩展)
  - `build/firefox-mv3-prod.zip` (如果支持Firefox)

---

## 📋 注意事项

### npm包发布注意事项
1. **包名冲突**:确保`@mqingcs/veritas`未被占用
2. **版本管理**:遵循[语义化版本](https://semver.org/)
3. **文件过滤**:在`package.json`中配置`files`字段,只发布必要文件:
   ```json
   "files": [
     "build/**/*",
     "src/**/*",
     "README.md",
     "LICENSE"
   ]
   ```

### Chrome扩展发布注意事项
1. **隐私政策**:必须提供隐私政策URL
2. **权限说明**:清晰解释为何需要每项权限
3. **Manifest V3**:当前使用MV3,符合Chrome要求
4. **API Key安全**:不要在发布版本中包含API密钥

---

## 🚀 快速命令

### npm发布流程
```bash
# 1. 更新package.json(添加scoped name和publishConfig)
# 2. 配置认证
npm login --scope=@mqingcs --registry=https://npm.pkg.github.com

# 3. 构建
npm run build

# 4. 发布
npm publish

# 5. 安装测试
npm install @mqingcs/veritas --registry=https://npm.pkg.github.com
```

### Chrome扩展发布流程
```bash
# 1. 构建
npm run build

# 2. 打包
cd build/chrome-mv3-prod
zip -r ../../veritas-v0.0.1.zip *
cd ../..

# 3. 手动上传到Chrome Web Store Developer Dashboard
```

---

## 🔑 获取GitHub Token

1. 访问 https://github.com/settings/tokens
2. 点击"Generate new token (classic)"
3. 勾选权限:
   - ✅ `write:packages`
   - ✅ `read:packages`
   - ✅ `delete:packages`(可选,用于删除版本)
4. 点击"Generate token"
5. **立即保存token**,之后无法再次查看

---

## 📚 推荐资源

- [GitHub Packages文档](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)
- [Chrome扩展发布指南](https://developer.chrome.com/docs/webstore/publish/)
- [Plasmo打包文档](https://docs.plasmo.com/framework/workflows/build)
