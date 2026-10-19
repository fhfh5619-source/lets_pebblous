const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const DATA_FILE = path.join(__dirname, 'applications.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// [핵심] 프로젝트 내 모든 하위 폴더를 뒤져서 파일을 찾아내는 재귀 함수
function findFileEverywhere(dir, targetFile) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file === 'node_modules' || file === '.git') continue; // 제외할 폴더
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const found = findFileEverywhere(fullPath, targetFile);
        if (found) return found;
      } else if (file.toLowerCase() === targetFile.toLowerCase()) {
        return fullPath; // 대소문자 무시하고 일치하면 반환
      }
    }
  } catch (err) {
    return null;
  }
  return null;
}

// 현재 폴더 구조 전체 목록을 문자열로 가져오는 디버깅 함수
function getAllFiles(dir, prefix = '') {
  let result = [];
  try {
    const list = fs.readdirSync(dir);
    for (const item of list) {
      if (item === 'node_modules' || item === '.git') continue;
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        result.push(`📁 ${prefix}${item}/`);
        result = result.concat(getAllFiles(full, prefix + '   '));
      } else {
        result.push(`📄 ${prefix}${item}`);
      }
    }
  } catch (e) {}
  return result;
}

// 모든 정적 폴더 등록
app.use(express.static(__dirname));
try {
  fs.readdirSync(__dirname).forEach(file => {
    const full = path.join(__dirname, file);
    if (fs.statSync(full).isDirectory() && file !== 'node_modules') {
      app.use(express.static(full));
    }
  });
} catch (e) {}

// 1. 메인 페이지 (/)
app.get('/', (req, res) => {
  const filePath = findFileEverywhere(__dirname, 'index.html');
  if (filePath) {
    return res.sendFile(filePath);
  }
  
  // 못 찾았을 경우 현재 존재하는 파일 구조를 친절하게 출력
  const fileTree = getAllFiles(__dirname).join('<br>');
  res.send(`
    <div style="font-family:sans-serif; padding:40px; line-height:1.8;">
      <h2>⚠️ index.html 파일을 찾을 수 없습니다.</h2>
      <p>현재 서버에 업로드되어 있는 파일 목록입니다:</p>
      <div style="background:#f4f4f4; padding:20px; border-radius:12px; font-family:monospace;">
        ${fileTree || '파일이 없습니다.'}
      </div>
      <p style="color:#666; margin-top:15px;">위 목록에 index.html 파일이 있는지 확인해 주세요!</p>
    </div>
  `);
});

// 2. 이벤트 페이지 (/event)
app.get('/event', (req, res) => {
  const filePath = findFileEverywhere(__dirname, 'event.html');
  if (filePath) {
    return res.sendFile(filePath);
  }
  
  const fileTree = getAllFiles(__dirname).join('<br>');
  res.send(`
    <div style="font-family:sans-serif; padding:40px; line-height:1.8;">
      <h2>⚠️ event.html 파일을 찾을 수 없습니다.</h2>
      <p>현재 서버에 업로드되어 있는 파일 목록입니다:</p>
      <div style="background:#f4f4f4; padding:20px; border-radius:12px; font-family:monospace;">
        ${fileTree || '파일이 없습니다.'}
      </div>
    </div>
  `);
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
  console.log(`Pebble 서버가 ${PORT} 포트에서 정상 작동 중입니다.`);
});
