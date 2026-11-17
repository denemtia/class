// 모든 페이지가 함께 쓰는 설정과 Firebase 연결
// 데이터 구조
//   pub/<선생님 uid>      선생님 공개 설정: name, school, title, sub, theme, avatars[], apps[]
//   mine/<선생님 uid>     내 반 목록: <교실 코드> = 반 이름
//   rooms/<교실 코드>     owner(선생님 uid), cls(반 이름), plan(자리배치), gate(문 열림), players(접속 학생)
const SITE_URL = "https://denemtia.github.io/class/";
// Firebase 웹 설정(공개값, 비밀 아님). 보안은 DB 규칙과 로그인으로 지킴
const FIREBASE = {apiKey: "AIzaSyC6mT6KbaC02xbAyU4PtikM4HxJp_UOL7M", authDomain: "class-hub-85cff.firebaseapp.com", projectId: "class-hub-85cff", appId: "1:662011086407:web:64c2f6a93750303982d362",
  databaseURL: "https://class-hub-85cff-default-rtdb.asia-southeast1.firebasedatabase.app"};
const AVATARS_ALL = ["🧑‍🎓", "🐱", "🐶", "🐰", "🦊", "🐻", "🐧", "🤖", "🐼", "🐯", "🐸", "🦁", "🐵", "🐨", "🦄", "🐙"];
const THEMES = {green: "#2f5d48", black: "#2b2d2f", blue: "#24476b"};
const MAX_APPS = 12, MAX_ROOMS = 12;

// 주소의 ?room=코드 (영소문자·숫자 6자)
const ROOM = (new URLSearchParams(location.search).get("room") || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6);
const roomUrl = code => `${SITE_URL}?room=${code}`;

// 저장소·네트워크에서 온 선생님 설정은 믿지 않고 여기서 걸러 냄 (학생 화면에 그대로 나오므로)
const str = (v, n) => typeof v === "string" ? v.trim().slice(0, n) : "";
const httpsUrl = v => { try { const u = new URL(str(v, 300)); return u.protocol === "https:" ? u.href : ""; } catch { return ""; } };
function cleanPub(v) {
  v = v || {};
  const avatars = Object.values(v.avatars || {}).filter(a => AVATARS_ALL.includes(a));
  return {
    name: str(v.name, 20), school: str(v.school, 30), title: str(v.title, 30), sub: str(v.sub, 60),
    theme: THEMES[v.theme] ? v.theme : "green",
    avatars: avatars.length ? [...new Set(avatars)] : AVATARS_ALL.slice(0, 8),
    apps: Object.values(v.apps || {}).slice(0, MAX_APPS).map(a => ({title: str(a && a.title, 20), emoji: str(a && a.emoji, 12) || "📎", url: httpsUrl(a && a.url), desc: str(a && a.desc, 200)})).filter(a => a.title),
  };
}

// Firebase 연결(한 번만). 이미 로그인돼 있으면 그 계정을 그대로 씀
let fbReady;
function fb() {
  return fbReady ||= (async () => {
    const V = "https://www.gstatic.com/firebasejs/10.12.2/";
    const [{initializeApp}, db, au] = await Promise.all([import(V + "firebase-app.js"), import(V + "firebase-database.js"), import(V + "firebase-auth.js")]);
    const app = initializeApp(FIREBASE), auth = au.getAuth(app);
    await auth.authStateReady();
    return {db, au, auth, d: db.getDatabase(app)};
  })();
}
const isTeacher = u => !!u && !u.isAnonymous;
