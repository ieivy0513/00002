document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('name');
    const genderSelect = document.getElementById('gender');
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    const ageInput = document.getElementById('age');
    const calculateBtn = document.getElementById('calculateBtn');
    const bmiValueSpan = document.getElementById('bmiValue');
    const bmiCategorySpan = document.getElementById('bmiCategory');
    const bmiStandardNote = document.getElementById('bmiStandardNote');
    const adviceDiv = document.getElementById('advice');
    const showRecordsBtn = document.getElementById('showRecordsBtn');
    const recordsSection = document.getElementById('recordsSection'); // 整個紀錄區塊
    const recordsList = document.getElementById('recordsList');
    const clearRecordsBtn = document.getElementById('clearRecordsBtn');
    const body = document.body;

    let currentUser = '';

    // --- 頁面載入時的初始化邏輯 ---
    updateBackground('default'); // 預設背景

    const lastUserName = localStorage.getItem('lastUserName');
    if (lastUserName) {
        nameInput.value = lastUserName;
        currentUser = lastUserName;
    }

    // **新增：初始檢查名字並控制紀錄區塊顯示**
    checkNameAndToggleRecordsSection();

    // --- 事件監聽器 ---
    calculateBtn.addEventListener('click', calculateAndSaveBMI);
    showRecordsBtn.addEventListener('click', toggleRecordsSectionVisibility); // 修改為獨立的顯示/隱藏切換
    clearRecordsBtn.addEventListener('click', clearUserRecords);
    
    // **新增：監聽名字輸入框的變化**
    nameInput.addEventListener('input', checkNameAndToggleRecordsSection);

    // --- 核心功能函數 ---

    function checkNameAndToggleRecordsSection() {
        const name = nameInput.value.trim();
        if (name) {
            // 如果有名字，顯示查看紀錄按鈕和紀錄區塊（但紀錄區塊預設是隱藏的，要按按鈕才顯示）
            showRecordsBtn.classList.remove('hidden');
            // 我們不直接顯示 recordsSection，而是讓 showRecordsBtn 來控制
        } else {
            // 如果沒有名字，隱藏查看紀錄按鈕和整個紀錄區塊
            showRecordsBtn.classList.add('hidden');
            recordsSection.classList.add('hidden');
            recordsList.innerHTML = '<p>請在上方輸入您的名字，才能查看您的專屬紀錄。</p>';
        }
    }

    function toggleRecordsSectionVisibility() { // 新增的函數，專門處理紀錄區塊的顯示/隱藏
        // 確保在點擊時，如果名字欄位為空，仍然不顯示紀錄
        if (!nameInput.value.trim()) {
            alert('請先輸入您的名字，才能查看或管理歷史紀錄。');
            recordsSection.classList.add('hidden'); // 確保隱藏
            return;
        }

        recordsSection.classList.toggle('hidden');
        if (!recordsSection.classList.contains('hidden')) {
            currentUser = nameInput.value.trim();
            displayUserRecords(); // 顯示時才重新載入紀錄
        }
    }

    function calculateAndSaveBMI() {
        const name = nameInput.value.trim();
        const gender = genderSelect.value;
        const heightCm = parseFloat(heightInput.value);
        const weightKg = parseFloat(weightInput.value);
        const age = parseInt(ageInput.value);

        if (isNaN(heightCm) || isNaN(weightKg) || isNaN(age) || heightCm <= 0 || weightKg <= 0 || age <= 0) {
            alert('請輸入有效的身高 (公分)、體重 (公斤) 和年齡 (正整數)！');
            resetResultDisplay();
            updateBackground('default');
            return;
        }

        const heightM = heightCm / 100;
        const bmi = weightKg / (heightM * heightM);
        const roundedBMI = bmi.toFixed(2);

        bmiValueSpan.textContent = roundedBMI;
        const category = getBMICategory(roundedBMI, gender, age);
        bmiCategorySpan.textContent = category.text;
        bmiCategorySpan.style.color = category.color;
        bmiStandardNote.textContent = category.note;
        displayAdvice(category.text);
        updateBackgroundByBMICategory(category.text);

        if (!name) {
            alert('未填寫名字，本次 BMI 計算結果將不予紀錄。');
            return;
        }

        currentUser = name;
        localStorage.setItem('lastUserName', currentUser);

        const timestamp = new Date().getTime();
        const record = {
            id: timestamp,
            name: name,
            gender: gender,
            height: heightCm,
            weight: weightKg,
            age: age,
            bmi: roundedBMI,
            category: category.text,
            timestamp: timestamp,
            date: new Date().toLocaleString()
        };

        let allRecords = JSON.parse(localStorage.getItem('bmiRecords')) || {};
        if (!allRecords[currentUser]) {
            allRecords[currentUser] = [];
        }
        allRecords[currentUser].push(record);
        localStorage.setItem('bmiRecords', JSON.stringify(allRecords));

        alert('BMI 計算完成並已儲存紀錄！');
        // 計算並儲存後，確保紀錄區塊會顯示 (如果之前因沒名字被隱藏)
        checkNameAndToggleRecordsSection();
        displayUserRecords(); // 更新顯示紀錄
    }

    function resetResultDisplay() {
        bmiValueSpan.textContent = '--';
        bmiCategorySpan.textContent = '--';
        bmiCategorySpan.style.color = '';
        bmiStandardNote.textContent = '';
        adviceDiv.innerHTML = '';
    }

    function getBMICategory(bmi, gender, age) {
        let category = { text: '', color: '#333', note: '' };

        const adultStandards = {
            underweight: { min: 0, max: 18.5, text: '體重過輕', color: '#FFC107' },
            normal: { min: 18.5, max: 24, text: '健康體重', color: '#4CAF50' },
            overweight: { min: 24, max: 27, text: '體重過重', color: '#FF9800' },
            mildObesity: { min: 27, max: 30, text: '輕度肥胖', color: '#F44336' },
            moderateObesity: { min: 30, max: 35, text: '中度肥胖', color: '#D32F2F' },
            severeObesity: { min: 35, max: Infinity, text: '重度肥胖', color: '#B71C1C' }
        };

        if (age < 18) {
            category.text = '未成年人BMI評估較為複雜';
            category.color = '#607D8B';
            category.note = '未成年人的 BMI 標準需參考特定年齡和性別的生長曲線圖。此計算結果僅供參考，建議諮詢醫生。';
            if (bmi < 16) {
                category.text = '體重過輕 (未成年)';
                category.color = adultStandards.underweight.color;
            } else if (bmi >= 16 && bmi < 22) {
                category.text = '健康體重 (未成年)';
                category.color = adultStandards.normal.color;
            } else if (bmi >= 22 && bmi < 25) {
                category.text = '體重過重 (未成年)';
                category.color = adultStandards.overweight.color;
            } else {
                category.text = '肥胖 (未成年)';
                category.color = adultStandards.mildObesity.color;
            }

        } else if (age >= 18) {
            if (bmi < adultStandards.underweight.max) {
                category = adultStandards.underweight;
            } else if (bmi >= adultStandards.normal.min && bmi < adultStandards.normal.max) {
                category = adultStandards.normal;
            } else if (bmi >= adultStandards.overweight.min && bmi < adultStandards.overweight.max) {
                category = adultStandards.overweight;
            } else if (bmi >= adultStandards.mildObesity.min && bmi < adultStandards.mildObesity.max) {
                category = adultStandards.mildObesity;
            } else if (bmi >= adultStandards.moderateObesity.min && bmi < adultStandards.moderateObesity.max) {
                category = adultStandards.moderateObesity;
            } else {
                category = adultStandards.severeObesity;
            }
            category.note = '此標準參考台灣衛福部國民健康署成人BMI建議值。';
        }
        return category;
    }

    function displayAdvice(categoryText) {
        let adviceContent = '';
        switch (categoryText) {
            case '體重過輕':
            case '體重過輕 (未成年)':
                adviceContent = `
                    <h3>🍎 健康建議：體重過輕 🍎</h3>
                    <p>體重過輕可能導致營養不良、免疫力下降等問題，請重視您的健康。</p>
                    <ul>
                        <li><strong>均衡飲食：</strong> 選擇營養密度高的食物，如全穀類、優質蛋白質（雞蛋、豆製品、瘦肉）、健康脂肪（酪梨、堅果）。可以適量增加健康的卡路里攝取。</li>
                        <li><strong>少量多餐：</strong> 每天可以將三餐分拆成五到六餐，避免一次性攝入過多導致不適。</li>
                        <li><strong>適度肌力訓練：</strong> 透過重量訓練增加肌肉量，這比單純增加脂肪更能健康地增加體重。</li>
                        <li><strong>專業諮詢：</strong> 如果長時間體重過輕，建議諮詢醫生或營養師，排除潛在健康問題並獲得個人化建議。</li>
                    </ul>
                `;
                break;
            case '健康體重':
            case '健康體重 (未成年)':
                adviceContent = `
                    <h3>🎉 恭喜您！您的 BMI 落在健康體重範圍 🎉</h3>
                    <p>這表示您目前維持著非常理想的體重狀態，真是太棒了！</p>
                    <ul>
                        <li><strong>持續均衡飲食：</strong> 保持攝取足夠的蔬菜、水果、全穀類和健康蛋白質，維持良好的飲食習慣。</li>
                        <li><strong>維持規律運動：</strong> 建議每週進行至少 150 分鐘的中等強度有氧運動，並可搭配肌力訓練。</li>
                        <li><strong>樂活生活：</strong> 保持充足睡眠、有效管理壓力，享受健康積極的生活方式。</li>
                    </ul>
                    <p>請繼續保持這些好習慣，讓您的身體充滿活力！</p>
                `;
                break;
            case '體重過重':
            case '體重過重 (未成年)':
                adviceContent = `
                    <h3>🍏 健康建議：體重過重 🍏</h3>
                    <p>體重過重會增加罹患慢性疾病的風險，例如心血管疾病、糖尿病等，請開始為健康而努力！</p>
                    <ul>
                        <li><strong>調整飲食結構：</strong> 減少高熱量、高脂肪、高糖分的食物攝取，多選擇原型食物，如大量蔬菜、適量水果和優質蛋白質。</li>
                        <li><strong>增加日常活動量：：</strong> 建議每日至少進行 30 分鐘以上的中等強度有氧運動，例如快走、游泳、騎自行車。</li>
                        <li><strong>設定合理目標：：</strong> 以每週減輕 0.5 至 1 公斤為目標，循序漸進，長期堅持才能看到效果。</li>
                        <li><strong>尋求專業支持：：</strong> 考慮諮詢營養師或健身教練，制定適合您個人情況的減重計畫。</li>
                    </ul>
                `;
                break;
            case '輕度肥胖':
            case '中度肥胖':
            case '重度肥胖':
            case '肥胖 (未成年)':
                adviceContent = `
                    <h3>⚠️ 健康警示：肥胖 ⚠️</h3>
                    <p>肥胖對您的健康影響較大，可能顯著增加心血管疾病、糖尿病、高血壓及某些癌症的風險。是時候積極行動了！</p>
                    <ul>
                        <li><strong>嚴格飲食管理：</strong> 徹底檢視並調整飲食習慣，大幅減少加工食品、含糖飲料、油炸食物和高脂肪食物的攝取。優先選擇天然、低加工的食物。</li>
                        <li><strong>增加運動強度與頻率：：</strong> 建議每日進行至少 60 分鐘以上的中高強度有氧運動，並搭配肌力訓練，以加速脂肪燃燒和提升代謝。</li>
                        <li><strong>尋求醫療專業協助：：</strong> 強烈建議您諮詢醫生、營養師或專業體重管理中心，獲取最適合您的個人化減重方案、醫療評估及長期支持。</li>
                        <li><strong>耐心與堅持：：</strong> 減重是一個長期的過程，需要毅力和堅持。</li>
                    </ul>
                `;
                break;
            default:
                adviceContent = '';
                break;
        }
        adviceDiv.innerHTML = adviceContent;
    }

    function updateBackgroundByBMICategory(categoryText) {
        body.classList.remove('normal-background', 'overweight-background', 'underweight-background', 'default-background');

        if (categoryText.includes('健康體重')) {
            body.classList.add('normal-background');
        } else if (categoryText.includes('體重過重') || categoryText.includes('肥胖')) {
            body.classList.add('overweight-background');
        } else if (categoryText.includes('體重過輕')) {
            body.classList.add('underweight-background');
        } else {
            body.classList.add('default-background');
        }
    }

    function updateBackground(type) {
        body.classList.remove('default-background', 'normal-background', 'overweight-background', 'underweight-background');
        if (type === 'normal') {
            body.classList.add('normal-background');
        } else if (type === 'overweight') {
            body.classList.add('overweight-background');
        } else if (type === 'underweight') {
            body.classList.add('underweight-background');
        } else {
            body.classList.add('default-background');
        }
    }


    function displayUserRecords() {
        recordsList.innerHTML = '';
        const allRecords = JSON.parse(localStorage.getItem('bmiRecords')) || {};
        const userRecords = allRecords[currentUser] || [];

        if (!currentUser) {
            recordsList.innerHTML = '<p>請在上方輸入您的名字，以查看您的專屬紀錄。</p>';
            return;
        }

        if (userRecords.length === 0) {
            recordsList.innerHTML = '<p>您目前沒有任何 BMI 紀錄。</p>';
            return;
        }

        userRecords.sort((a, b) => b.timestamp - a.timestamp);

        userRecords.forEach(record => {
            const recordItem = document.createElement('div');
            recordItem.classList.add('record-item');
            recordItem.setAttribute('data-id', record.id);

            const now = new Date().getTime();
            const timeDiff = now - record.timestamp;
            const fifteenMinutes = 15 * 60 * 1000;
            const canEdit = timeDiff <= fifteenMinutes;

            recordItem.innerHTML = `
                <p><strong>紀錄時間：</strong> ${record.date}</p>
                <p><strong>姓名：</strong> ${record.name || '未填寫'}</p>
                <p><strong>性別：</strong> ${record.gender === 'male' ? '男性' : '女性'}</p>
                <p><strong>身高：</strong> ${record.height} 公分</p>
                <p><strong>體重：</strong> ${record.weight} 公斤</p>
                <p><strong>年齡：</strong> ${record.age} 歲</p>
                <p><strong>BMI：</strong> <span style="color:${getBMICategory(record.bmi, record.gender, record.age).color}">${record.bmi}</span></p>
                <p><strong>類別：</strong> <span style="color:${getBMICategory(record.bmi, record.gender, record.age).color}">${record.category}</span></p>
                <div class="record-actions">
                    ${canEdit ? `<button class="edit-btn" data-id="${record.id}">修改</button>` : `<button class="edit-btn disabled" disabled title="已超過15分鐘修改時限">修改</button>`}
                    <button class="delete-btn" data-id="${record.id}">刪除</button>
                </div>
            `;
            recordsList.appendChild(recordItem);
        });

        document.querySelectorAll('.edit-btn:not(.disabled)').forEach(button => {
            button.addEventListener('click', editRecord);
        });
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', deleteRecord);
        });
    }

    function editRecord(event) {
        const recordId = parseInt(event.target.dataset.id);
        let allRecords = JSON.parse(localStorage.getItem('bmiRecords')) || {};
        let userRecords = allRecords[currentUser] || [];
        const recordToEdit = userRecords.find(rec => rec.id === recordId);

        if (recordToEdit) {
            const now = new Date().getTime();
            const timeDiff = now - recordToEdit.timestamp;
            const fifteenMinutes = 15 * 60 * 1000;

            if (timeDiff > fifteenMinutes) {
                alert('已超過 15 分鐘的修改時限，無法修改此紀錄。');
                return;
            }

            nameInput.value = recordToEdit.name;
            genderSelect.value = recordToEdit.gender;
            heightInput.value = recordToEdit.height;
            weightInput.value = recordToEdit.weight;
            ageInput.value = recordToEdit.age;

            userRecords = userRecords.filter(rec => rec.id !== recordId);
            allRecords[currentUser] = userRecords;
            localStorage.setItem('bmiRecords', JSON.stringify(allRecords));

            alert('紀錄數據已填充到輸入框，請修改後重新計算並儲存！');
            displayUserRecords();
        }
    }

    function deleteRecord(event) {
        const recordId = parseInt(event.target.dataset.id);
        if (confirm('確定要刪除這筆紀錄嗎？此操作無法恢復！')) {
            let allRecords = JSON.parse(localStorage.getItem('bmiRecords')) || {};
            let userRecords = allRecords[currentUser] || [];
            allRecords[currentUser] = userRecords.filter(rec => rec.id !== recordId);
            localStorage.setItem('bmiRecords', JSON.stringify(allRecords));
            displayUserRecords();
            alert('紀錄已刪除。');
        }
    }

    function clearUserRecords() {
        if (confirm('確定要清除所有您目前的紀錄嗎？此操作無法恢復！')) {
            let allRecords = JSON.parse(localStorage.getItem('bmiRecords')) || {};
            delete allRecords[currentUser];
            localStorage.setItem('bmiRecords', JSON.stringify(allRecords));
            displayUserRecords();
            alert('您的所有紀錄已清除。');
        }
    }
});