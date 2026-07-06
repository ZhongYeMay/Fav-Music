# 🎵 我的音乐库 (Fav-Music)

一个现代化的网页应用，用于上传、管理和展示您喜爱的���乐文件。自动从音乐文件中提取元数据（标题、艺术家、专辑等），并将文件保存到GitHub仓库中。

## ✨ 功能特性

- 🎵 **拖拽上传** - 支持拖拽或点击上传音乐文件
- 📊 **自动元数据提取** - 自动读取MP3的ID3标签信息
- 🎨 **美观界面** - 响应式设计，支持深色模式
- 💾 **GitHub集成** - 直接上传文件到GitHub仓库
- 🔍 **智能识别** - 从文件名识别艺术家和标题
- 📱 **移动友好** - 完全响应式设计
- 🎧 **在线播放** - 内置音乐播放器
- 📥 **导出元数据** - 支持下载音乐元数据为JSON

## 🚀 快速开始

### 前置要求

- GitHub账户
- GitHub Personal Access Token (用于上传文件)

### 安装步骤

1. **克隆或使用本仓库**
   ```bash
   git clone https://github.com/ZhongYeMay/Fav-Music.git
   cd Fav-Music
   ```

2. **启用GitHub Pages**
   - 进入仓库设置 → Pages
   - 选择 `main` 分支作为源
   - 点击保存

3. **获取GitHub Token**
   - 访问 https://github.com/settings/tokens
   - 点击 "Generate new token"
   - 选择 `repo` 权限
   - 保存生成的Token

4. **打开网页应用**
   - 访问 `https://username.github.io/Fav-Music`
   - 首次打开时输入您的GitHub Token
   - 开始上传您的音乐文件！

## 📝 使用说明

### 上传音乐

1. 点击上传区域或拖拽音乐文件到页面
2. 支持格式: MP3, FLAC, WAV, OGG, M4A
3. 系统会自动：
   - 提取音乐元数据（如果可用）
   - 上传文件到GitHub仓库的 `music/` 目录
   - 保存元数据到 `music_metadata.json`

### 查看和播放

- 上传完成后，音乐会显示在列表中
- 点击任何音乐卡片可以播放
- 显示的信息：
  - 🎵 歌曲标题
  - 👤 艺术家名称
  - 💿 专辑名称
  - ⏱️ 歌曲时长

### 管理音乐

- **刷新列表** - 重新加载最新的音乐列表
- **下载元数据** - 导出所有音乐信息为JSON格式

## 🔧 技术栈

- **前端框架**: 纯HTML/CSS/JavaScript (无依赖)
- **API**: GitHub REST API
- **存储**: GitHub仓库
- **部署**: GitHub Pages

## 📂 文件结构

```
Fav-Music/
├── index.html              # 主HTML文件
├── style.css               # 样式表
├── app.js                  # 应用逻辑
├── music/                  # 音乐文件目录（自动创建）
├── music_metadata.json     # 元数据文件（自动生成）
└── README.md               # 说明文档
```

## 🔐 安全性

- Token存储在浏览器本地存储中
- 建议为Token设置有效期
- 只授予必要的权限（repo scope）
- 如需重置Token，可在GitHub设置中删除

## 🎯 支持的音乐格式

| 格式 | MIME类型 | 扩展名 |
|------|---------|--------|
| MP3 | audio/mpeg | .mp3 |
| FLAC | audio/flac | .flac |
| WAV | audio/wav | .wav |
| OGG | audio/ogg | .ogg |
| M4A | audio/mp4 | .m4a |

## 📊 元数据示例

```json
[
  {
    "title": "示例歌曲",
    "artist": "示例艺术家",
    "album": "示例专辑",
    "duration": "03:45",
    "genre": "摇滚",
    "fileName": "song.mp3",
    "fileSize": 1024000,
    "path": "music/1234567890_示例艺术家_示例歌曲.mp3",
    "uploadedAt": "2024-07-06T12:00:00.000Z"
  }
]
```

## 🐛 故障排除

### 上传失败

**问题**: "上传失败: 401 Unauthorized"
- **解决**: 检查GitHub Token是否有效和权限

**问题**: "上传失败: 422 Unprocessable Entity"
- **解决**: 文件名可能包含非法字符，请重命名

### Token问题

**问题**: 首次打开页面时没有要求输入Token
- **解决**: 检查浏览器是否启用了localStorage
- **解决**: 尝试清除浏览器缓存后重试

### 播放问题

**问题**: 音频无法播放
- **解决**: 检查浏览器是否支持该音频格式
- **解决**: 尝试刷新页面

## 💡 高级功能

### 自定义Token过期

```javascript
// 在app.js中修改
const TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7天
```

### 批量导入

可以直接将音乐文件放在 `music/` 目录中，然后点击"刷新列表"加载。

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 📧 联系方式

如有问题或建议，请在GitHub Issues中提出。

---

**提示**: 首次使用时，请确保您有有效的GitHub Personal Access Token，以便上传音乐文件。
