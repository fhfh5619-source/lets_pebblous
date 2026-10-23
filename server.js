const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sonyangi777";

// ★ 발급받으신 구글 시트 웹 앱 URL을 여기에 따옴표 안에 붙여넣으세요!
const GOOGLE_SHEET_URL = process.env.GOOGLE_SHEET_URL || "";

// 관리자 풀이서 데이터베이스
const REPORT_DB = {
  "CAT1": `[반듯냥 심층 솔루션]\n• 핵심 심리: 완벽하지 않으면 비난받을 것이라는 무의식적 불안이 있습니다.\n• 반복되는 고민: "왜 다들 나만큼 책임감이 없을까?" 속으로 분노를 삭이다 냉소적으로 변하기 쉽습니다.\n• 연애/관계: 정직하고 헌신적이나, 상대방에게 내 기준을 엄격히 강요해 피로감을 줍니다.\n• 솔루션: '완벽함'보다 '충분히 좋음'을 받아들이고 스스로에게 따뜻한 칭찬을 건네보세요.`,
  "CAT2": `[다정냥 심층 솔루션]\n• 핵심 심리: 남에게 필요한 존재가 되지 못하면 사랑받지 못할 것이라는 불안이 있습니다.\n• 반복되는 고민: "내가 이만큼 챙겨줬는데 왜 상대는 몰라줄까?" 서운함이 쌓여 번아웃이 옵니다.\n• 연애/관계: 모든 걸 맞춰주다 상대에게 과의존하거나 감정적으로 통제하려 듭니다.\n• 솔루션: 남을 돕기 전에 "지금 내가 진짜 원하는 것은 무엇인가?"를 먼저 물어보세요.`,
  "CAT3": `[반짝냥 심층 솔루션]\n• 핵심 심리: 인정받지 못하면 무가치하다는 내면의 성취 강박이 있습니다.\n• 반복되는 고민: "뒤처지면 어쩌지?" 감정을 억누르고 일에만 몰두하다 공허감이 찾아옵니다.\n• 연애/관계: 유능해 보이지만, 약점이나 솔직한 아픔을 털어놓지 못해 진솔한 교감이 어렵습니다.\n• 솔루션: 아무것도 성취하지 않은 '나 자신'도 온전히 사랑받을 자격이 있음을 기억하세요.`,
  "CAT4": `[몽상냥 심층 솔루션]\n• 핵심 심리: 나를 온전히 이해해주는 사람이 없다는 결핍감과 고유성에 대한 집착이 있습니다.\n• 반복되는 고민: 감정의 기복으로 인해 일상의 리듬이 쉽게 깨지고 혼자만의 우울에 빠집니다.\n• 연애/관계: 드라마틱한 교감을 원하지만, 사소한 현실 마찰에 깊이 상처받고 문을 닫습니다.\n• 솔루션: 감정의 소용돌이에서 벗어나 현실적인 루틴(산책, 작은 과업 완료)을 몸으로 실천하세요.`,
  "CAT5": `[탐구냥 심층 솔루션]\n• 핵심 심리: 준비되지 않은 채 세상에 나서면 압도당할 것이라는 두려움 때문에 지식 속으로 숨습니다.\n• 반복되는 고민: 사람들과 어울리면 에너지가 고갈되어 고립을 자초하기 쉽습니다.\n• 연애/관계: 지나치게 이성적이고 차분하여 상대방에게 '벽이 느껴진다'는 말을 듣습니다.\n• 솔루션: 머리로만 분석하지 말고, 몸으로 직접 경험하고 느끼는 안전한 관계를 넓혀가세요.`,
  "CAT6": `[살핌냥 심층 솔루션]\n• 핵심 심리: 위험에 철저히 대비하지 않으면 무너질 수 있다는 불안이 깊습니다.\n• 반복되는 고민: 최악의 시나리오를 미리 그리느라 사소한 결정도 계속 미루게 됩니다.\n• 연애/관계: 믿음이 서기 전까진 상대를 끊임없이 시험하지만, 신뢰하면 끝까지 헌신합니다.\n• 솔루션: 세상은 생각보다 안전하며, 내면에도 문제를 해결할 힘이 있음을 신뢰하세요.`,
  "CAT7": `[두근냥 심층 솔루션]\n• 핵심 심리: 지루함과 고통을 회피하고 언제나 새롭고 신나는 자극만을 쫓으려 합니다.\n• 반복되는 고민: 시작은 즐거우나 끝까지 마무리가 안 되어 산만함과 자책으로 이어집니다.\n• 연애/관계: 유쾌한 분위기 메이커이지만, 진지하고 무거운 갈등 상황을 회피하려 합니다.\n• 솔루션: 현재 마주한 작은 지루함을 견디고, 하나를 끝까지 마무리하는 충만감을 느껴보세요.`,
  "CAT8": `[대장냥 심층 솔루션]\n• 핵심 심리: 약해지면 남들에게 조종당할 것이라는 두려움 때문에 강한 척 갑옷을 두릅니다.\n• 반복되는 고민: 직설적이고 통제하려는 태도로 인해 소중한 사람들과 갈등을 빚습니다.\n• 연애/관계: 내 사람이라 생각하면 헌신하지만, 주도권을 쥐려 해 상대방이 위축됩니다.\n• 솔루션: 나의 부드러운 속마음과 연약함을 솔직히 보여주는 것이 진짜 강함입니다.`,
  "CAT9": `[포근냥 심층 솔루션]\n• 핵심 심리: 갈등이 일어나면 평온이 파괴될 것이라는 두려움 때문에 침묵을 선택합니다.\n• 반복되는 고민: 좋은 게 좋은 거지 하다가 뒤늦게 후회하거나 수동적으로 고집을 부립니다.\n• 연애/관계: 상대에게 모든 걸 맞춰주지만, 진짜 속마음을 말하지 않아 답답함을 줍니다.\n• 솔루션: 내 솔직한 의견을 표현해도 관계는 깨지지 않습니다. 당당히 의사를 표현하세요.`
};

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'applications.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([]));

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 신청 접수 API
app.post('/api/apply', async (req, res) => {
  try {
    const { type, name, phone, email, story, resultTitle, resultCode, scores } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: '이름과 연락처를 입력해주세요.' });
    }

    // 1위 최고 점수 계산
    let topScore = 0;
    if (scores && typeof scores === 'object') {
      const scoreArr = Object.values(scores);
      if (scoreArr.length > 0) topScore = Math.max(...scoreArr);
    }

    // 고객 전송용 맞춤 풀이서 메시지 생성
    const reportText = REPORT_DB[resultCode] || "맞춤 풀이서 생성 대기 중입니다.";
    const fullMessage = `안녕하세요, ${name}님! 소냥이 포춘살롱입니다 💜\n신청해주신 [${resultTitle}]의 맞춤 심층 풀이 리포트를 보내드립니다.\n\n${reportText}\n\n고민하셨던 부분(${story || "내용 없음"})에 따뜻한 위로와 든든한 방향이 되길 바랍니다 ✨`;

    const newEntry = {
      id: Date.now(),
      type: type || '타로 심리 테스트',
      name,
      phone,
      email: email || '-',
      story: story || '없음',
      resultCode: resultCode || '',
      resultTitle: resultTitle || '미지정',
      topScore: topScore,
      scores: scores || null,
      fullMessage: fullMessage, // 관리자 및 구글시트용 풀이서 전문
      createdAt: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      status: '신청접수'
    };

    // 1. 구글 시트로 모든 정보 실시간 전송
    if (GOOGLE_SHEET_URL) {
      try {
        await fetch(GOOGLE_SHEET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEntry)
        });
      } catch (sheetErr) {
        console.error("구글 시트 연동 에러:", sheetErr.message);
      }
    }

    // 2. 관리자 웹페이지용 백업
    const currentData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    currentData.unshift(newEntry);
    fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 2));

    return res.json({ success: true, message: '신청이 정상적으로 완료되었습니다.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: '서버 에러가 발생했습니다.' });
  }
});

// 관리자 목록 조회
app.post('/api/admin/list', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: '비밀번호가 올바르지 않습니다.' });
  }
  const currentData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  res.json({ success: true, list: currentData });
});

// 상태 변경
app.post('/api/admin/update-status', (req, res) => {
  const { password, id, status } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: '인증 실패' });
  }
  const currentData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const target = currentData.find(item => item.id === id);
  if (target) {
    target.status = status;
    fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 2));
    return res.json({ success: true });
  }
  res.status(404).json({ success: false, message: '항목을 찾을 수 없습니다.' });
});

app.listen(PORT, () => {
  console.log(`🔮 소냥이 포춘살롱 서버 작동 중: http://localhost:${PORT}`);
});
