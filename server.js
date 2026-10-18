const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const DATA_FILE = path.join(__dirname, 'applications.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 폴더 경로 자동 서빙
app.use(express.static(path.join(__dirname, 'Pebble')));
app.use(express.static(path.join(__dirname, 'pebble')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// 메인 웹사이트 서빙
app.get('/', (req, res) => {
  const possiblePaths = [
    path.join(__dirname, 'Pebble', 'index.html'),
    path.join(__dirname, 'pebble', 'index.html'),
    path.join(__dirname, 'public', 'index.html'),
    path.join(__dirname, 'index.html')
  ];
  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) return res.sendFile(filePath);
  }
  res.send('index.html을 찾는 중입니다. 잠시 후 새로고침 해주세요.');
});

// JSON 데이터 파일 초기화
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
}

// [API] 신청 접수
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

    console.log(`[신규 신청] ${name} (${phone})`);
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

// ==========================================
// 👑 [관리자 전용 대시보드 화면] - /admin
// ==========================================
app.get('/admin', (req, res) => {
  try {
    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    const list = JSON.parse(rawData);

    // 테이블 행 HTML 생성
    const rows = list.map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${item.name}</strong></td>
        <td><a href="tel:${item.phone}">${item.phone}</a></td>
        <td><span class="badge badge-mbti">${item.mbti}</span></td>
        <td>${item.skeleton}</td>
        <td>${item.color}</td>
        <td style="color:#777; font-size:12px;">${item.createdAt}</td>
      </tr>
    `).join('');

    const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>pebblous 신청자 관리자 페이지</title>
      <style>
        body { font-family: -apple-system, sans-serif; background: #f8f9fa; margin: 0; padding: 40px 20px; }
        .container { max-width: 1000px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        h1 { margin-top: 0; font-size: 22px; color: #222; }
        .count-box { background: #E8ECEF; color: #4A6B82; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 14px; display: inline-block; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #eee; font-size: 14px; }
        th { background: #f4f5f7; color: #555; }
        tr:hover { background: #fafafa; }
        .badge { padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 12px; }
        .badge-mbti { background: #E3F2FD; color: #1976D2; }
        .btn-refresh { padding: 8px 16px; background: #222; color: #fff; border: none; border-radius: 8px; cursor: pointer; float: right; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <button class="btn-refresh" onclick="location.reload()">새로고침 🔄</button>
        <h1>🪨 pebblous 연말 이벤트 신청자 현황</h1>
        <div class="count-box">총 신청자: ${list.length}명</div>
        
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>이름</th>
              <th>연락처</th>
              <th>MBTI</th>
              <th>체형/골격</th>
              <th>퍼스널컬러</th>
              <th>신청일시</th>
            </tr>
          </thead>
          <tbody>
            ${list.length > 0 ? rows : '<tr><td colspan="7" style="text-align:center; padding:30px; color:#999;">아직 접수된 신청 내역이 없습니다.</td></tr>'}
          </tbody>
        </table>
      </div>
    </body>
    </html>
    `;

    res.send(html);
  } catch (err) {
    res.status(500).send('데이터를 불러오지 못했습니다.');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Pebble 서버가 ${PORT}번 포트에서 정상 작동 중입니다!`);
});
