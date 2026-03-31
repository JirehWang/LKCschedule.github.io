// 全域變數
let events = [];
let eventIdCounter = 1;
let ministryIdCounter = 1; // 事工細項計數器
let sermonIdCounter = 1;   // 講道資訊計數器

// GAS Web App URL - 請替換成你部署後的 URL
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwiYYWgKxmLRAEaE_pbp_kWyAzlRPcwYVQfvmJVamRJvosvt5wTTkvwebbFBkP8rMqX/exec';

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    renderEvents();
});

// 新增單一對話框的專屬邏輯
function addEvent() {
    document.getElementById('singleEventModal').classList.remove('hidden');
    // 開啟時預設帶入今天日期，並清空其他欄位
    document.getElementById('singleDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('singleName').value = '';
    document.getElementById('singleCategory').value = '台華語聚會';
}

// 關閉單一新增對話框
function closeSingleEventModal() {
    document.getElementById('singleEventModal').classList.add('hidden');
}

// 確認單一新增
function confirmSingleEventAdd() {
    const dateStr = document.getElementById('singleDate').value;
    const name = document.getElementById('singleName').value.trim();
    const category = document.getElementById('singleCategory').value;

    if (!dateStr) {
        alert('請選擇日期');
        return;
    }

    const event = {
        id: eventIdCounter++,
        date: dateStr,
        name: name,
        category: category,
        ministryItems: [], // 籌備事工
        sermons: [],       // 當天講道
        showSub: true      // 新增後預設展開方便編輯
    };
    
    events.push(event);
    
    // 新增後自動依日期排序
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    renderEvents();
    saveToLocalStorage();
    closeSingleEventModal();
}

// 刪除聚會
function deleteEvent(eventId) {
    if (confirm('確定要刪除此聚會嗎？')) {
        events = events.filter(e => e.id !== eventId);
        renderEvents();
        saveToLocalStorage();
    }
}

// 更新聚會資料
function updateEvent(eventId, field, value) {
    const event = events.find(e => e.id === eventId);
    if (event) {
        event[field] = value;
        saveToLocalStorage();
    }
}

// 切換子項目顯示
function toggleSubItems(eventId) {
    const event = events.find(e => e.id === eventId);
    if (event) {
        event.showSub = !event.showSub;
        renderEvents();
    }
}

// ====================
// 事工細項相關功能 (籌備期)
// ====================
function addMinistryItem(eventId) {
    const event = events.find(e => e.id === eventId);
    if (event) {
        event.ministryItems.push({
            id: ministryIdCounter++,
            period: '',
            content: ''
        });
        event.showSub = true;
        renderEvents();
        saveToLocalStorage();
    }
}

function deleteMinistryItem(eventId, minId) {
    const event = events.find(e => e.id === eventId);
    if (event) {
        event.ministryItems = event.ministryItems.filter(m => m.id !== minId);
        renderEvents();
        saveToLocalStorage();
    }
}

function updateMinistryItem(eventId, minId, field, value) {
    const event = events.find(e => e.id === eventId);
    if (event) {
        const item = event.ministryItems.find(m => m.id === minId);
        if (item) {
            item[field] = value;
            saveToLocalStorage();
        }
    }
}

// ====================
// 講道資訊相關功能 (當天)
// ====================
function addSermon(eventId, type) {
    const event = events.find(e => e.id === eventId);
    if (event) {
        event.sermons.push({
            id: sermonIdCounter++,
            type: type, // 台語/聯合 或 華語
            title: '',
            speaker: '',
            scripture: '',
            callToWorship: '',
            goldenVerse: '',
            hymns: '',
            description: ''
        });
        event.showSub = true;
        renderEvents();
        saveToLocalStorage();
    }
}

function deleteSermon(eventId, sermonId) {
    const event = events.find(e => e.id === eventId);
    if (event) {
        event.sermons = event.sermons.filter(s => s.id !== sermonId);
        renderEvents();
        saveToLocalStorage();
    }
}

function updateSermon(eventId, sermonId, field, value) {
    const event = events.find(e => e.id === eventId);
    if (event) {
        const sermon = event.sermons.find(s => s.id === sermonId);
        if (sermon) {
            sermon[field] = value;
            saveToLocalStorage();
        }
    }
}

// ====================
// 渲染所有聚會
// ====================
function renderEvents() {
    const container = document.getElementById('eventList');
    container.innerHTML = '';

    if (events.length === 0) {
        container.innerHTML = '<p class="loading">尚無聚會資料，請點擊「新增聚會」開始建立</p>';
        return;
    }

    events.forEach(event => {
        // 防呆：確保舊資料也有這兩個陣列
        const ministryItems = event.ministryItems || [];
        const sermons = event.sermons || [];

        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
            <div class="event-header">
                <div class="input-group">
                    <label>日期</label>
                    <input type="date" value="${event.date}" 
                           onchange="updateEvent(${event.id}, 'date', this.value)">
                </div>
                <div class="input-group">
                    <label>聚會名稱</label>
                    <input type="text" placeholder="輸入聚會名稱" value="${event.name}"
                           onchange="updateEvent(${event.id}, 'name', this.value)">
                </div>
                <div class="input-group">
                    <label>聚會類別</label>
                    <select onchange="updateEvent(${event.id}, 'category', this.value)">
                        <option ${event.category === '台華語聚會' ? 'selected' : ''}>台華語聚會</option>
                        <option ${event.category === '聯合聚會' ? 'selected' : ''}>聯合聚會</option>
                    </select>
                </div>
                <button class="btn btn-danger btn-small" onclick="deleteEvent(${event.id})">刪除</button>
            </div>
            
            <button class="btn toggle-sub btn-small" onclick="toggleSubItems(${event.id})">
                ${event.showSub ? '▼' : '▶'} 聚會詳情 (事工:${ministryItems.length} / 講道:${sermons.length})
            </button>
            
            <div class="sub-items ${event.showSub ? '' : 'hidden'}" style="display: flex; flex-direction: column; gap: 20px;">
                
                <div style="background: #fffafa; border: 1px solid #fed7d7; padding: 15px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #feb2b2; padding-bottom: 10px;">
                        <h4 style="margin: 0; color: #c53030;">📋 事工細項 </h4>
                        <button class="btn btn-primary btn-small" onclick="addMinistryItem(${event.id})" style="background: #c53030;">➕ 新增事工</button>
                    </div>
                    ${ministryItems.map(min => `
                        <div class="sub-item" style="display: flex; gap: 15px; align-items: flex-start; margin-bottom: 10px;">
                            <div class="input-group" style="flex: 1;">
                                <label>日期/期間</label>
                                <input type="text" placeholder="例: 3/15-3/30" value="${min.period || ''}" 
                                       onchange="updateMinistryItem(${event.id}, ${min.id}, 'period', this.value)">
                            </div>
                            <div class="input-group" style="flex: 2;">
                                <label>事工內容</label>
                                <input type="text" placeholder="詳細說明..." value="${min.content || ''}" 
                                       onchange="updateMinistryItem(${event.id}, ${min.id}, 'content', this.value)">
                            </div>
                            <button class="btn btn-danger btn-small" style="margin-top: 24px;" 
                                    onclick="deleteMinistryItem(${event.id}, ${min.id})">刪除</button>
                        </div>
                    `).join('')}
                </div>

                <div style="background: #f0f4f8; border: 1px solid #bee3f8; padding: 15px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #90cdf4; padding-bottom: 10px;">
                        <h4 style="margin: 0; color: #2b6cb0;">🎙️ 講道資訊 </h4>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-primary btn-small" onclick="addSermon(${event.id}, '台語/聯合')" style="background: #3182ce;">➕ 台語/聯合講道</button>
                            <button class="btn btn-primary btn-small" onclick="addSermon(${event.id}, '華語')" style="background: #38a169;">➕ 華語講道</button>
                        </div>
                    </div>
                    ${sermons.map(sermon => {
                        const isMandarin = sermon.type === '華語';
                        const hideStyle = isMandarin ? 'display: none;' : '';
                        const tagStyle = isMandarin ? 'background: #c6f6d5; color: #22543d;' : 'background: #bee3f8; color: #2a4365;';
                        
                        return `
                        <div class="sub-item" style="border-left: 4px solid ${isMandarin ? '#38a169' : '#3182ce'}; padding-left: 15px; margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span style="padding: 4px 10px; border-radius: 4px; font-size: 13px; font-weight: bold; ${tagStyle}">${sermon.type}</span>
                                <button class="btn btn-danger btn-small" onclick="deleteSermon(${event.id}, ${sermon.id})">刪除此講道</button>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;">
                                <div class="input-group">
                                    <label>講題</label>
                                    <input type="text" value="${sermon.title || ''}" onchange="updateSermon(${event.id}, ${sermon.id}, 'title', this.value)">
                                </div>
                                <div class="input-group">
                                    <label>講員</label>
                                    <input type="text" value="${sermon.speaker || ''}" onchange="updateSermon(${event.id}, ${sermon.id}, 'speaker', this.value)">
                                </div>
                                <div class="input-group">
                                    <label>經文</label>
                                    <input type="text" value="${sermon.scripture || ''}" onchange="updateSermon(${event.id}, ${sermon.id}, 'scripture', this.value)">
                                </div>
                                <div class="input-group">
                                    <label>宣召</label>
                                    <input type="text" value="${sermon.callToWorship || ''}" onchange="updateSermon(${event.id}, ${sermon.id}, 'callToWorship', this.value)">
                                </div>
                                <div class="input-group" style="${hideStyle}">
                                    <label>金句</label>
                                    <input type="text" value="${sermon.goldenVerse || ''}" onchange="updateSermon(${event.id}, ${sermon.id}, 'goldenVerse', this.value)">
                                </div>
                                <div class="input-group" style="${hideStyle}">
                                    <label>詩歌/聖詩</label>
                                    <input type="text" value="${sermon.hymns || ''}" onchange="updateSermon(${event.id}, ${sermon.id}, 'hymns', this.value)">
                                </div>
                            </div>

                            <div class="input-group" style="margin-top: 10px;">
                                <label>內容描述 / 備註</label>
                                <textarea placeholder="詳細說明..." style="min-height: 40px;"
                                          onchange="updateSermon(${event.id}, ${sermon.id}, 'description', this.value)">${sermon.description || ''}</textarea>
                            </div>
                        </div>
                    `}).join('')}
                </div>
                
            </div>
        `;
        container.appendChild(card);
    });
}

// 本地儲存
function saveToLocalStorage() {
    localStorage.setItem('churchEvents', JSON.stringify(events));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('churchEvents');
    if (saved) {
        events = JSON.parse(saved);
        eventIdCounter = Math.max(...events.map(e => e.id), 0) + 1;
        
        // 資料庫結構遷移防呆
        events.forEach(e => {
            if (!e.ministryItems) e.ministryItems = [];
            if (!e.sermons) e.sermons = [];
        });

        const allMinIds = events.flatMap(e => e.ministryItems.map(m => m.id));
        ministryIdCounter = Math.max(...allMinIds, 0) + 1;
        
        const allSermonIds = events.flatMap(e => e.sermons.map(s => s.id));
        sermonIdCounter = Math.max(...allSermonIds, 0) + 1;
    }
}

// 匯出 Excel (適應新結構)
function exportToExcel() {
    if (events.length === 0) {
        alert('沒有資料可以匯出');
        return;
    }

    let csv = '\uFEFF';
    csv += '日期,聚會名稱,聚會類別,分類,細項日期/期間,內容/講題,講員,經文,宣召,金句,詩歌,備註\n';

    events.forEach(event => {
        const hasMinistry = event.ministryItems && event.ministryItems.length > 0;
        const hasSermons = event.sermons && event.sermons.length > 0;

        if (!hasMinistry && !hasSermons) {
            csv += `${event.date},"${event.name}","${event.category}",,,,,,,,,\n`;
        } else {
            if (hasMinistry) {
                event.ministryItems.forEach(min => {
                    csv += `${event.date},"${event.name}","${event.category}","籌備事工","${min.period || ''}","${min.content || ''}",,,,,,,\n`;
                });
            }
            if (hasSermons) {
                event.sermons.forEach(sermon => {
                    csv += `${event.date},"${event.name}","${event.category}","講道(${sermon.type})",,"${sermon.title || ''}","${sermon.speaker || ''}","${sermon.scripture || ''}","${sermon.callToWorship || ''}","${sermon.goldenVerse || ''}","${sermon.hymns || ''}","${(sermon.description || '').replace(/\n/g, ' ')}"\n`;
                });
            }
        }
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `教會行事曆_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 儲存到 GAS
async function saveToGAS() {
    if (!GAS_URL || GAS_URL === 'YOUR_GAS_WEB_APP_URL_HERE') {
        alert('請先設定 GAS_URL');
        return;
    }

    const saveBtn = document.querySelector('button[onclick="saveToGAS()"]');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '⏳ 儲存中...';
    saveBtn.disabled = true;
    saveBtn.style.opacity = '0.7';
    saveBtn.style.cursor = 'not-allowed';

    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'save',
                data: events
            })
        });
        alert('資料已儲存到雲端！');
    } catch (error) {
        console.error('儲存失敗:', error);
        alert('儲存失敗，請檢查網路連線');
    } finally {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
        saveBtn.style.opacity = '1';
        saveBtn.style.cursor = 'pointer';
    }
}

// 從 GAS 載入
async function loadFromGAS() {
    if (!GAS_URL || GAS_URL === 'YOUR_GAS_WEB_APP_URL_HERE') {
        alert('請先設定 GAS_URL');
        return;
    }

    const loadBtn = document.querySelector('button[onclick="loadFromGAS()"]');
    const originalText = loadBtn.innerHTML;
    loadBtn.innerHTML = '⏳ 載入中...';
    loadBtn.disabled = true;
    loadBtn.style.opacity = '0.7';
    loadBtn.style.cursor = 'not-allowed';

    try {
        const response = await fetch(`${GAS_URL}?action=load`);
        const data = await response.json();
        if (data.success && data.events) {
            events = data.events;
            loadFromLocalStorage(); // 重新計算 Counter 確保正確
            renderEvents();
            saveToLocalStorage();
            alert('資料已從雲端載入！');
        }
    } catch (error) {
        console.error('載入失敗:', error);
        alert('載入失敗，請檢查網路連線');
    } finally {
        loadBtn.innerHTML = originalText;
        loadBtn.disabled = false;
        loadBtn.style.opacity = '1';
        loadBtn.style.cursor = 'pointer';
    }
}

// === 批量新增功能 ===
let selectedWeekdays = new Set();
let previewDates = [];

function openBatchModal() {
    document.getElementById('batchModal').classList.remove('hidden');
    document.getElementById('batchStartDate').value = '';
    document.getElementById('batchEndDate').value = '';
    document.getElementById('batchName').value = '';
    document.getElementById('batchCategory').value = '台華語聚會';
    selectedWeekdays.clear();
    previewDates = [];
    
    document.querySelectorAll('.weekday-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById('datePreview').innerHTML = '請選擇日期區間和星期';
    document.getElementById('datePreview').classList.remove('has-dates');
}

function closeBatchModal() {
    document.getElementById('batchModal').classList.add('hidden');
}

function toggleWeekday(day) {
    if (selectedWeekdays.has(day)) {
        selectedWeekdays.delete(day);
    } else {
        selectedWeekdays.add(day);
    }
    
    const btn = document.querySelector(`.weekday-btn[data-day="${day}"]`);
    btn.classList.toggle('active');
}

function previewBatchDates() {
    const startDate = document.getElementById('batchStartDate').value;
    const endDate = document.getElementById('batchEndDate').value;
    
    if (!startDate || !endDate) {
        alert('請選擇開始和結束日期');
        return;
    }
    
    if (selectedWeekdays.size === 0) {
        alert('請至少選擇一個星期');
        return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
        alert('開始日期不能晚於結束日期');
        return;
    }
    
    previewDates = [];
    const current = new Date(start);
    
    while (current <= end) {
        const dayOfWeek = current.getDay();
        if (selectedWeekdays.has(dayOfWeek)) {
            previewDates.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
    }
    
    const previewDiv = document.getElementById('datePreview');
    if (previewDates.length === 0) {
        previewDiv.innerHTML = '在選定的日期區間內，沒有符合條件的日期';
        previewDiv.classList.remove('has-dates');
    } else {
        const weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];
        let html = `<div class="preview-count">共 ${previewDates.length} 個日期</div>`;
        
        previewDates.forEach(date => {
            const dateStr = date.toISOString().split('T')[0];
            const dayName = weekdayNames[date.getDay()];
            html += `<span class="preview-date-item">${dateStr} (${dayName})</span>`;
        });
        
        previewDiv.innerHTML = html;
        previewDiv.classList.add('has-dates');
    }
}

function confirmBatchAdd() {
    const name = document.getElementById('batchName').value.trim();
    const category = document.getElementById('batchCategory').value;
    
    if (previewDates.length === 0) {
        alert('請先預覽日期，確認有可新增的日期');
        return;
    }
    
    let addedCount = 0;
    previewDates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        const exists = events.some(e => e.date === dateStr && e.name === name);
        
        if (!exists) {
            events.push({
                id: eventIdCounter++,
                date: dateStr,
                name: name,
                category: category,
                ministryItems: [],
                sermons: [],
                showSub: false
            });
            addedCount++;
        }
    });
    
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    renderEvents();
    saveToLocalStorage();
    closeBatchModal();
    
    alert(`成功新增 ${addedCount} 個聚會！${previewDates.length - addedCount > 0 ? '\n(' + (previewDates.length - addedCount) + ' 個重複的聚會已略過)' : ''}`);
}

// === AI 批量匯入講道功能 ===
let parsedAiData = [];

// 根據選取的講道類別更新 AI 提示詞
function updateAiPrompt() {
    const category = document.getElementById('aiCategory').value;
    const promptEl = document.getElementById('aiPrompt');
    
    let basePrompt = `你是一個教會行政助理。請將以下牧師提供的講道資訊，轉換為嚴格的 JSON 格式陣列。
請自動判斷年份，若無標示年份請預設為今年。
請依照以下格式輸出（只輸出 JSON，不要包含 \`\`\`json 標籤或其他說明文字）：
[
  {
    "date": "YYYY-MM-DD",
    "eventName": "特別聚會名稱 (如: 復活節聯合禮拜、母親節，若無則留空)",
    "speaker": "講員 (若無則留空)",
    "title": "講題 (去掉中括號【】，若無則留空)",
    "scripture": "經文內容，若無則留空",
    "callToWorship": "宣召內容，若無則留空"`;

    if (category === '台語/聯合') {
        basePrompt += `,\n    "goldenVerse": "金句內容",\n    "hymns": "聖詩/回應詩內容"\n  }\n]`;
    } else {
        basePrompt += `\n  }\n]`;
    }
    
    promptEl.value = basePrompt;
}

function openAiImportModal() {
    document.getElementById('aiImportModal').classList.remove('hidden');
    document.getElementById('aiCategory').value = '台語/聯合'; // 預設類別
    updateAiPrompt(); // 初始化提示詞
    document.getElementById('aiRawText').value = '';
    document.getElementById('aiPreview').innerHTML = '請輸入文字並點擊「開始解析」';
    document.getElementById('aiPreview').classList.remove('has-dates');
    document.getElementById('btnConfirmAi').disabled = true;
    parsedAiData = [];
}

function closeAiImportModal() {
    document.getElementById('aiImportModal').classList.add('hidden');
}

// 統整背景點擊關閉視窗邏輯
function closeModalOnBackdrop(event) {
    if (event.target.id === 'batchModal') {
        closeBatchModal();
    } else if (event.target.id === 'singleEventModal') {
        closeSingleEventModal();
    } else if (event.target.id === 'aiImportModal') {
        closeAiImportModal();
    }
}

// 傳送資料給後端進行 AI 解析
async function processAiText() {
    if (!GAS_URL || GAS_URL === 'YOUR_GAS_WEB_APP_URL_HERE') {
        alert('請先設定 GAS_URL');
        return;
    }

    const rawText = document.getElementById('aiRawText').value.trim();
    const prompt = document.getElementById('aiPrompt').value.trim();
    const previewDiv = document.getElementById('aiPreview');
    const confirmBtn = document.getElementById('btnConfirmAi');

    if (!rawText) {
        alert('請先貼上牧師的原始文字');
        return;
    }

    previewDiv.innerHTML = '<div class="loading">⏳ AI 正在努力解析中，請稍候...</div>';
    confirmBtn.disabled = true;

    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            // 注意：這裡不加 mode: 'no-cors'，因為我們需要讀取回傳的 JSON
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', 
            },
            body: JSON.stringify({
                action: 'ai_parse',
                prompt: prompt,
                rawText: rawText
            })
        });

        const data = await response.json();

        if (data.success) {
            parsedAiData = JSON.parse(data.result);

            if (parsedAiData.length > 0) {
                let html = `<div class="preview-count">成功解析出 ${parsedAiData.length} 筆講道資訊</div>`;
                parsedAiData.forEach(item => {
                    html += `
                        <div class="sub-item" style="margin-top: 8px;">
                            <strong>📅 ${item.date} ${item.eventName ? `(${item.eventName})` : ''}</strong><br>
                            <span style="color: #667eea; font-weight:bold;">${item.title || '(無標題)'}</span>
                            ${item.speaker ? `<span style="color: #e53e3e;"> - ${item.speaker}</span>` : ''}<br>
                            <div style="font-size: 13px; color: #718096; margin-top: 4px; line-height: 1.5;">
                                ${item.scripture ? `📖 經文：${item.scripture}<br>` : ''}
                                ${item.callToWorship ? `📣 宣召：${item.callToWorship}<br>` : ''}
                                ${item.goldenVerse ? `⭐ 金句：${item.goldenVerse}<br>` : ''}
                                ${item.hymns ? `🎵 詩歌：${item.hymns}` : ''}
                            </div>
                        </div>`;
                });
                previewDiv.innerHTML = html;
                previewDiv.classList.add('has-dates');
                confirmBtn.disabled = false;
            } else {
                previewDiv.innerHTML = '無法解析出有效資訊，請調整提示詞或檢查原始文字。';
            }
        } else {
            throw new Error(data.error || '後端回傳未知的錯誤');
        }

    } catch (error) {
        console.error('AI 解析錯誤:', error);
        previewDiv.innerHTML = `<span style="color: #e53e3e;">❌ 解析失敗，請確認資料格式或聯絡管理員。(${error.message})</span>`;
    }
}

// 寫入行事曆
function confirmAiImport() {
    if (parsedAiData.length === 0) return;

    // 取得使用者在 AI 視窗選擇的語言類別
    const selectedLanguage = document.getElementById('aiCategory').value;
    let addedCount = 0;

    parsedAiData.forEach(aiItem => {
        let targetEvent = events.find(e => e.date === aiItem.date);
        
        let finalEventName = '主日崇拜';
        let eventCategory = '台華語聚會'; // 預設為台華語聚會

        if (aiItem.eventName) {
            finalEventName += ` (${aiItem.eventName})`;
            // 智慧判斷：如果名稱有聯合，自動切換為聯合聚會
            if (aiItem.eventName.includes('聯合')) {
                eventCategory = '聯合聚會';
            }
        }

        if (!targetEvent) {
            targetEvent = {
                id: eventIdCounter++,
                date: aiItem.date,
                name: finalEventName,
                category: eventCategory,
                ministryItems: [],
                sermons: [],
                showSub: true
            };
            events.push(targetEvent);
        } else {
            targetEvent.showSub = true; 
            if (aiItem.eventName && targetEvent.name === '主日崇拜') {
                targetEvent.name = finalEventName;
            }
            if (aiItem.eventName && aiItem.eventName.includes('聯合')) {
                targetEvent.category = '聯合聚會';
            }
        }

        // 寫入為「講道」資料 (放入 sermons 陣列)
        targetEvent.sermons.push({
            id: sermonIdCounter++,
            type: selectedLanguage, // 台語/聯合 或 華語
            title: aiItem.title || '',
            speaker: aiItem.speaker || '',
            scripture: aiItem.scripture || '',
            callToWorship: aiItem.callToWorship || '',
            goldenVerse: aiItem.goldenVerse || '',
            hymns: aiItem.hymns || '',
            description: ''
        });
        
        addedCount++;
    });

    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    renderEvents();
    saveToLocalStorage();
    closeAiImportModal();

    alert(`✅ 成功將 ${addedCount} 筆講道資訊整合進行事曆！`);
}
