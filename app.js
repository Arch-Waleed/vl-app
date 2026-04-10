// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyDTVsWb0tYcbZB_RSSklO3td17hN36QqG4",
  authDomain: "vl-app-135e4.firebaseapp.com",
  projectId: "vl-app-135e4",
  storageBucket: "vl-app-135e4.firebasestorage.app",
  messagingSenderId: "689759592792",
  appId: "1:689759592792:web:c3289c27a6db63c627452d",
  databaseURL: "https://vl-app-135e4-default-rtdb.europe-west1.firebasedatabase.app"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.database();
let currentUser = null;
let currentUID = 'guest';
let dbListener = null;

// ثبّت الجلسة دائماً حتى بعد إغلاق التطبيق
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});

// ===== AUTH FUNCTIONS =====
function showLogin() {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('register-form').style.display = 'none';
}

function showRegister() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
}

async function loginUser() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl  = document.getElementById('login-error');
  const btn      = document.getElementById('login-btn');

  if (!email || !password) {
    errorEl.textContent = '⚠️ يرجى ملء جميع الحقول';
    errorEl.style.display = 'block';
    return;
  }

  btn.textContent = '⏳ جاري الدخول...';
  btn.disabled = true;
  errorEl.style.display = 'none';

  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (err) {
    let msg = '❌ خطأ في تسجيل الدخول';
    if (err.code === 'auth/user-not-found')    msg = '❌ البريد غير مسجّل';
    if (err.code === 'auth/wrong-password')    msg = '❌ كلمة السر غلط';
    if (err.code === 'auth/invalid-email')     msg = '❌ البريد غير صحيح';
    if (err.code === 'auth/invalid-credential') msg = '❌ البريد أو كلمة السر غلط';
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
    btn.textContent = 'تسجيل الدخول';
    btn.disabled = false;
  }
}

async function registerUser() {
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errorEl  = document.getElementById('reg-error');
  const btn      = document.getElementById('reg-btn');

  if (!name || !email || !password) {
    errorEl.textContent = '⚠️ يرجى ملء جميع الحقول';
    errorEl.style.display = 'block';
    return;
  }
  if (password.length < 6) {
    errorEl.textContent = '⚠️ كلمة السر 6 أحرف على الأقل';
    errorEl.style.display = 'block';
    return;
  }

  btn.textContent = '⏳ جاري التسجيل...';
  btn.disabled = true;
  errorEl.style.display = 'none';

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: name });
  } catch (err) {
    let msg = '❌ خطأ في التسجيل';
    if (err.code === 'auth/email-already-in-use') msg = '❌ البريد مسجّل مسبقاً';
    if (err.code === 'auth/invalid-email')        msg = '❌ البريد غير صحيح';
    if (err.code === 'auth/weak-password')        msg = '❌ كلمة السر ضعيفة جداً';
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
    btn.textContent = 'إنشاء الحساب';
    btn.disabled = false;
  }
}

async function logoutUser() {
  if (confirm('هل تريد تسجيل الخروج؟')) {
    await auth.signOut();
  }
}

// مراقبة حالة الدخول
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    currentUID  = user.uid;
    // Update navbar with user name
    const title = document.getElementById('home-nav-title');
    if (title) title.textContent = `VL — ${user.displayName || user.email.split('@')[0]}`;
    loadState();
    renderHome();
    showScreen('home');
    switchTab('home');
  } else {
    currentUser = null;
    currentUID  = 'guest';
    showScreen('auth');
  }
});

// ===== DATA =====
const words = [
  // أساسيات
  { german: 'Hallo', arabic: 'مرحباً', present: 'Ich sage Hallo zu meinem Freund.', past: 'Ich habe Hallo zu ihm gesagt.', category: 'أساسيات', emoji: '⭐' },
  { german: 'Ja', arabic: 'نعم', present: 'Ich sage ja zu diesem Vorschlag.', past: 'Er hat ja zu allem gesagt.', category: 'أساسيات', emoji: '⭐' },
  { german: 'Nein', arabic: 'لا', present: 'Sie sagt nein zu dieser Idee.', past: 'Er hat nein gesagt und ist gegangen.', category: 'أساسيات', emoji: '⭐' },
  { german: 'Bitte', arabic: 'من فضلك / عفواً', present: 'Ich bitte dich um Hilfe.', past: 'Er hat mich um Hilfe gebeten.', category: 'أساسيات', emoji: '⭐' },
  { german: 'Danke', arabic: 'شكراً', present: 'Ich danke dir für alles.', past: 'Sie hat mir für das Geschenk gedankt.', category: 'أساسيات', emoji: '⭐' },
  { german: 'Entschuldigung', arabic: 'آسف / معذرة', present: 'Ich entschuldige mich für den Fehler.', past: 'Er hat sich bei ihr entschuldigt.', category: 'أساسيات', emoji: '⭐' },

  // تحيات
  { german: 'Guten Morgen', arabic: 'صباح الخير', present: 'Ich wünsche dir einen guten Morgen.', past: 'Er hat ihr guten Morgen gewünscht.', category: 'تحيات', emoji: '👋' },
  { german: 'Guten Tag', arabic: 'مرحباً / طاب يومك', present: 'Wir sagen Guten Tag zum Chef.', past: 'Sie hat Guten Tag gesagt und sich gesetzt.', category: 'تحيات', emoji: '👋' },
  { german: 'Guten Abend', arabic: 'مساء الخير', present: 'Er sagt Guten Abend zu den Gästen.', past: 'Wir haben Guten Abend gesagt.', category: 'تحيات', emoji: '👋' },
  { german: 'Gute Nacht', arabic: 'تصبح على خير', present: 'Ich wünsche dir eine gute Nacht.', past: 'Mama hat uns gute Nacht gewünscht.', category: 'تحيات', emoji: '👋' },
  { german: 'Auf Wiedersehen', arabic: 'مع السلامة', present: 'Ich sage Auf Wiedersehen und gehe.', past: 'Er hat Auf Wiedersehen gesagt und ist gefahren.', category: 'تحيات', emoji: '👋' },
  { german: 'Tschüss', arabic: 'باي', present: 'Sie sagt Tschüss und läuft weg.', past: 'Wir haben Tschüss gesagt und sind gegangen.', category: 'تحيات', emoji: '👋' },

  // الأسرة
  { german: 'die Familie', arabic: 'الأسرة', present: 'Meine Familie wohnt in Berlin.', past: 'Seine Familie hat früher in Hamburg gewohnt.', category: 'الأسرة', emoji: '👨‍👩‍👧‍👦' },
  { german: 'der Vater', arabic: 'الأب', present: 'Mein Vater arbeitet jeden Tag.', past: 'Mein Vater hat gestern viel gearbeitet.', category: 'الأسرة', emoji: '👨‍👩‍👧‍👦' },
  { german: 'die Mutter', arabic: 'الأم', present: 'Meine Mutter kocht jeden Abend.', past: 'Meine Mutter hat gestern Suppe gekocht.', category: 'الأسرة', emoji: '👨‍👩‍👧‍👦' },
  { german: 'der Bruder', arabic: 'الأخ', present: 'Mein Bruder spielt Fußball.', past: 'Mein Bruder hat gestern Fußball gespielt.', category: 'الأسرة', emoji: '👨‍👩‍👧‍👦' },
  { german: 'die Schwester', arabic: 'الأخت', present: 'Meine Schwester studiert Medizin.', past: 'Meine Schwester hat letztes Jahr studiert.', category: 'الأسرة', emoji: '👨‍👩‍👧‍👦' },
  { german: 'das Kind', arabic: 'الطفل', present: 'Das Kind spielt im Garten.', past: 'Das Kind hat den ganzen Tag gespielt.', category: 'الأسرة', emoji: '👨‍👩‍👧‍👦' },
  { german: 'der Freund', arabic: 'الصديق', present: 'Mein Freund hilft mir immer.', past: 'Mein Freund hat mir gestern geholfen.', category: 'الأسرة', emoji: '👨‍👩‍👧‍👦' },

  // طعام
  { german: 'das Essen', arabic: 'الطعام', present: 'Das Essen schmeckt sehr gut.', past: 'Das Essen hat heute gut geschmeckt.', category: 'طعام', emoji: '🍽️' },
  { german: 'das Wasser', arabic: 'الماء', present: 'Ich trinke jeden Tag viel Wasser.', past: 'Er hat nach dem Sport viel Wasser getrunken.', category: 'طعام', emoji: '🍽️' },
  { german: 'das Brot', arabic: 'الخبز', present: 'Ich kaufe frisches Brot beim Bäcker.', past: 'Sie hat heute Morgen Brot gekauft.', category: 'طعام', emoji: '🍽️' },
  { german: 'der Kaffee', arabic: 'القهوة', present: 'Ich trinke jeden Morgen Kaffee.', past: 'Er hat heute drei Tassen Kaffee getrunken.', category: 'طعام', emoji: '🍽️' },
  { german: 'der Tee', arabic: 'الشاي', present: 'Sie trinkt abends immer Tee.', past: 'Wir haben zusammen Tee getrunken.', category: 'طعام', emoji: '🍽️' },
  { german: 'das Fleisch', arabic: 'اللحم', present: 'Er kauft frisches Fleisch vom Markt.', past: 'Wir haben gestern Fleisch gegessen.', category: 'طعام', emoji: '🍽️' },
  { german: 'das Gemüse', arabic: 'الخضروات', present: 'Ich esse täglich Gemüse.', past: 'Sie hat gestern frisches Gemüse gekocht.', category: 'طعام', emoji: '🍽️' },
  { german: 'der Apfel', arabic: 'التفاحة', present: 'Ich esse jeden Tag einen Apfel.', past: 'Das Kind hat den ganzen Apfel gegessen.', category: 'طعام', emoji: '🍽️' },

  // ألوان
  { german: 'rot', arabic: 'أحمر', present: 'Das Auto ist rot und sehr schön.', past: 'Die Rose war rot und wunderschön.', category: 'ألوان', emoji: '🎨' },
  { german: 'blau', arabic: 'أزرق', present: 'Der Himmel ist heute blau.', past: 'Das Meer war gestern sehr blau.', category: 'ألوان', emoji: '🎨' },
  { german: 'grün', arabic: 'أخضر', present: 'Das Gras ist nach dem Regen grün.', past: 'Der Baum war früher sehr grün.', category: 'ألوان', emoji: '🎨' },
  { german: 'gelb', arabic: 'أصفر', present: 'Die Sonne scheint gelb am Himmel.', past: 'Die Blume war gestern noch gelb.', category: 'ألوان', emoji: '🎨' },
  { german: 'schwarz', arabic: 'أسود', present: 'Meine Tasche ist schwarz.', past: 'Er hat ein schwarzes Hemd getragen.', category: 'ألوان', emoji: '🎨' },
  { german: 'weiß', arabic: 'أبيض', present: 'Der Schnee ist kalt und weiß.', past: 'Das Kleid war weiß und elegant.', category: 'ألوان', emoji: '🎨' },
  { german: 'orange', arabic: 'برتقالي', present: 'Die Orange ist orange und süß.', past: 'Er hat ein oranges T-Shirt gekauft.', category: 'ألوان', emoji: '🎨' },

  // عمل
  { german: 'die Arbeit', arabic: 'العمل', present: 'Die Arbeit beginnt um acht Uhr.', past: 'Die Arbeit hat gestern spät geendet.', category: 'عمل', emoji: '💼' },
  { german: 'der Arzt', arabic: 'الطبيب', present: 'Der Arzt untersucht den Patienten.', past: 'Der Arzt hat ihn gestern untersucht.', category: 'عمل', emoji: '💼' },
  { german: 'der Lehrer', arabic: 'المعلم', present: 'Der Lehrer erklärt die Grammatik.', past: 'Der Lehrer hat die Lektion gut erklärt.', category: 'عمل', emoji: '💼' },
  { german: 'der Ingenieur', arabic: 'المهندس', present: 'Der Ingenieur baut eine Brücke.', past: 'Der Ingenieur hat das Projekt geplant.', category: 'عمل', emoji: '💼' },
  { german: 'der Schüler', arabic: 'الطالب', present: 'Der Schüler lernt für die Prüfung.', past: 'Der Schüler hat die Prüfung bestanden.', category: 'عمل', emoji: '💼' },
  { german: 'das Büro', arabic: 'المكتب', present: 'Ich arbeite heute im Büro.', past: 'Er hat gestern lange im Büro gearbeitet.', category: 'عمل', emoji: '💼' },

  // سفر
  { german: 'das Flugzeug', arabic: 'الطائرة', present: 'Das Flugzeug fliegt sehr hoch.', past: 'Das Flugzeug hat pünktlich abgeflogen.', category: 'سفر', emoji: '✈️' },
  { german: 'der Bahnhof', arabic: 'محطة القطار', present: 'Ich warte am Bahnhof auf den Zug.', past: 'Wir haben uns am Bahnhof getroffen.', category: 'سفر', emoji: '✈️' },
  { german: 'das Hotel', arabic: 'الفندق', present: 'Wir wohnen in einem schönen Hotel.', past: 'Sie hat drei Nächte im Hotel gewohnt.', category: 'سفر', emoji: '✈️' },
  { german: 'die Straße', arabic: 'الشارع', present: 'Die Kinder spielen auf der Straße.', past: 'Er hat die Straße überquert.', category: 'سفر', emoji: '✈️' },
  { german: 'die Stadt', arabic: 'المدينة', present: 'Ich lebe in einer großen Stadt.', past: 'Er hat früher in einer kleinen Stadt gewohnt.', category: 'سفر', emoji: '✈️' },
  { german: 'das Land', arabic: 'الدولة / البلد', present: 'Ich reise durch das ganze Land.', past: 'Sie hat das Land vor einem Jahr besucht.', category: 'سفر', emoji: '✈️' },
];

// ===== CUSTOM WORDS =====
let customWords = [];

function getAllWords() {
  return [...words, ...customWords];
}

// ===== STATE =====
let state = {
  learned: new Set(),
  favorites: new Set(),
  currentScreen: 'home',
  flashcard: { words: [], index: 0, flipped: false, title: '' },
  quiz: { words: [], index: 0, score: 0, answered: false, options: [] },
  activeTab: 'home'
};

// ===== STATE: localStorage أولاً + Firebase للمزامنة =====
function saveState() {
  if (!currentUID || currentUID === 'guest') return;
  const data = {
    learned:     [...state.learned],
    favorites:   [...state.favorites],
    customWords: customWords
  };
  // ١. احفظ فوراً في localStorage (يعمل دائماً بدون إنترنت)
  localStorage.setItem(`vl_${currentUID}`, JSON.stringify(data));
  // ٢. زامن مع Firebase (للمزامنة بين الأجهزة)
  db.ref(`users/${currentUID}`).set(data).catch(() => {});
}

function loadState() {
  if (!currentUID || currentUID === 'guest') return;

  // أولاً: حمّل من localStorage فوراً حتى لا يظهر فراغ
  const local = localStorage.getItem(`vl_${currentUID}`);
  if (local) {
    try {
      const d = JSON.parse(local);
      state.learned   = new Set(d.learned   || []);
      state.favorites = new Set(d.favorites || []);
      customWords     = d.customWords       || [];
    } catch(e) {}
  } else {
    state.learned   = new Set();
    state.favorites = new Set();
    customWords     = [];
  }

  // ثانياً: اجلب من Firebase (قد يكون أحدث من جهاز آخر)
  if (dbListener) {
    db.ref(`users/${currentUID}`).off('value', dbListener);
    dbListener = null;
  }
  dbListener = db.ref(`users/${currentUID}`).on('value', snapshot => {
    const data = snapshot.val();
    if (data) {
      state.learned   = new Set(data.learned   || []);
      state.favorites = new Set(data.favorites || []);
      customWords     = data.customWords       || [];
      // حدّث localStorage بالبيانات الأحدث من Firebase
      localStorage.setItem(`vl_${currentUID}`, JSON.stringify(data));
    } else if (!local) {
      // مستخدم جديد بدون بيانات
      state.learned   = new Set();
      state.favorites = new Set();
      customWords     = [];
    }
    renderHome();
    if (state.activeTab === 'add')       renderCustomWordsList();
    if (state.activeTab === 'favorites') renderFavorites();
  });
}

// ===== NAVIGATION =====
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  state.currentScreen = name;
}

function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  document.querySelectorAll(`.tab-item[data-tab="${tab}"]`).forEach(t => t.classList.add('active'));

  if (tab === 'home') renderHome();
  else if (tab === 'quiz') startQuiz(getAllWords());
  else if (tab === 'favorites') renderFavorites();
  else if (tab === 'add') renderAddScreen();
  else if (tab === 'chat') initChat();

  showScreen(tab === 'quiz' ? 'quiz' : tab);
}

// ===== HOME SCREEN =====
function renderHome() {
  const allW = getAllWords();
  const total = allW.length;
  const learned = state.learned.size;
  const pct = total ? Math.round(learned / total * 100) : 0;

  document.getElementById('progress-count').textContent = `${learned} / ${total} مصطلح`;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-percent').textContent = `${pct}% مكتمل`;

  // Categories
  const cats = {};
  allW.forEach(w => {
    if (!cats[w.category]) cats[w.category] = { words: [], emoji: w.emoji };
    cats[w.category].words.push(w);
  });

  const catColors = {
    'أساسيات': '#0288D1', 'تحيات': '#388E3C', 'الأسرة': '#7B1FA2',
    'طعام': '#E64A19', 'ألوان': '#00838F', 'عمل': '#1565C0', 'سفر': '#558B2F',
    'كلماتي': '#6D4C41'
  };

  const container = document.getElementById('categories-list');
  container.innerHTML = '';

  Object.entries(cats).forEach(([name, data]) => {
    const color = catColors[name] || '#1A237E';
    const learnedInCat = data.words.filter(w => state.learned.has(w.german)).length;
    const pctCat = data.words.length ? learnedInCat / data.words.length * 100 : 0;

    const el = document.createElement('div');
    el.className = 'category-card';
    el.innerHTML = `
      <div class="category-icon-wrap" style="background:${color}20">
        <span>${data.emoji}</span>
      </div>
      <div class="category-info">
        <div class="category-name">${name}</div>
        <div class="category-count">${learnedInCat}/${data.words.length} مصطلح</div>
        <div class="mini-progress">
          <div class="mini-progress-fill" style="width:${pctCat}%;background:${color}"></div>
        </div>
      </div>
      <div class="category-arrow">‹</div>
    `;
    el.onclick = () => openFlashcards(data.words, name);
    container.appendChild(el);
  });
}

// ===== FLASHCARDS =====
function openFlashcards(wordList, title) {
  state.flashcard = { words: [...wordList], index: 0, flipped: false, title };
  renderFlashcard();
  showScreen('flashcard');
}

function renderFlashcard() {
  const fc = state.flashcard;
  const word = fc.words[fc.index];
  const pct = (fc.index + 1) / fc.words.length * 100;

  document.getElementById('fc-title').textContent = fc.title;
  document.getElementById('fc-progress-text').textContent = `${fc.index + 1} / ${fc.words.length}`;
  document.getElementById('fc-progress-fill').style.width = pct + '%';

  // Card content
  document.getElementById('fc-german').textContent  = word.german;
  document.getElementById('fc-arabic').textContent  = word.arabic;
  document.getElementById('fc-present').textContent = word.present    || '';
  document.getElementById('fc-past').textContent    = word.past       || '';
  document.getElementById('fc-present-ar').textContent = word.presentArabic || '';
  document.getElementById('fc-past-ar').textContent    = word.pastArabic    || '';

  // Flip state
  const inner = document.getElementById('card-inner');
  inner.classList.toggle('flipped', fc.flipped);

  // Learned button
  const btnLearned = document.getElementById('btn-learned');
  if (state.learned.has(word.german)) {
    btnLearned.classList.add('done');
    btnLearned.textContent = '✅ تعلمته';
  } else {
    btnLearned.classList.remove('done');
    btnLearned.textContent = '✓ تعلمته';
  }

  // Fav button
  const isFav = state.favorites.has(word.german);
  document.getElementById('fc-fav-btn').textContent = isFav ? '❤️' : '🤍';

  // Prev button
  document.getElementById('btn-prev').style.opacity = fc.index === 0 ? '0.4' : '1';
}

function flipCard() {
  state.flashcard.flipped = !state.flashcard.flipped;
  document.getElementById('card-inner').classList.toggle('flipped', state.flashcard.flipped);
}

function nextCard() {
  const fc = state.flashcard;
  if (fc.index < fc.words.length - 1) {
    fc.index++;
    fc.flipped = false;
    renderFlashcard();
  } else {
    showCompletionModal();
  }
}

function prevCard() {
  const fc = state.flashcard;
  if (fc.index > 0) {
    fc.index--;
    fc.flipped = false;
    renderFlashcard();
  }
}

function markLearned() {
  const word = state.flashcard.words[state.flashcard.index];
  if (state.learned.has(word.german)) {
    state.learned.delete(word.german);
  } else {
    state.learned.add(word.german);
  }
  saveState();
  renderFlashcard();
}

function toggleFavFlashcard() {
  const word = state.flashcard.words[state.flashcard.index];
  if (state.favorites.has(word.german)) {
    state.favorites.delete(word.german);
  } else {
    state.favorites.add(word.german);
  }
  saveState();
  renderFlashcard();
}

function showCompletionModal() {
  const learned = state.flashcard.words.filter(w => state.learned.has(w.german)).length;
  const total = state.flashcard.words.length;
  showModal({
    emoji: '🎉',
    title: 'أحسنت!',
    score: null,
    message: `انتهيت من "${state.flashcard.title}"\nتعلمت ${learned} من ${total} مصطلح`,
    primaryBtn: 'العودة للرئيسية',
    secondaryBtn: 'مراجعة مرة أخرى',
    onPrimary: () => { closeModal(); switchTab('home'); },
    onSecondary: () => {
      closeModal();
      state.flashcard.index = 0;
      state.flashcard.flipped = false;
      renderFlashcard();
    }
  });
}

// ===== QUIZ =====
function startQuiz(wordList) {
  const shuffled = [...wordList].sort(() => Math.random() - 0.5).slice(0, 15);
  state.quiz = { words: shuffled, index: 0, score: 0, answered: false, options: [] };
  renderQuiz();
}

function renderQuiz() {
  const q = state.quiz;
  const word = q.words[q.index];
  const pct = (q.index + 1) / q.words.length * 100;

  document.getElementById('quiz-progress-text').textContent = `${q.index + 1} / ${q.words.length}`;
  document.getElementById('quiz-progress-fill').style.width = pct + '%';
  document.getElementById('quiz-score').textContent = `⭐ ${q.score}`;
  document.getElementById('quiz-word').textContent = word.german;
  document.getElementById('quiz-category').textContent = word.category;

  // Generate options
  const allArabic = getAllWords().filter(w => w.arabic !== word.arabic).map(w => w.arabic);
  allArabic.sort(() => Math.random() - 0.5);
  const options = [...allArabic.slice(0, 3), word.arabic].sort(() => Math.random() - 0.5);
  q.options = options;

  const letters = ['أ', 'ب', 'ج', 'د'];
  const container = document.getElementById('quiz-options');
  container.innerHTML = '';
  options.forEach((opt, i) => {
    const el = document.createElement('div');
    el.className = 'quiz-option';
    el.innerHTML = `<div class="option-letter">${letters[i]}</div><span>${opt}</span>`;
    el.onclick = () => selectQuizAnswer(i);
    container.appendChild(el);
  });

  document.getElementById('btn-next-quiz').classList.remove('visible');
  document.getElementById('btn-next-quiz').textContent =
    q.index < q.words.length - 1 ? 'السؤال التالي ←' : 'عرض النتيجة 🏆';
  q.answered = false;
}

function selectQuizAnswer(index) {
  if (state.quiz.answered) return;
  state.quiz.answered = true;

  const q = state.quiz;
  const correct = q.words[q.index].arabic;
  const options = document.querySelectorAll('.quiz-option');

  options.forEach((opt, i) => {
    if (q.options[i] === correct) {
      opt.classList.add('correct');
      opt.querySelector('.option-letter').textContent = '✓';
    } else if (i === index && q.options[i] !== correct) {
      opt.classList.add('wrong');
      opt.querySelector('.option-letter').textContent = '✗';
    }
    opt.style.pointerEvents = 'none';
  });

  if (q.options[index] === correct) {
    q.score++;
    document.getElementById('quiz-score').textContent = `⭐ ${q.score}`;
  }

  document.getElementById('btn-next-quiz').classList.add('visible');
}

function nextQuizQuestion() {
  const q = state.quiz;
  if (q.index < q.words.length - 1) {
    q.index++;
    renderQuiz();
  } else {
    showQuizResult();
  }
}

function showQuizResult() {
  const q = state.quiz;
  const pct = Math.round(q.score / q.words.length * 100);
  let emoji, msg;
  if (pct >= 80) { emoji = '🏆'; msg = 'ممتاز! أداء رائع!'; }
  else if (pct >= 60) { emoji = '👍'; msg = 'جيد! استمر في التعلم!'; }
  else { emoji = '📚'; msg = 'راجع المصطلحات أكثر!'; }

  showModal({
    emoji,
    title: 'نتيجة الاختبار',
    score: `${q.score} / ${q.words.length}`,
    percent: pct + '%',
    message: msg,
    primaryBtn: 'العودة للرئيسية',
    secondaryBtn: 'إعادة الاختبار',
    onPrimary: () => { closeModal(); switchTab('home'); },
    onSecondary: () => { closeModal(); startQuiz(words); }
  });
}

// ===== AUTO TRANSLATION (Groq AI - مجاني) =====
async function autoTranslate() {
  const german = document.getElementById('input-german').value.trim();
  if (!german) {
    showAiError('⚠️ اكتب الكلمة الألمانية أولاً');
    return;
  }

  const apiKey = ['gsk_bSCyLeggh87SSQ21IvRf','WGdyb3FYKPbkXkR4P9Wx','JsihtGGRIUrG'].join('');

  // Show loading
  const btn = document.getElementById('translate-btn');
  const btnText = document.getElementById('translate-btn-text');
  btn.classList.add('loading');
  btnText.textContent = '⏳ ...';
  document.getElementById('ai-error').style.display = 'none';
  document.getElementById('ai-result-section').style.display = 'none';

  try {
    const prompt = `You are a German language teacher. For the German word/phrase "${german}", provide:
1. The accurate Arabic translation of the word
2. One natural German example sentence in present tense using this word
3. Arabic translation of the present tense sentence
4. One natural German example sentence in past tense using this word
5. Arabic translation of the past tense sentence

Respond ONLY with valid JSON in this exact format, no extra text:
{"arabic":"...", "present":"...", "presentArabic":"...", "past":"...", "pastArabic":"..."}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 256,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (res.status === 401) throw new Error('مفتاح API غير صحيح');
      if (res.status === 429) throw new Error('تجاوزت الحد المسموح، حاول لاحقاً');
      throw new Error(errData.error?.message || `خطأ ${res.status}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('لم يتم الحصول على نتيجة صحيحة');
    const result = JSON.parse(jsonMatch[0]);

    if (!result.arabic) throw new Error('لم يتم الحصول على ترجمة');

    // Fill fields
    document.getElementById('input-arabic').value  = result.arabic        || '';
    document.getElementById('input-present').value = result.present       || '';
    document.getElementById('input-past').value    = result.past          || '';
    document.getElementById('input-category').value = '';
    // حفظ ترجمات الجمل مؤقتاً لإضافتها مع الكلمة
    document.getElementById('input-present').dataset.arabic = result.presentArabic || '';
    document.getElementById('input-past').dataset.arabic    = result.pastArabic    || '';

    // Show result
    const section = document.getElementById('ai-result-section');
    section.style.display = 'block';
    section.classList.remove('ai-result-animate');
    void section.offsetWidth;
    section.classList.add('ai-result-animate');

  } catch (err) {
    showAiError('❌ ' + (err.message || 'حدث خطأ في الترجمة'));
  } finally {
    btn.classList.remove('loading');
    btnText.textContent = '✨ ترجم';
  }
}

// ===== CHAT =====
let chatHistory = [];
let chatReady = false;

const CHAT_SYSTEM = `Du bist Max, ein freundlicher deutscher Muttersprachler und Sprachlehrer.
Du hilfst dem Benutzer, Deutsch zu üben.
Regeln:
- Antworte IMMER auf Deutsch, egal in welcher Sprache der Benutzer schreibt
- Wenn der Benutzer auf Arabisch schreibt, antworte auf Deutsch UND erkläre kurz auf Arabisch in Klammern
- Wenn der Benutzer einen Grammatikfehler macht, korrigiere ihn freundlich am Ende deiner Antwort mit: 💡 Korrektur: ...
- Halte die Antworten kurz und natürlich (2-4 Sätze)
- Sei freundlich, ermutigend und gesprächig
- Du kannst über alle Themen sprechen: Alltag, Reisen, Essen, Sport, etc.`;

function initChat() {
  if (chatReady) return;
  chatReady = true;
  chatHistory = [];
  const container = document.getElementById('chat-messages');
  container.innerHTML = '';
  appendChatMessage('bot', 'Hallo! Ich bin Max. 😊 Lass uns Deutsch üben! Worüber möchtest du sprechen?\n(مرحباً! أنا ماكس، تحدث معي بالألمانية عن أي شيء تريد!)');
}

function resetChat() {
  chatReady = false;
  chatHistory = [];
  initChat();
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  const btn = document.getElementById('chat-send-btn');
  input.value = '';
  btn.disabled = true;
  document.getElementById('chat-send-icon').textContent = '⏳';

  appendChatMessage('user', text);
  chatHistory.push({ role: 'user', content: text });

  // Typing indicator
  const typingId = appendChatMessage('bot', '...', true);

  try {
    const apiKey = ['gsk_bSCyLeggh87SSQ21IvRf','WGdyb3FYKPbkXkR4P9Wx','JsihtGGRIUrG'].join('');
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 300,
        temperature: 0.7,
        messages: [
          { role: 'system', content: CHAT_SYSTEM },
          ...chatHistory.slice(-10) // آخر 10 رسائل للسياق
        ]
      })
    });

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || 'Entschuldigung, ich habe das nicht verstanden.';
    chatHistory.push({ role: 'assistant', content: reply });
    updateChatMessage(typingId, reply);

  } catch (e) {
    updateChatMessage(typingId, '❌ حدث خطأ، حاول مرة أخرى.');
  } finally {
    btn.disabled = false;
    document.getElementById('chat-send-icon').textContent = '➤';
    input.focus();
  }
}

let msgIdCounter = 0;
function appendChatMessage(role, text, isTyping = false) {
  const id = 'msg-' + (++msgIdCounter);
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `chat-msg chat-msg-${role}`;
  div.id = id;

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.innerHTML = formatChatText(text);

  // زر استماع للرسائل الألمانية
  if (role === 'bot' && !isTyping) {
    const speakBtn = document.createElement('button');
    speakBtn.className = 'chat-speak-btn';
    speakBtn.textContent = '🔊';
    speakBtn.onclick = () => speakChatText(text);
    div.appendChild(speakBtn);
  }

  div.appendChild(bubble);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
}

function updateChatMessage(id, text) {
  const div = document.getElementById(id);
  if (!div) return;
  const bubble = div.querySelector('.chat-bubble');
  if (bubble) bubble.innerHTML = formatChatText(text);

  // أضف زر استماع
  if (!div.querySelector('.chat-speak-btn')) {
    const speakBtn = document.createElement('button');
    speakBtn.className = 'chat-speak-btn';
    speakBtn.textContent = '🔊';
    speakBtn.onclick = () => speakChatText(text);
    div.insertBefore(speakBtn, bubble);
  }

  const container = document.getElementById('chat-messages');
  container.scrollTop = container.scrollHeight;
}

function formatChatText(text) {
  return text
    .replace(/\n/g, '<br>')
    .replace(/💡 Korrektur:(.*)/g, '<span class="chat-correction">💡 Korrektur:$1</span>');
}

function speakChatText(text) {
  if (!window.speechSynthesis) return;
  // اقرأ فقط النص الألماني (بدون الأقواس العربية)
  const germanText = text.replace(/\(.*?\)/g, '').replace(/💡.*$/gm, '').trim();
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(germanText);
  utter.lang = 'de-DE';
  utter.rate = 0.85;
  window.speechSynthesis.speak(utter);
}

// ===== TEXT TO SPEECH =====
function speakText(part) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const word = state.flashcard.words[state.flashcard.index];
  let text = '';
  if (part === 'word')    text = word.german;
  if (part === 'present') text = word.present || '';
  if (part === 'past')    text = word.past    || '';
  if (!text) return;

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'de-DE';
  utter.rate = 0.85;
  window.speechSynthesis.speak(utter);
}

function showAiError(msg) {
  const el = document.getElementById('ai-error');
  el.textContent = msg;
  el.style.display = 'block';
}

// ===== API KEY MODAL =====
function showApiKeyModal() {
  const modal = document.getElementById('apikey-modal');
  modal.style.display = 'flex';
  const saved = localStorage.getItem('groqApiKey');
  if (saved) document.getElementById('apikey-input').value = saved;
}

function closeApiKeyModal() {
  document.getElementById('apikey-modal').style.display = 'none';
}

function saveApiKey() {
  const key = document.getElementById('apikey-input').value.trim();
  if (!key) {
    alert('الرجاء إدخال المفتاح');
    return;
  }
  localStorage.setItem('groqApiKey', key);
  closeApiKeyModal();
  showToast('✅ تم حفظ المفتاح!');
  const german = document.getElementById('input-german').value.trim();
  if (german) autoTranslate();
}

// ===== ADD WORD =====
function renderAddScreen() {
  renderCustomWordsList();
}

function submitAddWord() {
  const german   = document.getElementById('input-german').value.trim();
  const arabic   = document.getElementById('input-arabic').value.trim();
  const present  = document.getElementById('input-present').value.trim();
  const past     = document.getElementById('input-past').value.trim();
  const category = document.getElementById('input-category').value.trim() || 'كلماتي';
  const errorEl  = document.getElementById('add-error');

  // Validation
  if (!german) {
    errorEl.textContent = '⚠️ يرجى كتابة الكلمة بالألمانية';
    errorEl.style.display = 'block';
    return;
  }
  if (!arabic) {
    errorEl.textContent = '⚠️ يرجى كتابة الترجمة بالعربية';
    errorEl.style.display = 'block';
    return;
  }
  if (getAllWords().some(w => w.german.toLowerCase() === german.toLowerCase())) {
    errorEl.textContent = '⚠️ هذه الكلمة موجودة مسبقاً';
    errorEl.style.display = 'block';
    return;
  }

  errorEl.style.display = 'none';

  // Add word
  const presentEl = document.getElementById('input-present');
  const pastEl    = document.getElementById('input-past');
  const newWord = {
    german,
    arabic,
    present:        present || `${german} ist wichtig.`,
    presentArabic:  presentEl.dataset.arabic || '',
    past:           past    || `${german} war wichtig.`,
    pastArabic:     pastEl.dataset.arabic    || '',
    category,
    emoji: '✏️',
    isCustom: true
  };
  customWords.push(newWord);
  saveState();

  // Clear form
  document.getElementById('input-german').value = '';
  document.getElementById('input-arabic').value = '';
  document.getElementById('input-present').value = '';
  document.getElementById('input-past').value = '';
  document.getElementById('input-category').value = '';

  renderCustomWordsList();
  showToast(`✅ تمت إضافة "${german}" بنجاح!`);
}

function deleteCustomWord(german) {
  customWords = customWords.filter(w => w.german !== german);
  state.learned.delete(german);
  state.favorites.delete(german);
  saveState();
  renderCustomWordsList();
  showToast('🗑️ تم حذف الكلمة');
}

function renderCustomWordsList() {
  const container = document.getElementById('custom-words-list');
  container.innerHTML = '';

  if (customWords.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="height:180px">
        <div class="empty-icon">📝</div>
        <div class="empty-text">لم تضف كلمات بعد</div>
        <div class="empty-sub">أضف كلماتك من النموذج أعلاه</div>
      </div>
    `;
    return;
  }

  customWords.forEach(word => {
    const el = document.createElement('div');
    el.className = 'custom-word-item';
    el.innerHTML = `
      <div class="custom-word-info">
        <div class="custom-word-german">${word.german}</div>
        <div class="custom-word-arabic">${word.arabic}</div>
        ${word.present ? `<div class="custom-word-example">🟢 ${word.present}</div>` : ''}
        ${word.past    ? `<div class="custom-word-example">🔵 ${word.past}</div>`    : ''}
      </div>
      <div class="custom-word-tag">${word.category}</div>
      <button class="delete-btn" onclick="deleteCustomWord('${word.german.replace(/'/g, "\\'")}')">🗑️</button>
    `;
    container.appendChild(el);
  });
}

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}

// ===== FAVORITES =====
function renderFavorites() {
  const container = document.getElementById('favorites-list');
  container.innerHTML = '';
  const favWords = getAllWords().filter(w => state.favorites.has(w.german));

  if (favWords.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🤍</div>
        <div class="empty-text">لا توجد مصطلحات مفضلة</div>
        <div class="empty-sub">اضغط على 🤍 في البطاقات التعليمية لإضافة مصطلحات هنا</div>
      </div>
    `;
    return;
  }

  favWords.forEach(word => {
    const el = document.createElement('div');
    el.className = 'fav-item';
    el.innerHTML = `
      <div class="fav-heart">❤️</div>
      <div class="fav-info">
        <div class="fav-german">${word.german}</div>
        <div class="fav-arabic">${word.arabic}</div>
      </div>
      <div class="fav-tag">${word.category}</div>
    `;
    container.appendChild(el);
  });
}

// ===== MODAL =====
function showModal({ emoji, title, score, percent, message, primaryBtn, secondaryBtn, onPrimary, onSecondary }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-emoji">${emoji}</div>
      <div class="modal-title">${title}</div>
      ${score ? `<div class="modal-score">${score}</div>` : ''}
      ${percent ? `<div class="modal-percent">${percent}</div>` : ''}
      <div class="modal-message">${message}</div>
      <div class="modal-btns">
        <button class="modal-btn-primary" id="modal-primary">${primaryBtn}</button>
        <button class="modal-btn-secondary" id="modal-secondary">${secondaryBtn}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('modal-primary').onclick = onPrimary;
  document.getElementById('modal-secondary').onclick = onSecondary;
}

function closeModal() {
  const el = document.getElementById('modal-overlay');
  if (el) el.remove();
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Firebase onAuthStateChanged يتحكم بالشاشة الأولى
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
