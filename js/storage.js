const STORAGE_KEY = 'quiz_app_v1_history';
const ACTIVE_USER_KEY = 'quiz_app_v1_active_user';

export class StorageService {
  static getActiveUser() {
    return localStorage.getItem(ACTIVE_USER_KEY) || '';
  }

  static setActiveUser(name) {
    if (name && name.trim()) {
      localStorage.setItem(ACTIVE_USER_KEY, name.trim());
    }
  }

  static clearActiveUser() {
    localStorage.removeItem(ACTIVE_USER_KEY);
  }

  static getAllRecords() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed reading records from localStorage', e);
      return [];
    }
  }

  static saveAttempt(record) {
    const records = this.getAllRecords();
    const entry = {
      id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      studentName: record.studentName || 'Anonymous Scholar',
      moduleId: record.moduleId || 'history-102',
      moduleTitle: record.moduleTitle || 'HIS 102 & 205',
      scorePercentage: record.scorePercentage,
      correctCount: record.correctCount,
      incorrectCount: record.incorrectCount,
      skippedCount: record.skippedCount,
      totalQuestions: record.totalQuestions,
      timeSpentSeconds: record.timeSpentSeconds,
      breakdownByType: record.breakdownByType
    };
    records.unshift(entry); // newest first
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return entry;
  }

  static getUserRecords(studentName) {
    const all = this.getAllRecords();
    if (!studentName) return all;
    return all.filter(r => r.studentName.toLowerCase() === studentName.toLowerCase().trim());
  }

  static clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
  }
}
