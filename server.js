const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
// Render 기본 포트 10000 사용
const PORT = process.env.PORT || 10000;
const DATA_FILE = path.join(__dirname, 'applications.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1) public 폴더 안이든, 바깥 루트 폴더든 둘 다 찾을 수 있게 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// 2) 메인 주소(/)로 접속 시 index.html을 강제로 띄워주기
app.get('/', (req, res) => {
  const publicHtml = path.join(__dirname, 'public', 'index.html');
  const rootHtml = path.join(__dirname, 'index.html');

  if (fs.existsSync(publicHtml)) {
    return res.sendFile(publicHtml);
  } else if (fs.existsSync(rootHtml)) {
    return res.sendFile(rootHtml);
  } else {
    res.send('index.html 파일을 찾을 수 없습니다. GitHub에 index.html 파일이 있는지 확인해주세요!');
  }
});

// JSON 데이터 파일 초기화
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
}

// 신청 접수 API
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

// 0.0.0.0과 10000 포트로 확실하게 열기
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
