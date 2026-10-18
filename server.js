const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
// Render 환경 변수 PORT를 반드시 사용해야 배포가 완료됩니다.
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'applications.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// JSON 데이터 파일 초기화
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
}

// 신청 접수 API
app.post('/api/diagnosis', (req, res) => {
  try {
    const { name, phone, mbti, skeleton, color, preference } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: '이름과 연락처를 입력해주세요.' });
    }

    const newEntry = {
      id: Date.now(),
      name,
      phone,
      mbti,
      skeleton,
      color,
      preference,
      createdAt: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
    };

    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    const applications = JSON.parse(rawData);
    applications.push(newEntry);

    fs.writeFileSync(DATA_FILE, JSON.stringify(applications, null, 2), 'utf-8');
    console.log(`[접수 완료] ${name} - ${mbti}`);

    return res.status(200).json({ success: true, message: '성공적으로 접수되었습니다.' });
  } catch (error) {
    console.error('저장 에러:', error);
    return res.status(500).json({ success: false, message: '서버 에러 발생' });
  }
});

// 관리자용 신청자 조회
app.get('/api/admin/applications', (req, res) => {
  try {
    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    const applications = JSON.parse(rawData);
    res.json({ count: applications.length, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: '조회 실패' });
  }
});

// 0.0.0.0 호스트로 열어주어야 Render 외부 네트워크 감지가 정상 작동합니다.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`pebblous server is active on port ${PORT}`);
});