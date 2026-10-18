const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const DATA_FILE = path.join(__dirname, 'applications.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pebble 폴더, pebble(소문자) 폴더, 루트 폴더 모두 정적 파일 경로로 등록
app.use(express.static(path.join(__dirname, 'Pebble')));
app.use(express.static(path.join(__dirname, 'pebble')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// 사용자가 접속했을 때 index.html을 모든 폴더에서 뒤져서 찾아내기
app.get('/', (req, res) => {
  const possiblePaths = [
    path.join(__dirname, 'Pebble', 'index.html'),
    path.join(__dirname, 'pebble', 'index.html'),
    path.join(__dirname, 'public', 'index.html'),
    path.join(__dirname, 'index.html')
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  }

  res.send('HTML 파일을 찾는 중 오류가 발생했습니다. Pebble 폴더 안에 index.html 파일명이 정확한지 확인해주세요.');
});

// 신청 데이터 파일 생성
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
}

// 진단 신청 API
app.post('/api/diagnosis', (req, res) => {
  try {
    const { name, phone, mbti, skeleton, color } = req.body;
    const newEntry = {
      id: Date.now(),
      name, phone, mbti, skeleton, color,
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Pebble 서버가 ${PORT}번 포트에서 정상 작동 중입니다!`);
});
