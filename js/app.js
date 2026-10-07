import { QuizEngine } from './quiz-engine.js';

let allQuestionsData = [];
let quizEngine = null;

// DOM Elements
const welcomeScreen = document.getElementById('welcomeScreen');
const quizScreen = document.getElementById('quizScreen');
const resultsScreen = document.getElementById('resultsScreen');

// Welcome Controls
const btnStartQuiz = document.getElementById('btnStartQuiz');
const filterPills = document.querySelectorAll('[data-filter]');
const modePills = document.querySelectorAll('[data-mode]');
const timerPills = document.querySelectorAll('[data-time]');

// Quiz Controls
const timerBox = document.getElementById('timerBox');
const timerDisplay = document.getElementById('timerDisplay');
const progressBar = document.getElementById('progressBar');
const qIndexLabel = document.getElementById('qIndexLabel');
const qTypeBadge = document.getElementById('qTypeBadge');
const qDiffBadge = document.getElementById('qDiffBadge');
const qTopicLabel = document.getElementById('qTopicLabel');
const qText = document.getElementById('qText');
const optionsContainer = document.getElementById('optionsContainer');
const practiceFeedback = document.getElementById('practiceFeedback');
const feedbackTitle = document.getElementById('feedbackTitle');
const feedbackText = document.getElementById('feedbackText');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const btnSubmitExam = document.getElementById('btnSubmitExam');
const questionPalette = document.getElementById('questionPalette');

// Results Controls
const finalPercentage = document.getElementById('finalPercentage');
const statTotal = document.getElementById('statTotal');
const statCorrect = document.getElementById('statCorrect');
const statIncorrect = document.getElementById('statIncorrect');
const statSkipped = document.getElementById('statSkipped');
const statTimeSpent = document.getElementById('statTimeSpent');
const breakdownContainer = document.getElementById('breakdownContainer');
const reviewContainer = document.getElementById('reviewContainer');
const btnRetake = document.getElementById('btnRetake');
const btnReviewFilterAll = document.getElementById('reviewFilterAll');
const btnReviewFilterIncorrect = document.getElementById('reviewFilterIncorrect');

// Active Settings
let selectedFilter = 'all';
let selectedMode = 'exam';
let selectedTimeMinutes = 45;

// Load Questions from JSON
async function initApp() {
  try {
    const res = await fetch('./data/questions.json');
    allQuestionsData = await res.json();
    setupConfigListeners();
  } catch (err) {
    console.error('Failed to load questions data:', err);
    alert('Unable to load quiz dataset. Please ensure questions.json is available.');
  }
}

function setupConfigListeners() {
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      selectedFilter = pill.getAttribute('data-filter');
    });
  });

  modePills.forEach(pill => {
    pill.addEventListener('click', () => {
      modePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      selectedMode = pill.getAttribute('data-mode');
    });
  });

  timerPills.forEach(pill => {
    pill.addEventListener('click', () => {
      timerPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      selectedTimeMinutes = parseInt(pill.getAttribute('data-time'), 10);
    });
  });

  btnStartQuiz.addEventListener('click', startQuiz);
  btnPrev.addEventListener('click', () => navigate(-1));
  btnNext.addEventListener('click', () => navigate(1));
  btnSubmitExam.addEventListener('click', confirmSubmission);
  btnRetake.addEventListener('click', resetQuiz);

  if (btnReviewFilterAll) {
    btnReviewFilterAll.addEventListener('click', () => filterReviewList('all'));
  }
  if (btnReviewFilterIncorrect) {
    btnReviewFilterIncorrect.addEventListener('click', () => filterReviewList('incorrect'));
  }
}

function startQuiz() {
  quizEngine = new QuizEngine(allQuestionsData, {
    mode: selectedMode,
    filterType: selectedFilter,
    timeLimitMinutes: selectedTimeMinutes,
    shuffle: false
  });

  if (quizEngine.filteredQuestions.length === 0) {
    alert('No questions matched the selected category.');
    return;
  }

  // Setup UI states
  welcomeScreen.style.display = 'none';
  resultsScreen.style.display = 'none';
  quizScreen.style.display = 'block';

  if (selectedMode === 'exam') {
    timerBox.style.display = 'flex';
    quizEngine.onTick = updateTimerDisplay;
    quizEngine.onTimeUp = () => {
      alert('Time has expired! Submitting your answers automatically.');
      finishQuiz();
    };
    quizEngine.startTimer();
    updateTimerDisplay(quizEngine.timeRemaining);
  } else {
    timerBox.style.display = 'none';
  }

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

  // Progress Bar
  const percent = Math.round((currentNum / total) * 100);
  progressBar.style.width = `${percent}%`;

  // Meta Info
  qIndexLabel.textContent = `QUESTION ${currentNum} OF ${total}`;
  qTypeBadge.textContent = q.type.toUpperCase();
  qTypeBadge.className = `tag-badge tag-${q.type}`;
  qDiffBadge.textContent = q.difficulty.toUpperCase();
  qTopicLabel.textContent = q.topic || 'World History';

  // Question Prompt
  qText.textContent = q.question;

  // Options
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
      handleOptionSelect(q.id, optIdx);
    });

    optionsContainer.appendChild(optBtn);
  });

  // Practice Mode Instant Feedback
  if (selectedMode === 'practice' && selectedOption !== null) {
    showPracticeFeedback(q, selectedOption);
  } else {
    practiceFeedback.classList.remove('show', 'correct-feedback', 'incorrect-feedback');
  }

  // Navigation Buttons
  btnPrev.disabled = quizEngine.currentIndex === 0;
  btnNext.style.display = (quizEngine.currentIndex === total - 1) ? 'none' : 'inline-flex';
  btnSubmitExam.style.display = (quizEngine.currentIndex === total - 1 || selectedMode === 'exam') ? 'inline-flex' : 'none';

  updatePaletteStates();
}

function handleOptionSelect(qId, optIdx) {
  quizEngine.selectAnswer(qId, optIdx);
  const q = quizEngine.getCurrentQuestion();

  // Highlight selected option
  const allBtns = optionsContainer.querySelectorAll('.option-btn');
  allBtns.forEach((btn, idx) => {
    btn.classList.toggle('selected', idx === optIdx);
  });

  updatePaletteStates();

  if (selectedMode === 'practice') {
    showPracticeFeedback(q, optIdx);
  }
}

function showPracticeFeedback(q, selectedIdx) {
  const isCorrect = selectedIdx === q.answer;
  practiceFeedback.className = 'explanation-panel show ' + (isCorrect ? 'correct-feedback' : 'incorrect-feedback');
  feedbackTitle.textContent = isCorrect ? '✓ CORRECT ANSWER' : '✗ INCORRECT';
  feedbackText.innerHTML = `
    <p><strong>Correct Option:</strong> ${escapeHtml(q.options[q.answer])}</p>
    <p style="margin-top:0.4rem;">${escapeHtml(q.explanation)}</p>
  `;
}

function navigate(direction) {
  if (direction === -1) {
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

  let msg = `Ready to submit your examination?\n\nAnswered: ${answeredCount} / ${total}`;
  if (unanswered > 0) {
    msg += `\nWarning: You have ${unanswered} unanswered question(s).`;
  }

  if (confirm(msg)) {
    finishQuiz();
  }
}

function finishQuiz() {
  const results = quizEngine.calculateResults();
  quizScreen.style.display = 'none';
  timerBox.style.display = 'none';
  resultsScreen.style.display = 'block';

  // Populate Results
  finalPercentage.textContent = `${results.scorePercentage}%`;
  statTotal.textContent = results.total;
  statCorrect.textContent = results.correctCount;
  statIncorrect.textContent = results.incorrectCount;
  statSkipped.textContent = results.skippedCount;

  const mins = Math.floor(results.timeSpentSeconds / 60);
  const secs = results.timeSpentSeconds % 60;
  statTimeSpent.textContent = `${mins}m ${secs}s`;

  renderBreakdown(results.breakdownByType);
  renderReviewList(results.details, 'all');
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

let cachedResultsDetails = [];

function renderReviewList(details, filter) {
  cachedResultsDetails = details;
  reviewContainer.innerHTML = '';

  const filtered = filter === 'incorrect' 
    ? details.filter(d => d.status !== 'correct')
    : details;

  if (filtered.length === 0) {
    reviewContainer.innerHTML = '<p style="color:var(--text-secondary); padding:1rem 0;">No questions match this review filter.</p>';
    return;
  }

  const letters = ['A', 'B', 'C', 'D'];

  filtered.forEach((item, idx) => {
    const q = item.question;
    const div = document.createElement('div');
    div.className = `review-item is-${item.status}`;

    let statusBadgeText = item.status.toUpperCase();
    let userAnsText = item.selected !== null ? `${letters[item.selected]}: ${q.options[item.selected]}` : 'None (Skipped)';
    let correctAnsText = `${letters[q.answer]}: ${q.options[q.answer]}`;

    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
        <span style="font-family:var(--font-mono); font-size:0.8rem; color:var(--text-secondary);">QUESTION #${q.id}</span>
        <span class="tag-badge tag-${q.type}">${statusBadgeText}</span>
      </div>
      <h3 style="font-family:var(--font-serif); font-size:1.15rem; margin-bottom:1rem; color:#fff;">${escapeHtml(q.question)}</h3>
      <div style="font-size:0.9rem; margin-bottom:0.6rem; color: ${item.isCorrect ? 'var(--color-correct)' : 'var(--color-incorrect)'};">
        <strong>Your Answer:</strong> ${escapeHtml(userAnsText)}
      </div>
      <div style="font-size:0.9rem; margin-bottom:0.75rem; color: var(--accent-lime);">
        <strong>Correct Answer:</strong> ${escapeHtml(correctAnsText)}
      </div>
      <div style="font-size:0.88rem; color:var(--text-secondary); background:var(--bg-surface-elevated); padding:0.75rem; border-left:2px solid var(--accent-lime);">
        <strong>Explanation:</strong> ${escapeHtml(q.explanation)}
      </div>
    `;

    reviewContainer.appendChild(div);
  });
}

function filterReviewList(filter) {
  if (btnReviewFilterAll && btnReviewFilterIncorrect) {
    btnReviewFilterAll.classList.toggle('active', filter === 'all');
    btnReviewFilterIncorrect.classList.toggle('active', filter === 'incorrect');
  }
  renderReviewList(cachedResultsDetails, filter);
}

function resetQuiz() {
  resultsScreen.style.display = 'none';
  welcomeScreen.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
