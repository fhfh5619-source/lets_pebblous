const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 10000;
const DATA_FILE = path.join(__dirname, 'winter_applications.json');

// ⭐️ 방금 복사한 구글 앱스 스크립트 웹앱 URL을 따옴표 안에 넣어주세요!
const GOOGLE_SHEET_WEBHOOK_URL = process.env.GOOGLE_SHEET_URL || "여기에_구글_웹앱_URL_붙여넣기";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙
app.use(express.static(__dirname));
try {
  fs.readdirSync(__dirname).forEach(file => {
    const full = path.join(__dirname, file);
    if (fs.statSync(full).isDirectory() && file !== 'node_modules') app.use(express.static(full));
  });
} catch (e) {}

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

// 구글 시트로 데이터 쏘는 함수
function sendToGoogleSheet(data) {
  if (!GOOGLE_SHEET_WEBHOOK_URL || GOOGLE_SHEET_WEBHOOK_URL.includes("여기에_구글")) {
    console.log("[Google Sheets] 웹훅 URL이 아직 설정되지 않아 로컬 파일에만 저장합니다.");
    return;
  }

  const payload = JSON.stringify(data);
  const url = new URL(GOOGLE_SHEET_WEBHOOK_URL);

  const req = https.request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, (res) => {
    // 리다이렉트(302) 처리
    if (res.statusCode === 302 && res.headers.location) {
      https.get(res.headers.location);
    }
  });

  req.on('error', (e) => console.error('[Google Sheets 전송 에러]', e.message));
  req.write(payload);
  req.end();
}

// 1. 라우팅
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

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
}

// 2. 겨울 스타일링 컨설팅 이벤트 API
app.post('/api/winter-consulting', (req, res) => {
  try {
    const entry = {
      id: Date.now(),
      type: "겨울스타일링이벤트",
      ...req.body,
      createdAt: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
    };

    // 로컬 파일 저장
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const list = JSON.parse(raw);
    list.push(entry);
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');

    // 🚀 구글 스프레드시트로 실시간 자동 전송
    sendToGoogleSheet(entry);

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

// 3. MBTI 테스트 진단 API
app.post('/api/diagnosis', (req, res) => {
  try {
    const entry = {
      id: Date.now(),
      type: "패션MBTI테스트",
      ...req.body,
      createdAt: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
    };

    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const list = JSON.parse(raw);
    list.push(entry);
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');

    // 🚀 구글 스프레드시트로 실시간 자동 전송
    sendToGoogleSheet(entry);

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

// 관리자 백업 뷰어 (/admin)
app.get('/admin', (req, res) => {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const list = JSON.parse(raw);
    const rows = list.map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${item.name || '-'}</strong><br><small>${item.phone || '-'}</small></td>
        <td><span style="background:#4A6B82; color:#fff; padding:3px 8px; border-radius:6px; font-weight:bold;">${item.preferredStyle || item.mbti || '-'}</span></td>
        <td>${(item.worries || []).join(', ')} ${item.worryDetail || ''}</td>
        <td>컬러: ${item.color || '-'} / 무드: ${item.mood || item.skeleton || '-'}</td>
        <td><small style="color:#888;">${item.createdAt}</small></td>
      </tr>
    `).join('');

    res.send(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>lets_pebblous 신청 현황</title>
      <style>body{font-family:sans-serif;padding:30px;background:#f5f5f7}table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;}th,td{padding:12px;border-bottom:1px solid #eee;font-size:13px;}th{background:#f0f2f5}</style>
      </head><body>
      <h2>❄️ lets_pebblous 실시간 접수 현황 (총 ${list.length}명)</h2>
      <p style="color:#666;">💡 구글 스프레드시트에서도 실시간으로 확인하실 수 있습니다.</p>
      <table><thead><tr><th>No</th><th>신청자/연락처</th><th>스타일/MBTI</th><th>고민내용</th><th>컬러 및 무드</th><th>접수일시</th></tr></thead><tbody>${rows || '<tr><td colspan="6">데이터가 없습니다.</td></tr>'}</tbody></table>
      </body></html>
    `);
  } catch (err) {
    res.status(500).send('조회 오류');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
