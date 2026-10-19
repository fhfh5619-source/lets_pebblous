const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const DATA_FILE = path.join(__dirname, 'applications.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 파일 재귀 탐색 함수
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

// 정적 파일 연결
app.use(express.static(__dirname));
try {
  fs.readdirSync(__dirname).forEach(file => {
    const full = path.join(__dirname, file);
    if (fs.statSync(full).isDirectory() && file !== 'node_modules') app.use(express.static(full));
  });
} catch (e) {}

// 1. 메인 홈 (/)
app.get('/', (req, res) => {
  const f = findFile(__dirname, 'index.html');
  if (f) return res.sendFile(f);
  res.send('index.html을 찾을 수 없습니다.');
});

// 2. 패션 MBTI 테스트 (/test)
app.get('/test', (req, res) => {
  const f = findFile(__dirname, 'test.html');
  if (f) return res.sendFile(f);
  res.send('test.html을 찾을 수 없습니다.');
});

// 3. 연말 이벤트 신청 (/event)
app.get('/event', (req, res) => {
  const f = findFile(__dirname, 'event.html');
  if (f) return res.sendFile(f);
  res.send('event.html을 찾을 수 없습니다.');
});

// JSON 파일 초기화
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
}

// 신청 접수 API
app.post('/api/diagnosis', (req, res) => {
  try {
    const { name, phone, mbti, skeleton, color } = req.body;
    const newEntry = {
      id: Date.now(),
      name: name || '익명',
      phone: phone || '-',
      mbti: mbti || '-',
      skeleton: skeleton || '-',
      color: color || '-',
      createdAt: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
    };

    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    const applications = JSON.parse(rawData);
    applications.push(newEntry);
    fs.writeFileSync(DATA_FILE, JSON.stringify(applications, null, 2), 'utf-8');

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

// 관리자 페이지 (/admin)
app.get('/admin', (req, res) => {
  try {
    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    const list = JSON.parse(rawData);
    const rows = list.map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${item.name}</strong></td>
        <td>${item.phone}</td>
        <td><b style="color:#4A6B82">${item.mbti}</b></td>
        <td>${item.skeleton}</td>
        <td>${item.color}</td>
        <td style="color:#888; font-size:12px;">${item.createdAt}</td>
      </tr>
    `).join('');

    res.send(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>pebblous 관리자</title>
      <style>body{font-family:sans-serif;padding:30px;background:#f5f5f7}table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.05)}th,td{padding:14px;border-bottom:1px solid #eee;text-align:left}th{background:#f0f2f5}</style>
      </head><body>
      <h2>🪨 pebblous 신청자 명단 (총 ${list.length}명)</h2>
      <table><thead><tr><th>No</th><th>이름</th><th>연락처</th><th>MBTI</th><th>체형/골격</th><th>퍼스널컬러</th><th>접수시간</th></tr></thead><tbody>${rows || '<tr><td colspan="7">신청 내역이 없습니다.</td></tr>'}</tbody></table>
      </body></html>
    `);
  } catch (err) {
    res.status(500).send('조회 오류');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
