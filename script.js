// 全域變數
let events = [];
let eventIdCounter = 1;
let subItemIdCounter = 1;

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
        subItems: [],
        showSub: false
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

// 新增子項目
function addSubItem(eventId) {
    const event = events.find(e => e.id === eventId);
    if (event) {
        event.subItems.push({
            id: subItemIdCounter++,
            date: new Date().toISOString().split('T')[0],
            item: '',
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

// 刪除子項目
function deleteSubItem(eventId, subId) {
    const event = events.find(e => e.id === eventId);
    if (event) {
        event.subItems = event.subItems.filter(s => s.id !== subId);
        renderEvents();
        saveToLocalStorage();
    }
}

// 更新子項目
function updateSubItem(eventId, subId, field, value) {
    const event = events.find(e => e.id === eventId);
    if (event) {
        const subItem = event.subItems.find(s => s.id === subId);
        if (subItem) {
            subItem[field] = value;
            saveToLocalStorage();
            // 如果更改的是事工名稱且包含「華語」，重新渲染以更新對應的欄位隱藏狀態
            if (field === 'item') {
                renderEvents();
            }
        }
    }
}

// 渲染所有聚會
function renderEvents() {
    const container = document.getElementById('eventList');
    container.innerHTML = '';

    if (events.length === 0) {
        container.innerHTML = '<p class="loading">尚無聚會資料，請點擊「新增聚會」開始建立</p>';
        return;
    }

    events.forEach(event => {
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
                ${event.showSub ? '▼' : '▶'} 細項事工 (${event.subItems.length})
            </button>
            
            <div class="sub-items ${event.showSub ? '' : 'hidden'}">
                <button class="btn btn-primary btn-small" onclick="addSubItem(${event.id})" 
                        style="margin-bottom: 15px;">➕ 新增事工/講道</button>
                ${event.subItems.map(sub => {
                    // 根據【細項的事工項目】名稱是否包含「華語」來決定隱藏欄位
                    const isMandarin = sub.item.includes('華語');
                    const hideStyle = isMandarin ? 'display: none;' : '';
                    
                    return `
                    <div class="sub-item">
                        <div style="display: flex; gap: 15px; align-items: flex-end; margin-bottom: 10px;">
                            <div class="input-group" style="flex: 1;">
                                <label>日期</label>
                                <input type="date" value="${sub.date}"
                                       onchange="updateSubItem(${event.id}, ${sub.id}, 'date', this.value)">
                            </div>
                            <div class="input-group" style="flex: 2;">
                                <label>事工項目 (如: 信息分享(華語))</label>
                                <input type="text" placeholder="例: 信息分享(華語)"
                                       value="${sub.item}"
                                       onchange="updateSubItem(${event.id}, ${sub.id}, 'item', this.value)">
                            </div>
                            <button class="btn btn-danger btn-small" style="height: 38px;"
                                    onclick="deleteSubItem(${event.id}, ${sub.id})">刪除</button>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; padding: 10px; background: #f8fafc; border-radius: 6px; border: 1px dashed #cbd5e0;">
                            <div class="input-group">
                                <label>講題</label>
                                <input type="text" value="${sub.title || ''}" onchange="updateSubItem(${event.id}, ${sub.id}, 'title', this.value)">
                            </div>
                            <div class="input-group">
                                <label>講員</label>
                                <input type="text" value="${sub.speaker || ''}" onchange="updateSubItem(${event.id}, ${sub.id}, 'speaker', this.value)">
                            </div>
                            <div class="input-group">
                                <label>經文</label>
                                <input type="text" value="${sub.scripture || ''}" onchange="updateSubItem(${event.id}, ${sub.id}, 'scripture', this.value)">
                            </div>
                            <div class="input-group">
                                <label>宣召</label>
                                <input type="text" value="${sub.callToWorship || ''}" onchange="updateSubItem(${event.id}, ${sub.id}, 'callToWorship', this.value)">
                            </div>
                            <div class="input-group" style="${hideStyle}">
                                <label>金句</label>
                                <input type="text" value="${sub.goldenVerse || ''}" onchange="updateSubItem(${event.id}, ${sub.id}, 'goldenVerse', this.value)">
                            </div>
                            <div class="input-group" style="${hideStyle}">
                                <label>詩歌/聖詩</label>
                                <input type="text" value="${sub.hymns || ''}" onchange="updateSubItem(${event.id}, ${sub.id}, 'hymns', this.value)">
                            </div>
                        </div>

                        <div class="input-group" style="margin-top: 10px;">
                            <label>內容描述 / 備註</label>
                            <textarea placeholder="詳細說明..." style="min-height: 40px;"
                                      onchange="updateSubItem(${event.id}, ${sub.id}, 'description', this.value)">${sub.description || ''}</textarea>
                        </div>
                    </div>
                `}).join('')}
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
        const allSubIds = events.flatMap(e => e.subItems.map(s => s.id));
        subItemIdCounter = Math.max(...allSubIds, 0) + 1;
    }
}

// 匯出 Excel
function exportToExcel() {
    if (events.length === 0) {
        alert('沒有資料可以匯出');
        return;
    }

    let csv = '\uFEFF';
    csv += '日期,聚會名稱,聚會類別,細項日期,事工項目,講題,講員,經文,宣召,金句,詩歌,備註\n';

    events.forEach(event => {
        if (event.subItems.length === 0) {
            csv += `${event.date},"${event.name}","${event.category}",,,,,,,,,\n`;
        } else {
            event.subItems.forEach(sub => {
                csv += `${event.date},"${event.name}","${event.category}",${sub.date},"${sub.item}","${sub.title || ''}","${sub.speaker || ''}","${sub.scripture || ''}","${sub.callToWorship || ''}","${sub.goldenVerse || ''}","${sub.hymns || ''}","${(sub.description || '').replace(/\n/g, ' ')}"\n`;
            });
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
            eventIdCounter = Math.max(...events.map(e => e.id), 0) + 1;
            const allSubIds = events.flatMap(e => e.subItems.map(s => s.id));
            subItemIdCounter = Math.max(...allSubIds, 0) + 1;
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
                subItems: [],
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
                subItems: [],
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

        // 將事工項目名稱自動標註語言 (例如: 信息分享(華語))，這會觸發前端的隱藏欄位邏輯
        const itemLabel = selectedLanguage === '華語' ? '信息分享(華語)' : '信息分享(台語/聯合)';

        targetEvent.subItems.push({
            id: subItemIdCounter++,
            date: aiItem.date,
            item: itemLabel, 
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
