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
                        style="margin-bottom: 15px;">➕ 新增細項</button>
                ${event.subItems.map(sub => `
                    <div class="sub-item">
                        <div class="sub-item-row">
                            <div class="input-group">
                                <label>日期</label>
                                <input type="date" value="${sub.date}"
                                       onchange="updateSubItem(${event.id}, ${sub.id}, 'date', this.value)">
                            </div>
                            <div class="input-group">
                                <label>事工項目</label>
                                <input type="text" placeholder="例: 詩歌敬拜"
                                       value="${sub.item}"
                                       onchange="updateSubItem(${event.id}, ${sub.id}, 'item', this.value)">
                            </div>
                            <div class="input-group">
                                <label>內容描述</label>
                                <textarea placeholder="詳細說明..."
                                          onchange="updateSubItem(${event.id}, ${sub.id}, 'description', this.value)">${sub.description}</textarea>
                            </div>
                            <button class="btn btn-danger btn-small" 
                                    onclick="deleteSubItem(${event.id}, ${sub.id})">刪除</button>
                        </div>
                    </div>
                `).join('')}
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

    // 建立 CSV 內容
    let csv = '\uFEFF'; // UTF-8 BOM
    csv += '日期,聚會名稱,聚會類別,細項日期,事工項目,事工內容描述\n';

    events.forEach(event => {
        if (event.subItems.length === 0) {
            csv += `${event.date},"${event.name}","${event.category}",,,\n`;
        } else {
            event.subItems.forEach(sub => {
                csv += `${event.date},"${event.name}","${event.category}",${sub.date},"${sub.item}","${sub.description}"\n`;
            });
        }
    });

    // 下載檔案
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

    // 取得按鈕並改變狀態為「儲存中」
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
        // 無論成功或失敗，都恢復按鈕原本的狀態
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

    // 取得按鈕並改變狀態為「載入中」
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
        // 無論成功或失敗，都恢復按鈕原本的狀態
        loadBtn.innerHTML = originalText;
        loadBtn.disabled = false;
        loadBtn.style.opacity = '1';
        loadBtn.style.cursor = 'pointer';
    }
}

// === 批量新增功能 ===
let selectedWeekdays = new Set();
let previewDates = [];

// 開啟批量新增對話框
function openBatchModal() {
    document.getElementById('batchModal').classList.remove('hidden');
    // 重置表單
    document.getElementById('batchStartDate').value = '';
    document.getElementById('batchEndDate').value = '';
    document.getElementById('batchName').value = '';
    document.getElementById('batchCategory').value = '台華語聚會';
    selectedWeekdays.clear();
    previewDates = [];
    
    // 重置星期按鈕
    document.querySelectorAll('.weekday-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById('datePreview').innerHTML = '請選擇日期區間和星期';
    document.getElementById('datePreview').classList.remove('has-dates');
}

// 關閉批量新增對話框
function closeBatchModal() {
    document.getElementById('batchModal').classList.add('hidden');
}

// 點擊背景關閉對話框
function closeModalOnBackdrop(event) {
    if (event.target.id === 'batchModal') {
        closeBatchModal();
    } else if (event.target.id === 'singleEventModal') {
        closeSingleEventModal();
    }
}

// 切換星期選擇
function toggleWeekday(day) {
    if (selectedWeekdays.has(day)) {
        selectedWeekdays.delete(day);
    } else {
        selectedWeekdays.add(day);
    }
    
    // 更新按鈕樣式
    const btn = document.querySelector(`.weekday-btn[data-day="${day}"]`);
    btn.classList.toggle('active');
}

// 預覽將要新增的日期
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
    
    // 計算符合條件的日期
    previewDates = [];
    const current = new Date(start);
    
    while (current <= end) {
        const dayOfWeek = current.getDay();
        if (selectedWeekdays.has(dayOfWeek)) {
            previewDates.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
    }
    
    // 顯示預覽
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

// 確認批量新增
function confirmBatchAdd() {
    const name = document.getElementById('batchName').value.trim();
    const category = document.getElementById('batchCategory').value;
    
    if (previewDates.length === 0) {
        alert('請先預覽日期，確認有可新增的日期');
        return;
    }
    
    // 批量建立聚會
    let addedCount = 0;
    previewDates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        
        // 檢查是否已存在相同日期和名稱的聚會（名稱可為空）
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
    
    // 依日期排序
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    renderEvents();
    saveToLocalStorage();
    closeBatchModal();
    
    alert(`成功新增 ${addedCount} 個聚會！${previewDates.length - addedCount > 0 ? '\n(' + (previewDates.length - addedCount) + ' 個重複的聚會已略過)' : ''}`);
}
