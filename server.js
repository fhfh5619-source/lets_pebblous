const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const DATA_FILE = path.join(__dirname, 'winter_applications.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 파일 탐색 헬퍼
function findFile(dir, target) {
  try {
    const list = fs.readdirSync(dir);
    for (const f of list) {
      if (f === 'node_modules' || f === '.git') continue;
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) {
        const res = findFile(full, target);
        if (res) return res;
      } else if (f.toLowerCase() === target.toLowerCase()) {
        return full;
      }
    }
  } catch (e) {}
  return null;
}

// 정적 파일 등록
app.use(express.static(__dirname));
try {
  fs.readdirSync(__dirname).forEach(file => {
    const full = path.join(__dirname, file);
    if (fs.statSync(full).isDirectory() && file !== 'node_modules') app.use(express.static(full));
  });
} catch (e) {}

// 라우팅
app.get('/', (req, res) => {
  const f = findFile(__dirname, 'index.html');
  if (f) return res.sendFile(f);
  res.send('index.html을 찾을 수 없습니다.');
});

app.get('/test', (req, res) => {
  const f = findFile(__dirname, 'test.html');
  if (f) return res.sendFile(f);
  res.send('test.html을 찾을 수 없습니다.');
});

app.get('/event', (req, res) => {
  const f = findFile(__dirname, 'event.html');
  if (f) return res.sendFile(f);
  res.send('event.html을 찾을 수 없습니다.');
});

// 데이터 파일 초기화
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
}

// [API] 겨울 스타일링 신청 접수
app.post('/api/winter-consulting', (req, res) => {
  try {
    const data = req.body;
    const newEntry = {
      id: Date.now(),
      ...data,
      createdAt: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
    };

    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const list = JSON.parse(raw);
    list.push(newEntry);
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');

    console.log(`[겨울 컨설팅 신청] ${data.name} (${data.preferredStyle})`);
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

// [관리자] 신청자 현황 조회 (/admin)
app.get('/admin', (req, res) => {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const list = JSON.parse(raw);

    const rows = list.map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${item.name}</strong><br><small><a href="tel:${item.phone}">${item.phone}</a></small></td>
        <td><span style="background:#4A6B82; color:#fff; padding:3px 8px; border-radius:6px; font-weight:bold;">${item.preferredStyle}</span></td>
        <td>${(item.worries || []).join(', ')}<br><small style="color:#777;">${item.worryDetail || ''}</small></td>
        <td><strong>컬러:</strong> ${item.color || '-'}<br><strong>무드:</strong> ${item.mood || '-'}</td>
        <td>${(item.importances || []).join(', ')}</td>
        <td><small style="color:#888;">${item.createdAt}</small></td>
      </tr>
    `).join('');

    res.send(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>lets_pebblous 관리자</title>
      <style>
        body { font-family: -apple-system, sans-serif; padding: 30px; background: #f5f5f7; }
        .box { background: #fff; padding: 25px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; font-size: 13.5px; }
        th { background: #f0f2f5; }
      </style>
      </head><body>
      <div class="box">
        <h2>❄️ lets_pebblous 겨울 스타일링 컨설팅 신청 명단 (총 ${list.length}명)</h2>
        <table>
          <thead><tr><th>No</th><th>이름/연락처</th><th>선호 스타일</th><th>겨울 패션 고민</th><th>컬러 & 무드</th><th>중요 가치</th><th>접수일시</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="7" style="text-align:center; padding:30px;">신청자가 아직 없습니다.</td></tr>'}</tbody>
        </table>
      </div>
      </body></html>
    `);
  } catch (err) {
    res.status(500).send('조회 오류');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
