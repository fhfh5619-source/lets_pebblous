const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const DATA_FILE = path.join(__dirname, 'applications.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 폴더 자동 매핑
app.use(express.static(path.join(__dirname, 'Pebble')));
app.use(express.static(path.join(__dirname, 'pebble')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// 파일 찾는 헬퍼 함수
function getFilePath(filename) {
  const candidates = [
    path.join(__dirname, 'Pebble', filename),
    path.join(__dirname, 'pebble', filename),
    path.join(__dirname, 'public', filename),
    path.join(__dirname, filename)
  ];
  return candidates.find(p => fs.existsSync(p));
}

// 1. 메인 홈페이지 (index.html)
app.get('/', (req, res) => {
  const file = getFilePath('index.html');
  if (file) return res.sendFile(file);
  res.send('index.html을 찾을 수 없습니다.');
});

// 2. 스모어 스타일 연말 이벤트 페이지 (/event)
app.get('/event', (req, res) => {
  const file = getFilePath('event.html');
  if (file) return res.sendFile(file);
  res.send('event.html을 찾을 수 없습니다.');
});

// JSON 데이터 파일 초기화
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
}

// [API] 진단 신청 데이터 저장
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

// 3. 관리자 페이지 (/admin)
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
      <style>body{font-family:sans-serif;padding:30px;background:#f5f5f7}table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.05)}th,td{padding:14px;border-bottom:1px solid #eee;text-align:left}th{background:#f0f2f5}</style>
      </head><body>
      <h2>🪨 pebblous 연말 진단 신청자 명단 (총 ${list.length}명)</h2>
      <table><thead><tr><th>No</th><th>이름</th><th>연락처</th><th>MBTI</th><th>체형/골격</th><th>퍼스널컬러</th><th>접수시간</th></tr></thead><tbody>${rows || '<tr><td colspan="7">접수된 데이터가 없습니다.</td></tr>'}</tbody></table>
      </body></html>
    `);
  } catch (err) {
    res.status(500).send('조회 오류');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
