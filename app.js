// 配置
const CONFIG = {
    REPO: 'ZhongYeMay/Fav-Music',
    MUSIC_DIR: 'music',
    METADATA_FILE: 'music_metadata.json',
    API_BASE: 'https://api.github.com',
};

// 应用状态
let appState = {
    musicMetadata: [],
    categories: [],
    selectedCategories: [],
    gitHubToken: localStorage.getItem('github_token') || '',
    currentEditIndex: -1,
    filteredMusic: []
};

// DOM元素
const elements = {
    dropZone: document.getElementById('dropZone'),
    fileInput: document.getElementById('fileInput'),
    tokenInput: document.getElementById('tokenInput'),
    saveTokenBtn: document.getElementById('saveTokenBtn'),
    clearTokenBtn: document.getElementById('clearTokenBtn'),
    categoryInput: document.getElementById('categoryInput'),
    categoryList: document.getElementById('categoryList'),
    addCategoryBtn: document.getElementById('addCategoryBtn'),
    categoryTags: document.getElementById('categoryTags'),
    progressSection: document.getElementById('progressSection'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    musicList: document.getElementById('musicList'),
    filterButtons: document.querySelector('.filter-buttons'),
    searchInput: document.getElementById('searchInput'),
    refreshBtn: document.getElementById('refreshBtn'),
    downloadJsonBtn: document.getElementById('downloadJsonBtn'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    playerModal: document.getElementById('playerModal'),
    editModal: document.getElementById('editModal'),
    closePlayer: document.getElementById('closePlayer'),
    closeEdit: document.getElementById('closeEdit'),
    audioPlayer: document.getElementById('audioPlayer'),
    editForm: document.getElementById('editForm'),
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadMusicList();
    
    if (appState.gitHubToken) {
        elements.tokenInput.value = '••••••••••••••••';
    }
});

// 设置事件监听
function setupEventListeners() {
    // 拖拽上传
    elements.dropZone.addEventListener('click', () => elements.fileInput.click());
    elements.dropZone.addEventListener('dragover', handleDragOver);
    elements.dropZone.addEventListener('dragleave', handleDragLeave);
    elements.dropZone.addEventListener('drop', handleDrop);
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // Token管理
    elements.saveTokenBtn.addEventListener('click', saveToken);
    elements.clearTokenBtn.addEventListener('click', clearToken);
    
    // 分类管理
    elements.addCategoryBtn.addEventListener('click', addCategory);
    elements.categoryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addCategory();
    });
    
    // 搜索和过滤
    elements.searchInput.addEventListener('input', filterAndRenderMusic);
    
    // 按钮
    elements.refreshBtn.addEventListener('click', loadMusicList);
    elements.downloadJsonBtn.addEventListener('click', downloadMetadata);
    elements.exportCsvBtn.addEventListener('click', exportCsv);
    
    // Modal关闭
    elements.closePlayer.addEventListener('click', () => elements.playerModal.style.display = 'none');
    elements.closeEdit.addEventListener('click', () => elements.editModal.style.display = 'none');
    elements.editForm.addEventListener('submit', saveEditedMusic);
    
    window.addEventListener('click', (e) => {
        if (e.target === elements.playerModal) {
            elements.playerModal.style.display = 'none';
        }
        if (e.target === elements.editModal) {
            elements.editModal.style.display = 'none';
        }
    });
}

// Token管理
function saveToken() {
    const token = elements.tokenInput.value.trim();
    if (!token) {
        alert('请输入有效的Token');
        return;
    }
    appState.gitHubToken = token;
    localStorage.setItem('github_token', token);
    elements.tokenInput.value = '••••••••••••••••';
    alert('Token已保存！');
}

function clearToken() {
    if (confirm('确定要清除Token吗？')) {
        appState.gitHubToken = '';
        localStorage.removeItem('github_token');
        elements.tokenInput.value = '';
        alert('Token已清除');
    }
}

// 分类管理
function addCategory() {
    const category = elements.categoryInput.value.trim();
    if (!category) return;
    
    if (!appState.categories.includes(category)) {
        appState.categories.push(category);
        updateCategoryList();
    }
    
    if (!appState.selectedCategories.includes(category)) {
        appState.selectedCategories.push(category);
    }
    
    updateCategoryTags();
    elements.categoryInput.value = '';
}

function removeCategory(category) {
    appState.selectedCategories = appState.selectedCategories.filter(c => c !== category);
    updateCategoryTags();
}

function updateCategoryList() {
    const options = appState.categories.map(cat => 
        `<option value="${cat}"></option>`
    ).join('');
    elements.categoryList.innerHTML = options;
}

function updateCategoryTags() {
    elements.categoryTags.innerHTML = appState.selectedCategories.map(cat => `
        <div class="category-tag">
            ${cat}
            <span class="category-tag-remove" onclick="removeCategory('${cat}')">×</span>
        </div>
    `).join('');
}

// 拖拽处理
function handleDragOver(e) {
    e.preventDefault();
    elements.dropZone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    elements.dropZone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    elements.dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
}

function handleFileSelect(e) {
    handleFiles(e.target.files);
}

// 处理文件
async function handleFiles(files) {
    if (!appState.gitHubToken) {
        alert('请先保存GitHub Token');
        return;
    }
    
    const audioFiles = Array.from(files).filter(file => {
        return ['audio/mpeg', 'audio/flac', 'audio/wav', 'audio/ogg', 'audio/mp4'].includes(file.type) ||
               /\.(mp3|flac|wav|ogg|m4a)$/i.test(file.name);
    });

    if (audioFiles.length === 0) {
        alert('请选择有效的音乐文件 (MP3, FLAC, WAV, OGG, M4A)');
        return;
    }

    if (appState.selectedCategories.length === 0) {
        alert('请先选择或创建分类');
        return;
    }

    elements.progressSection.style.display = 'block';
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < audioFiles.length; i++) {
        const file = audioFiles[i];
        elements.progressText.textContent = `正在处理: ${file.name} (${i + 1}/${audioFiles.length})`;
        elements.progressBar.style.width = `${((i + 1) / audioFiles.length) * 100}%`;
        
        try {
            const metadata = await extractMetadata(file);
            metadata.categories = [...appState.selectedCategories];
            
            // 尝试上传文件
            try {
                await uploadFile(file, metadata);
            } catch (uploadError) {
                console.warn('File upload failed, saving metadata only:', uploadError);
                metadata.uploaded = false;
                metadata.error = uploadError.message;
            }
            
            appState.musicMetadata.push(metadata);
            successCount++;
        } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            failureCount++;
        }
    }
    
    if (successCount > 0) {
        await saveMetadata();
        await loadMusicList();
    }
    
    elements.progressSection.style.display = 'none';
    elements.fileInput.value = '';
    appState.selectedCategories = [];
    updateCategoryTags();
    
    if (failureCount === 0) {
        alert(`✅ Success: ${successCount}`);
    } else {
        alert(`⚠️ Complete\nSuccess: ${successCount}\nFailed: ${failureCount}`);
    }
}

// 提取音乐元数据
async function extractMetadata(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target.result;
                const metadata = parseAudioMetadata(arrayBuffer, file.name);
                metadata.fileName = file.name;
                metadata.fileSize = (file.size / 1024 / 1024).toFixed(2) + 'MB';
                metadata.uploadedAt = new Date().toISOString();
                resolve(metadata);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsArrayBuffer(file);
    });
}

// 解析音频元数据
function parseAudioMetadata(arrayBuffer, fileName) {
    const view = new Uint8Array(arrayBuffer);
    let metadata = {
        title: fileName.replace(/\.[^/.]+$/, ''),
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        duration: 'Unknown',
        genre: 'Unknown',
        categories: []
    };

    // ID3v2 tag parsing (MP3)
    if (view[0] === 0x49 && view[1] === 0x44 && view[2] === 0x33) {
        try {
            const id3Size = ((view[6] & 0x7f) << 21) | 
                          ((view[7] & 0x7f) << 14) | 
                          ((view[8] & 0x7f) << 7) | 
                          (view[9] & 0x7f);
            
            let offset = 10;
            while (offset < Math.min(id3Size, view.length - 10)) {
                const frameID = String.fromCharCode(view[offset], view[offset + 1], view[offset + 2], view[offset + 3]);
                const frameSize = (view[offset + 4] << 24) | (view[offset + 5] << 16) | 
                                 (view[offset + 6] << 8) | view[offset + 7];
                
                if (frameSize === 0 || frameID.includes('\x00')) break;
                
                const frameData = view.slice(offset + 10, offset + 10 + frameSize);
                const text = new TextDecoder().decode(frameData).split('\x00')[0];
                
                if (frameID === 'TIT2') metadata.title = text || metadata.title;
                if (frameID === 'TPE1') metadata.artist = text || metadata.artist;
                if (frameID === 'TALB') metadata.album = text || metadata.album;
                if (frameID === 'TCON') metadata.genre = text || metadata.genre;
                
                offset += 10 + frameSize;
            }
        } catch (e) {
            console.warn('ID3 parsing failed:', e);
        }
    }

    // Extract from filename
    if (fileName.includes(' - ')) {
        const parts = fileName.replace(/\.[^/.]+$/, '').split(' - ');
        if (parts.length >= 2) {
            metadata.artist = parts[0].trim();
            metadata.title = parts[1].trim();
        }
    }

    const estimatedDuration = Math.round(arrayBuffer.byteLength / 16000);
    metadata.duration = formatDuration(estimatedDuration);

    return metadata;
}

// 格式化时长
function formatDuration(seconds) {
    if (seconds <= 0) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// 上传文件到GitHub
async function uploadFile(file, metadata) {
    if (!appState.gitHubToken) {
        throw new Error('GitHub Token not configured');
    }

    const [owner, repo] = CONFIG.REPO.split('/');
    
    try {
        const fileContent = await file.arrayBuffer();
        const base64Content = btoa(String.fromCharCode.apply(null, new Uint8Array(fileContent)));
        
        const timestamp = Date.now();
        const ext = file.name.split('.').pop().toLowerCase();
        const fileName = `${timestamp}.${ext}`;
        const path = `${CONFIG.MUSIC_DIR}/${fileName}`;

        const url = `${CONFIG.API_BASE}/repos/${owner}/${repo}/contents/${path}`;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${appState.gitHubToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Upload: ${metadata.title}`,
                content: base64Content,
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        metadata.path = path;
        return await response.json();
    } catch (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }
}

// 保存元数据到GitHub
async function saveMetadata() {
    if (!appState.gitHubToken) return;

    const [owner, repo] = CONFIG.REPO.split('/');
    const url = `${CONFIG.API_BASE}/repos/${owner}/${repo}/contents/${CONFIG.METADATA_FILE}`;

    try {
        let sha = '';
        try {
            const getResponse = await fetch(url, {
                headers: {
                    'Authorization': `token ${appState.gitHubToken}`,
                }
            });
            if (getResponse.ok) {
                const existingFile = await getResponse.json();
                sha = existingFile.sha;
                const existingData = JSON.parse(atob(existingFile.content));
                const merged = {};
                existingData.forEach(m => merged[m.fileName] = m);
                appState.musicMetadata.forEach(m => merged[m.fileName] = m);
                appState.musicMetadata = Object.values(merged);
            }
        } catch (e) {
            console.log('Creating new metadata file');
        }

        const content = btoa(JSON.stringify(appState.musicMetadata, null, 2));
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${appState.gitHubToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Update music metadata',
                content: content,
                ...(sha && { sha })
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save metadata');
        }
        
        console.log('Metadata saved successfully');
    } catch (error) {
        console.error('Error saving metadata:', error);
    }
}

// 加载音乐列表
async function loadMusicList() {
    try {
        elements.musicList.innerHTML = '<div class="loading">Loading...</div>';
        
        const [owner, repo] = CONFIG.REPO.split('/');
        const url = `${CONFIG.API_BASE}/repos/${owner}/${repo}/contents/${CONFIG.METADATA_FILE}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            elements.musicList.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">No music files uploaded yet</div>';
            return;
        }

        const file = await response.json();
        appState.musicMetadata = JSON.parse(atob(file.content));
        
        const allCategories = new Set();
        appState.musicMetadata.forEach(music => {
            if (music.categories) {
                music.categories.forEach(cat => allCategories.add(cat));
            }
        });
        appState.categories = Array.from(allCategories);
        updateCategoryList();
        
        updateFilterButtons();
        filterAndRenderMusic();
    } catch (error) {
        console.error('Error loading music list:', error);
        elements.musicList.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">Failed to load, please try again</div>';
    }
}

// 更新过滤按钮
function updateFilterButtons() {
    const buttons = ['<button class="filter-btn active" data-category="all" onclick="filterByCategory(\'all\')">All</button>'];
    
    appState.categories.forEach(category => {
        buttons.push(`<button class="filter-btn" data-category="${category}" onclick="filterByCategory('${category}')">${category}</button>`);
    });
    
    elements.filterButtons.innerHTML = buttons.join('');
}

// 按分类过滤
function filterByCategory(category) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    filterAndRenderMusic();
}

// 过滤和渲染音乐
function filterAndRenderMusic() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    const activeCategory = document.querySelector('.filter-btn.active')?.dataset.category || 'all';
    
    appState.filteredMusic = appState.musicMetadata.filter(music => {
        const matchesSearch = !searchTerm || 
            music.title.toLowerCase().includes(searchTerm) ||
            music.artist.toLowerCase().includes(searchTerm) ||
            music.album.toLowerCase().includes(searchTerm);
        
        const matchesCategory = activeCategory === 'all' || 
            (music.categories && music.categories.includes(activeCategory));
        
        return matchesSearch && matchesCategory;
    });
    
    renderMusicList();
}

// 渲染音乐列表
function renderMusicList() {
    if (appState.filteredMusic.length === 0) {
        elements.musicList.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">No matching music found</div>';
        return;
    }

    elements.musicList.innerHTML = appState.filteredMusic.map((music, index) => {
        const actualIndex = appState.musicMetadata.indexOf(music);
        const categoryBadges = music.categories ? 
            music.categories.map(cat => `<span class="music-category">${cat}</span>`).join('') : '';
        
        return `
            <div class="music-card">
                <div class="album-thumb">${getGenreEmoji(music.genre)}</div>
                <h3 title="${music.title}">${music.title}</h3>
                <p title="${music.artist}">👤 ${music.artist}</p>
                <p title="${music.album}">💿 ${music.album}</p>
                ${categoryBadges ? `<div>${categoryBadges}</div>` : ''}
                <div class="music-duration">⏱️ ${music.duration} | 💾 ${music.fileSize || 'Unknown'}</div>
                <div class="music-actions">
                    <button class="icon-btn" onclick="playMusic(${actualIndex})">▶️ Play</button>
                    <button class="icon-btn" onclick="editMusic(${actualIndex})">✏️ Edit</button>
                    <button class="icon-btn" onclick="deleteMusic(${actualIndex})">🗑️ Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// 获取流派表情符号
function getGenreEmoji(genre) {
    const genres = {
        '摇滚': '🎸', '流行': '🎤', '古典': '🎻', '爵士': '🎷',
        '嘻哈': '🎧', '电子': '🎹', '乡村': '🤠', '民谣': '🎺',
        'R&B': '🎶', '蓝调': '🎵'
    };
    return genres[genre] || '🎵';
}

// 播放音乐
function playMusic(index) {
    const music = appState.musicMetadata[index];
    document.getElementById('playerTitle').textContent = music.title;
    document.getElementById('playerArtist').textContent = `${getGenreEmoji(music.genre)} ${music.artist}`;
    document.getElementById('playerAlbum').textContent = `💿 ${music.album}`;
    document.getElementById('playerGenre').textContent = `🎵 ${music.genre}`;
    document.getElementById('playerCategory').textContent = `📂 ${music.categories?.join(', ') || 'Uncategorized'}`;
    document.getElementById('playerDuration').textContent = `⏱️ ${music.duration}`;

    if (music.path) {
        const [owner, repo] = CONFIG.REPO.split('/');
        elements.audioPlayer.src = `https://raw.githubusercontent.com/${owner}/${repo}/main/${music.path}`;
    }

    elements.playerModal.style.display = 'flex';
}

// 编辑音乐
function editMusic(index) {
    const music = appState.musicMetadata[index];
    appState.currentEditIndex = index;
    
    document.getElementById('editTitle').value = music.title;
    document.getElementById('editArtist').value = music.artist;
    document.getElementById('editAlbum').value = music.album;
    document.getElementById('editGenre').value = music.genre;
    document.getElementById('editCategory').value = music.categories?.join(', ') || '';
    
    elements.editModal.style.display = 'flex';
}

function saveEditedMusic(e) {
    e.preventDefault();
    
    const index = appState.currentEditIndex;
    appState.musicMetadata[index].title = document.getElementById('editTitle').value;
    appState.musicMetadata[index].artist = document.getElementById('editArtist').value;
    appState.musicMetadata[index].album = document.getElementById('editAlbum').value;
    appState.musicMetadata[index].genre = document.getElementById('editGenre').value;
    appState.musicMetadata[index].categories = document.getElementById('editCategory').value
        .split(',')
        .map(cat => cat.trim())
        .filter(cat => cat);
    
    saveMetadata().then(() => {
        filterAndRenderMusic();
        elements.editModal.style.display = 'none';
        alert('Music info updated');
    });
}

function closeEditModal() {
    elements.editModal.style.display = 'none';
}

// 删除音乐
function deleteMusic(index) {
    if (confirm(`Delete "${appState.musicMetadata[index].title}"?`)) {
        appState.musicMetadata.splice(index, 1);
        saveMetadata().then(() => {
            filterAndRenderMusic();
            alert('Music deleted');
        });
    }
}

// 下载元数据
function downloadMetadata() {
    const dataStr = JSON.stringify(appState.musicMetadata, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `music_metadata_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// 导出CSV
function exportCsv() {
    const headers = ['Title', 'Artist', 'Album', 'Genre', 'Category', 'Duration', 'Size', 'Uploaded'];
    const rows = appState.musicMetadata.map(music => [
        music.title,
        music.artist,
        music.album,
        music.genre,
        music.categories?.join('; ') || '',
        music.duration,
        music.fileSize || 'Unknown',
        new Date(music.uploadedAt).toLocaleString()
    ]);
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `music_library_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}
