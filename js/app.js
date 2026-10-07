import { QuizEngine } from './quiz-engine.js';
import { StorageService } from './storage.js';
import { questionsData } from '../modules/history-102/questions.js';

let allQuestionsData = questionsData || [];
let quizEngine = null;
let currentStudentName = '';
const FIXED_EXAM_MINUTES = 30;

// Screens
const welcomeScreen = document.getElementById('welcomeScreen');
const quizScreen = document.getElementById('quizScreen');
const resultsScreen = document.getElementById('resultsScreen');
const historyScreen = document.getElementById('historyScreen');

// Header elements
const userBadge = document.getElementById('userBadge');
const userNameDisplay = document.getElementById('userNameDisplay');
const btnSwitchUser = document.getElementById('btnSwitchUser');
const timerBox = document.getElementById('timerBox');
const timerDisplay = document.getElementById('timerDisplay');

// Welcome elements
const studentNameInput = document.getElementById('studentNameInput');
const btnStartExam = document.getElementById('btnStartExam');
const btnViewHistory = document.getElementById('btnViewHistory');

// Quiz elements
const progressBar = document.getElementById('progressBar');
const qIndexLabel = document.getElementById('qIndexLabel');
const qTopicLabel = document.getElementById('qTopicLabel');
const qTypeBadge = document.getElementById('qTypeBadge');
const qDiffBadge = document.getElementById('qDiffBadge');
const qText = document.getElementById('qText');
const optionsContainer = document.getElementById('optionsContainer');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const btnSubmitExam = document.getElementById('btnSubmitExam');
const questionPalette = document.getElementById('questionPalette');

// Results elements
const resCandidateName = document.getElementById('resCandidateName');
const finalPercentage = document.getElementById('finalPercentage');
const resScoreSummaryText = document.getElementById('resScoreSummaryText');
const statTotal = document.getElementById('statTotal');
const statCorrect = document.getElementById('statCorrect');
const statIncorrect = document.getElementById('statIncorrect');
const statSkipped = document.getElementById('statSkipped');
const statTimeSpent = document.getElementById('statTimeSpent');
const breakdownContainer = document.getElementById('breakdownContainer');
const reviewContainer = document.getElementById('reviewContainer');
const btnRetakeExam = document.getElementById('btnRetakeExam');
const btnShowHistoryFromResults = document.getElementById('btnShowHistoryFromResults');
const btnReviewAll = document.getElementById('btnReviewAll');
const btnReviewIncorrect = document.getElementById('btnReviewIncorrect');

// History screen elements
const historyTableContainer = document.getElementById('historyTableContainer');
const btnBackToHome = document.getElementById('btnBackToHome');
const btnClearHistory = document.getElementById('btnClearHistory');

let cachedResultDetails = [];

// Initialize
async function initApp() {
  bindEvents();

  // If questionsData was not loaded via import, fallback to fetch
  if (!allQuestionsData || allQuestionsData.length === 0) {
    try {
      const res = await fetch('./modules/history-102/questions.json');
      allQuestionsData = await res.json();
    } catch (err) {
      console.warn('Fallback fetch failed or running offline:', err);
    }
  }

  // Check remembered student name
  const rememberedName = StorageService.getActiveUser();
  if (rememberedName) {
    currentStudentName = rememberedName;
    studentNameInput.value = rememberedName;
    showUserBadge(rememberedName);
  }
}

function showUserBadge(name) {
  if (name && name.trim()) {
    userNameDisplay.textContent = name;
    userBadge.style.display = 'inline-flex';
  } else {
    userBadge.style.display = 'none';
  }
}

function bindEvents() {
  btnStartExam.addEventListener('click', handleStartExam);
  studentNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleStartExam();
    }
  });
  btnViewHistory.addEventListener('click', () => showScreen('history'));
  btnBackToHome.addEventListener('click', () => showScreen('welcome'));
  btnRetakeExam.addEventListener('click', handleStartExam);
  btnShowHistoryFromResults.addEventListener('click', () => showScreen('history'));

  btnSwitchUser.addEventListener('click', () => {
    StorageService.clearActiveUser();
    currentStudentName = '';
    studentNameInput.value = '';
    userBadge.style.display = 'none';
    showScreen('welcome');
    studentNameInput.focus();
  });

  btnClearHistory.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all saved score records on this machine?')) {
      StorageService.clearHistory();
      renderHistoryTable();
    }
  });

  btnPrev.addEventListener('click', () => navigate(-1));
  btnNext.addEventListener('click', () => navigate(1));
  btnSubmitExam.addEventListener('click', confirmSubmission);

  if (btnReviewAll) btnReviewAll.addEventListener('click', () => renderReviewList('all'));
  if (btnReviewIncorrect) btnReviewIncorrect.addEventListener('click', () => renderReviewList('incorrect'));
}

function showScreen(screenName) {
  welcomeScreen.style.display = screenName === 'welcome' ? 'block' : 'none';
  quizScreen.style.display = screenName === 'quiz' ? 'block' : 'none';
  resultsScreen.style.display = screenName === 'results' ? 'block' : 'none';
  historyScreen.style.display = screenName === 'history' ? 'block' : 'none';

  if (screenName !== 'quiz') {
    timerBox.style.display = 'none';
  }

  if (screenName === 'history') {
    renderHistoryTable();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleStartExam() {
  const inputName = studentNameInput.value.trim();
  if (!inputName) {
    alert('Please enter your Candidate Name / Student ID before starting the examination.');
    studentNameInput.focus();
    return;
  }

  if (!allQuestionsData || allQuestionsData.length === 0) {
    alert('Questions dataset is not loaded. Please ensure questions.js or questions.json is accessible.');
    return;
  }

  currentStudentName = inputName;
  StorageService.setActiveUser(inputName);
  showUserBadge(inputName);

  // Initialize Quiz Engine (Fixed 30 minutes, full 50 questions)
  quizEngine = new QuizEngine(allQuestionsData, {
    mode: 'exam',
    filterType: 'all',
    timeLimitMinutes: FIXED_EXAM_MINUTES,
    shuffle: false
  });

  showScreen('quiz');
  timerBox.style.display = 'flex';

  quizEngine.onTick = updateTimerDisplay;
  quizEngine.onTimeUp = () => {
    alert('Time limit reached (30 minutes). Automatically submitting your examination.');
    submitAndDisplayResults();
  };

  quizEngine.startTimer();
  updateTimerDisplay(quizEngine.timeRemaining);

  renderPalette();
  renderCurrentQuestion();
}

function updateTimerDisplay(secondsLeft) {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  if (secondsLeft <= 300) {
    timerBox.classList.add('warning');
  } else {
    timerBox.classList.remove('warning');
  }
}

function renderPalette() {
  questionPalette.innerHTML = '';
  quizEngine.filteredQuestions.forEach((q, idx) => {
    const btn = document.createElement('button');
    btn.className = 'palette-btn';
    btn.textContent = idx + 1;
    btn.setAttribute('aria-label', `Question ${idx + 1}`);
    btn.addEventListener('click', () => {
      quizEngine.jumpTo(idx);
      renderCurrentQuestion();
    });
    questionPalette.appendChild(btn);
  });
  updatePaletteStates();
}

function updatePaletteStates() {
  const buttons = questionPalette.querySelectorAll('.palette-btn');
  buttons.forEach((btn, idx) => {
    const q = quizEngine.filteredQuestions[idx];
    btn.classList.remove('current', 'answered');
    if (idx === quizEngine.currentIndex) {
      btn.classList.add('current');
    }
    if (quizEngine.hasAnswered(q.id)) {
      btn.classList.add('answered');
    }
  });
}

function renderCurrentQuestion() {
  const q = quizEngine.getCurrentQuestion();
  const total = quizEngine.filteredQuestions.length;
  const currentNum = quizEngine.currentIndex + 1;

  progressBar.style.width = `${Math.round((currentNum / total) * 100)}%`;
  qIndexLabel.textContent = `QUESTION ${currentNum} OF ${total}`;
  qTopicLabel.textContent = q.topic || 'World History';
  qTypeBadge.textContent = q.type.toUpperCase();
  qTypeBadge.className = `tag-badge tag-${q.type}`;
  qDiffBadge.textContent = q.difficulty.toUpperCase();

  qText.textContent = q.question;

  optionsContainer.innerHTML = '';
  const selectedOption = quizEngine.getUserAnswer(q.id);
  const letters = ['A', 'B', 'C', 'D'];

  q.options.forEach((optText, optIdx) => {
    const optBtn = document.createElement('button');
    optBtn.className = 'option-btn';
    if (selectedOption === optIdx) {
      optBtn.classList.add('selected');
    }

    optBtn.innerHTML = `
      <span class="option-key">${letters[optIdx]}</span>
      <span class="option-text">${escapeHtml(optText)}</span>
    `;

    optBtn.addEventListener('click', () => {
      quizEngine.selectAnswer(q.id, optIdx);
      const allBtns = optionsContainer.querySelectorAll('.option-btn');
      allBtns.forEach((b, i) => b.classList.toggle('selected', i === optIdx));
      updatePaletteStates();
    });

    optionsContainer.appendChild(optBtn);
  });

  btnPrev.disabled = quizEngine.currentIndex === 0;
  btnNext.style.display = (quizEngine.currentIndex === total - 1) ? 'none' : 'inline-flex';

  updatePaletteStates();
}

function navigate(dir) {
  if (dir === -1) {
    quizEngine.goToPrev();
  } else {
    quizEngine.goToNext();
  }
  renderCurrentQuestion();
}

function confirmSubmission() {
  const answeredCount = Object.keys(quizEngine.userAnswers).length;
  const total = quizEngine.filteredQuestions.length;
  const unanswered = total - answeredCount;

  let msg = `Submit Examination?\n\nCandidate: ${currentStudentName}\nAnswered: ${answeredCount} / ${total}`;
  if (unanswered > 0) {
    msg += `\nWarning: You have ${unanswered} unanswered question(s).`;
  }

  if (confirm(msg)) {
    submitAndDisplayResults();
  }
}

function submitAndDisplayResults() {
  const results = quizEngine.calculateResults();
  cachedResultDetails = results.details;

  // Save to persistent storage
  StorageService.saveAttempt({
    studentName: currentStudentName,
    moduleId: 'history-102',
    moduleTitle: 'HIS 102 & 205 World Civilization',
    scorePercentage: results.scorePercentage,
    correctCount: results.correctCount,
    incorrectCount: results.incorrectCount,
    skippedCount: results.skippedCount,
    totalQuestions: results.total,
    timeSpentSeconds: results.timeSpentSeconds,
    breakdownByType: results.breakdownByType
  });

  showScreen('results');

  // Display results
  resCandidateName.textContent = currentStudentName;
  finalPercentage.textContent = `${results.scorePercentage}%`;
  resScoreSummaryText.textContent = `Scored ${results.correctCount} of ${results.total} questions (${results.scorePercentage}%). Attempt saved to your score archive.`;

  statTotal.textContent = results.total;
  statCorrect.textContent = results.correctCount;
  statIncorrect.textContent = results.incorrectCount;
  statSkipped.textContent = results.skippedCount;

  const mins = Math.floor(results.timeSpentSeconds / 60);
  const secs = results.timeSpentSeconds % 60;
  statTimeSpent.textContent = `${mins}m ${secs}s`;

  renderBreakdown(results.breakdownByType);
  renderReviewList('all');
}

function renderBreakdown(breakdown) {
  breakdownContainer.innerHTML = '';
  for (const [type, data] of Object.entries(breakdown)) {
    const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.innerHTML = `
      <div class="stat-label">${type.toUpperCase()} QUESTIONS</div>
      <div class="stat-val">${data.correct} / ${data.total} <span style="font-size:0.9rem; color:var(--text-secondary)">(${pct}%)</span></div>
    `;
    breakdownContainer.appendChild(card);
  }
}

function renderReviewList(filter) {
  reviewContainer.innerHTML = '';
  const filtered = filter === 'incorrect'
    ? cachedResultDetails.filter(d => d.status !== 'correct')
    : cachedResultDetails;

  if (filtered.length === 0) {
    reviewContainer.innerHTML = '<p style="color:var(--text-secondary); padding:1rem 0;">No questions match this filter.</p>';
    return;
  }

  const letters = ['A', 'B', 'C', 'D'];

  filtered.forEach(item => {
    const q = item.question;
    const div = document.createElement('div');
    div.className = `review-item is-${item.status}`;

    const userAns = item.selected !== null ? `${letters[item.selected]}: ${q.options[item.selected]}` : 'None (Skipped)';
    const correctAns = `${letters[q.answer]}: ${q.options[q.answer]}`;

    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
        <span style="font-family:var(--font-mono); font-size:0.8rem; color:var(--text-muted);">QUESTION #${q.id}</span>
        <span class="tag-badge tag-${q.type}">${item.status.toUpperCase()}</span>
      </div>
      <h3 style="font-family:var(--font-serif); font-size:1.15rem; margin-bottom:0.75rem; color:var(--text-primary);">${escapeHtml(q.question)}</h3>
      <div style="font-size:0.9rem; margin-bottom:0.5rem; color: ${item.isCorrect ? 'var(--color-correct)' : 'var(--color-incorrect)'};">
        <strong>Your Answer:</strong> ${escapeHtml(userAns)}
      </div>
      <div style="font-size:0.9rem; margin-bottom:0.75rem; color: var(--accent-lime);">
        <strong>Correct Answer:</strong> ${escapeHtml(correctAns)}
      </div>
      <div style="font-size:0.88rem; color:var(--text-secondary); background:var(--bg-surface-elevated); padding:0.75rem; border-left:3px solid var(--accent-lime);">
        <strong>Explanation:</strong> ${escapeHtml(q.explanation)}
      </div>
    `;

    reviewContainer.appendChild(div);
  });
}

function renderHistoryTable() {
  const records = StorageService.getAllRecords();

  if (records.length === 0) {
    historyTableContainer.innerHTML = `
      <p style="color: var(--text-secondary); padding: 2rem 0; text-align: center;">
        No examination records found. Complete a 30-minute exam session to log your score here.
      </p>
    `;
    return;
  }

  let html = `
    <table class="history-table">
      <thead>
        <tr>
          <th>Date & Time</th>
          <th>Candidate</th>
          <th>Score</th>
          <th>Correct</th>
          <th>Time Taken</th>
        </tr>
      </thead>
      <tbody>
  `;

  records.forEach(r => {
    const d = new Date(r.timestamp);
    const dateFormatted = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const mins = Math.floor(r.timeSpentSeconds / 60);
    const secs = r.timeSpentSeconds % 60;

    html += `
      <tr>
        <td style="font-family: var(--font-mono); font-size: 0.82rem;">${dateFormatted}</td>
        <td><strong>${escapeHtml(r.studentName)}</strong></td>
        <td><strong style="color: var(--accent-lime);">${r.scorePercentage}%</strong></td>
        <td>${r.correctCount} / ${r.totalQuestions}</td>
        <td style="font-family: var(--font-mono);">${mins}m ${secs}s</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  historyTableContainer.innerHTML = html;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', initApp);
