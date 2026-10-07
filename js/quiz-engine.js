// Quiz State & Engine Module
export class QuizEngine {
  constructor(questions, options = {}) {
    this.allQuestions = questions;
    this.options = Object.assign({
      mode: 'exam', // 'exam' or 'practice'
      filterType: 'all', // 'all', 'creative', 'general', 'mixed'
      timeLimitMinutes: 45,
      shuffle: false
    }, options);

    this.filteredQuestions = this.filterAndPrepare();
    this.currentIndex = 0;
    this.userAnswers = {}; // { questionId: selectedIndex }
    this.timeRemaining = this.options.timeLimitMinutes * 60;
    this.timerId = null;
    this.isFinished = false;
    this.startTime = null;
    this.endTime = null;
    this.onTick = null;
    this.onTimeUp = null;
  }

  filterAndPrepare() {
    let list = [...this.allQuestions];
    if (this.options.filterType !== 'all') {
      list = list.filter(q => q.type === this.options.filterType);
    }
    if (this.options.shuffle) {
      list = this.shuffleArray(list);
    }
    return list;
  }

  shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  startTimer() {
    if (this.options.mode !== 'exam') return;
    this.startTime = Date.now();
    this.timerId = setInterval(() => {
      this.timeRemaining--;
      if (typeof this.onTick === 'function') {
        this.onTick(this.timeRemaining);
      }
      if (this.timeRemaining <= 0) {
        this.stopTimer();
        if (typeof this.onTimeUp === 'function') {
          this.onTimeUp();
        }
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (!this.endTime) {
      this.endTime = Date.now();
    }
  }

  getCurrentQuestion() {
    return this.filteredQuestions[this.currentIndex];
  }

  selectAnswer(qId, optionIndex) {
    this.userAnswers[qId] = optionIndex;
  }

  getUserAnswer(qId) {
    return this.userAnswers[qId] !== undefined ? this.userAnswers[qId] : null;
  }

  hasAnswered(qId) {
    return this.userAnswers[qId] !== undefined;
  }

  goToNext() {
    if (this.currentIndex < this.filteredQuestions.length - 1) {
      this.currentIndex++;
      return true;
    }
    return false;
  }

  goToPrev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return true;
    }
    return false;
  }

  jumpTo(index) {
    if (index >= 0 && index < this.filteredQuestions.length) {
      this.currentIndex = index;
      return true;
    }
    return false;
  }

  calculateResults() {
    this.stopTimer();
    this.isFinished = true;
    
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    const breakdownByType = {
      creative: { total: 0, correct: 0 },
      general: { total: 0, correct: 0 },
      mixed: { total: 0, correct: 0 }
    };

    const details = this.filteredQuestions.map(q => {
      const selected = this.userAnswers[q.id];
      const hasAnswer = selected !== undefined;
      const isCorrect = hasAnswer && selected === q.answer;

      if (!breakdownByType[q.type]) {
        breakdownByType[q.type] = { total: 0, correct: 0 };
      }
      breakdownByType[q.type].total++;

      if (isCorrect) {
        correctCount++;
        breakdownByType[q.type].correct++;
      } else if (hasAnswer) {
        incorrectCount++;
      } else {
        skippedCount++;
      }

      return {
        question: q,
        selected,
        isCorrect,
        status: !hasAnswer ? 'skipped' : (isCorrect ? 'correct' : 'incorrect')
      };
    });

    const total = this.filteredQuestions.length;
    const scorePercentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const timeSpentSeconds = this.startTime 
      ? Math.round(((this.endTime || Date.now()) - this.startTime) / 1000)
      : (this.options.timeLimitMinutes * 60 - this.timeRemaining);

    return {
      total,
      correctCount,
      incorrectCount,
      skippedCount,
      scorePercentage,
      timeSpentSeconds,
      breakdownByType,
      details
    };
  }
}
