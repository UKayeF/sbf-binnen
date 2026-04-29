import { QuestionsJson, Question } from './models/questions';
import { QuizConfig, defaultQuizConfig, testImageQuizConfig, imageOnlyQuizConfig } from './models/quizConfig';
import fragenData from './data/fragen.json';

interface AppSettings {
  autoContinue: boolean;
  confirmBeforeSubmitting: boolean;
}

const defaultSettings: AppSettings = {
  autoContinue: true,
  confirmBeforeSubmitting: false
};

function loadSettings(): AppSettings {
  const stored = localStorage.getItem('quizSettings');
  if (stored) {
    return { ...defaultSettings, ...JSON.parse(stored) };
  }
  return { ...defaultSettings };
}

function saveSettings(settings: AppSettings): void {
  localStorage.setItem('quizSettings', JSON.stringify(settings));
}

interface QuizState {
  currentCategory: string;
  currentQuestionIndex: number;
  questions: Question[];
  answers: { question: string; selected: number; correct: boolean }[];
  categoryScores: Record<string, number>;
  showFeedback: boolean;
  lastSelectedIndex: number;
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function selectQuestions(questions: Question[], count: number): Question[] {
  return shuffle(questions).slice(0, count);
}

function shuffleAnswers(question: Question): Question {
  return {
    ...question,
    answers: shuffle(question.answers)
  };
}

function initQuiz(config: QuizConfig, testMode: string | null = null): QuizState {
  const state: QuizState = {
    currentCategory: '',
    currentQuestionIndex: 0,
    questions: [],
    answers: [],
    categoryScores: {},
    showFeedback: false,
    lastSelectedIndex: -1
  };

  if (testMode === 'bilder') {
    const allCategories = (fragenData as QuestionsJson).categories;
    let allQuestions: Question[] = [];
    for (const catQs of Object.values(allCategories)) {
      const withImages = (catQs as Question[]).filter(q => q.image);
      allQuestions.push(...withImages);
    }
    state.questions = allQuestions.map(shuffleAnswers);
    state.currentCategory = Object.keys(config.categories)[0];
    return state;
  }

  if (testMode === 'images-only') {
    const allCategories = (fragenData as QuestionsJson).categories;
    let allQuestions: Question[] = [];
    for (const catQs of Object.values(allCategories)) {
      for (const q of catQs as Question[]) {
        if (q.image || (q.images && q.images.length > 0)) {
          allQuestions.push(q);
        }
      }
    }
    state.questions = allQuestions;
    state.currentCategory = Object.keys(config.categories)[0];
    return state;
  }

  for (const [categoryName, categoryConfig] of Object.entries(config.categories)) {
    const categoryQuestions = (fragenData as QuestionsJson).categories[categoryName];
    if (categoryQuestions) {
      const selected = selectQuestions(categoryQuestions, categoryConfig.questionsCount);
      state.questions.push(...selected.map(shuffleAnswers));
      state.categoryScores[categoryName] = 0;
    }
  }

  if (state.questions.length > 0) {
    state.currentCategory = Object.keys(config.categories)[0];
  }

  return state;
}

function renderQuestion(state: QuizState, config: QuizConfig, showFeedback: boolean = false, selectedIndex: number = -1, confirmBeforeSubmitting: boolean = false, isEditMode: boolean = false): string {
  if (state.currentQuestionIndex >= state.questions.length) {
    return renderResults(state, config, isEditMode);
  }

  const question = state.questions[state.currentQuestionIndex];
  const categoryIndex = state.questions.slice(0, state.currentQuestionIndex)
    .filter((_, i) => getCategoryForQuestion(state, i) === state.currentCategory).length;
  const categoryConfig = config.categories[state.currentCategory] || { questionsCount: state.questions.length, passingThreshold: 0 };

  let html = `<h2>${state.currentCategory} (${categoryIndex + 1}/${categoryConfig.questionsCount})</h2>`;
  html += `<p class="question">${question.question}</p>`;
  
  const displayImages = question.image || [];
  for (const img of displayImages) {
    html += `<img class="question-image" src="${img}" alt="Frage-Bild" />`;
  }
  
  html += `<div class="answers">`;

  question.answers.forEach((answer, index) => {
    let classes = 'answer-btn';
    if (showFeedback) {
      if (answer.isCorrect) {
        classes += ' correct';
      } else if (index === selectedIndex) {
        classes += ' incorrect';
      }
    } else if (isEditMode && answer.isCorrect) {
      classes += ' correct';
    }
    html += `<button class="${classes}" data-index="${index}" ${showFeedback || isEditMode ? 'disabled' : ''}>${answer.text}</button>`;
  });

  html += `</div>`;
  
  if (question.needsFix) {
    html += `<p class="needsfix">⚠️ Bildzuordnung muss überprüft werden</p>`;
  }
  
  if (confirmBeforeSubmitting && !showFeedback) {
    html += `<button id="submit-btn" disabled>Absenden</button>`;
  }
  
  if (showFeedback) {
    html += `<button id="next-btn">Weiter</button>`;
  }
  
  if (isEditMode) {
    html += `<button id="next-question-btn">Nächste Frage</button>`;
  }
  return html;
}

function getCategoryForQuestion(state: QuizState, questionIndex: number): string {
  if (state.currentCategory.includes('Bilder')) {
    return state.currentCategory;
  }
  let questionCount = 0;
  for (const [categoryName, categoryConfig] of Object.entries(defaultQuizConfig.categories)) {
    const nextCount = questionCount + categoryConfig.questionsCount;
    if (questionIndex < nextCount) {
      return categoryName;
    }
    questionCount = nextCount;
  }
  return state.currentCategory;
}

function renderResults(state: QuizState, config: QuizConfig, isEditMode: boolean = false): string {
  let totalScore = 0;
  let html = `<h2>Ergebnisse</h2><table class="results"><thead><tr><th>Kategorie</th><th>Punkte</th><th>Bestanden</th></tr></thead><tbody>`;

  for (const [categoryName, categoryConfig] of Object.entries(config.categories)) {
    const score = state.categoryScores[categoryName] || 0;
    const passed = score >= categoryConfig.passingThreshold;
    if (passed) totalScore += score;
    html += `<tr><td>${categoryName}</td><td>${score}/${categoryConfig.questionsCount}</td><td>${passed ? '✓' : '✗'}</td></tr>`;
  }

  const totalPassed = totalScore >= config.totalPassingThreshold;
  html += `</tbody></table>`;
  html += `<p class="total">Gesamt: ${totalScore} Punkte - ${totalPassed ? 'BESTANDEN!' : 'NICHT BESTANDEN'}</p>`;
  html += `<button id="restart-btn">Neustart</button>`;
  html += `<button id="start-over-btn">Neu starten</button>`;
  
  if (isEditMode) {
    html += `<button id="save-changes-btn">Änderungen speichern</button>`;
  }
  return html;
}

function renderSettingsModal(settings: AppSettings): string {
  return `
    <div id="settings-modal" class="modal">
      <div class="modal-content">
        <h2>Einstellungen</h2>
        <label>
          <input type="checkbox" id="auto-continue" ${settings.autoContinue ? 'checked' : ''}>
          Automatisch weiter nach Auswahl (0.5s Verzögerung)
        </label>
        <label>
          <input type="checkbox" id="confirm-before-submitting" ${settings.confirmBeforeSubmitting ? 'checked' : ''}>
          Bestätigung vor dem Absenden
        </label>
        <button id="save-settings">Speichern</button>
        <button id="close-settings">Schließen</button>
      </div>
    </div>
  `;
}

function renderApp() {
  const app = document.getElementById('app');
  if (!app) return;

  let settings = loadSettings();
  let isEditMode = false;
  let selectedImages: string[] = [];

  const modalDiv = document.createElement('div');
  modalDiv.id = 'settings-modal-container';
  modalDiv.innerHTML = renderSettingsModal(settings);
  document.body.appendChild(modalDiv);

  const urlParams = new URLSearchParams(window.location.search);
  let testMode = urlParams.get('test');
  if (!testMode && urlParams.get('edit') === 'true') {
    testMode = 'images-only';
    isEditMode = true;
  }

  let config = defaultQuizConfig;
  if (testMode === 'bilder') {
    config = testImageQuizConfig;
  } else if (testMode === 'images-only') {
    config = imageOnlyQuizConfig;
  }
  
  let state = initQuiz(config, testMode);

  const imageModalDiv = document.createElement('div');
  imageModalDiv.id = 'image-modal-container';
  document.body.appendChild(imageModalDiv);

  function openSettings() {
    const modal = document.getElementById('settings-modal-container');
    const modalInner = document.getElementById('settings-modal');
    const settingsBtn = document.getElementById('settings-btn');
    
    settingsBtn?.addEventListener('click', () => {
      if (modalInner && modal) {
        modalInner.style.display = 'flex';
        modal.style.display = 'flex';
      }
    });
    
    document.getElementById('save-settings')?.addEventListener('click', () => {
      const autoContinue = (document.getElementById('auto-continue') as HTMLInputElement)?.checked ?? true;
      const confirmBeforeSubmitting = (document.getElementById('confirm-before-submitting') as HTMLInputElement)?.checked ?? false;
      settings = { autoContinue, confirmBeforeSubmitting };
      saveSettings(settings);
      if (modalInner) modalInner.style.display = 'none';
    });
    
    document.getElementById('close-settings')?.addEventListener('click', () => {
      if (modalInner) modalInner.style.display = 'none';
    });
  }

  function setupImageListEvents() {
    const selectBtn = document.getElementById('select-image-btn') as HTMLButtonElement | null;
    const closeBtn = document.getElementById('close-image-modal');
    const modalInner = document.getElementById('image-modal');
    
    document.querySelectorAll('.image-list-item').forEach(item => {
      item.addEventListener('click', () => {
        const img = (item as HTMLElement).dataset.image || '';
        if (selectedImages.includes(img)) {
          selectedImages = selectedImages.filter(i => i !== img);
          item.classList.remove('selected');
        } else {
          selectedImages.push(img);
          item.classList.add('selected');
        }
        if (selectBtn) selectBtn.disabled = selectedImages.length === 0;
      });
    });
    
    selectBtn?.addEventListener('click', () => {
      if (selectedImages.length > 0) {
        const q = state.questions[state.currentQuestionIndex];
        if (selectedImages.length === 1) {
          q.image = selectedImages[0];
          q.images = undefined;
        } else {
          q.image = undefined;
          q.images = selectedImages;
        }
        delete q.needsFix;

        const editBtn = document.getElementById('edit-mappings-btn');
        if (editBtn) {
          const newImages = q.images || (q.image ? [q.image] : []);
          editBtn.textContent = `Bearbeiten (${newImages.length} Bild${newImages.length > 1 ? 'er' : ''})`;
        }
      }
      if (modalInner) modalInner.style.display = 'none';
    });
    
    closeBtn?.addEventListener('click', () => {
      if (modalInner) modalInner.style.display = 'none';
    });
  }
  
  function submitAnswer(selectedIndex: number) {
    const question = state.questions[state.currentQuestionIndex];
    const isCorrect = question.answers[selectedIndex].isCorrect;
    
    const currentCat = getCategoryForQuestion(state, state.currentQuestionIndex);
    if (isCorrect) {
      state.categoryScores[currentCat] = (state.categoryScores[currentCat] || 0) + 1;
    }
    
    state.answers.push({
      question: question.question,
      selected: selectedIndex,
      correct: isCorrect
    });
    
    state.showFeedback = true;
    state.lastSelectedIndex = selectedIndex;
    
    render();
  }

  function render() {
    const headerButtons = `<div class="header"><button id="settings-btn">⚙️ Einstellungen</button>${isEditMode ? `<button id="edit-mappings-btn">📝 Bildzuordnungen bearbeiten</button>` : ''}</div>`;
    
    if (state.showFeedback) {
      app!.innerHTML = headerButtons + renderQuestion(state, config, true, state.lastSelectedIndex, false, isEditMode);
      openSettings();
      setupImageListEvents();
      
      if (settings.autoContinue) {
        setTimeout(() => {
          if (state.currentQuestionIndex < state.questions.length) {
            state.currentQuestionIndex++;
            state.showFeedback = false;
            
            const nextCat = getCategoryForQuestion(state, state.currentQuestionIndex);
            if (nextCat !== state.currentCategory) {
              state.currentCategory = nextCat;
            }
            
            render();
          }
        }, 500);
      }
      
      document.getElementById('next-btn')?.addEventListener('click', () => {
        state.currentQuestionIndex++;
        state.showFeedback = false;
        
        if (state.currentQuestionIndex < state.questions.length) {
          const nextCat = getCategoryForQuestion(state, state.currentQuestionIndex);
          if (nextCat !== state.currentCategory) {
            state.currentCategory = nextCat;
          }
        }
        
        render();
      });
    } else if (state.currentQuestionIndex >= state.questions.length) {
      app!.innerHTML = headerButtons + renderResults(state, config, isEditMode);
      openSettings();
      setupImageListEvents();
      
      document.getElementById('restart-btn')?.addEventListener('click', () => {
        state.currentQuestionIndex = 0;
        state.showFeedback = false;
        state.answers = [];
        state.categoryScores = {};
        for (const cat of Object.keys(state.categoryScores)) {
          state.categoryScores[cat] = 0;
        }
        render();
      });
      
      document.getElementById('start-over-btn')?.addEventListener('click', () => {
        location.reload();
      });
      
      document.getElementById('save-changes-btn')?.addEventListener('click', () => {
        const fragenExport = JSON.stringify(fragenData, null, 2);
        const blob = new Blob([fragenExport], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fragen.json';
        a.click();
        URL.revokeObjectURL(url);
      });
    } else {
      app!.innerHTML = headerButtons + renderQuestion(state, config, false, -1, settings.confirmBeforeSubmitting, isEditMode);
      openSettings();
      setupImageListEvents();

      let pendingIndex: number | null = null;

      document.querySelectorAll('.answer-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const target = e.target as HTMLButtonElement;
          const selectedIndex = parseInt(target.dataset.index || '0');
          
          if (settings.confirmBeforeSubmitting) {
            pendingIndex = selectedIndex;
            document.querySelectorAll('.answer-btn').forEach(b => b.classList.remove('selected'));
            target.classList.add('selected');
            const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement | null;
            if (submitBtn) submitBtn.disabled = false;
          } else {
            submitAnswer(selectedIndex);
          }
        });
      });
      
      document.getElementById('submit-btn')?.addEventListener('click', () => {
        if (pendingIndex === null) return;

        const question = state.questions[state.currentQuestionIndex];
        const isCorrect = question.answers[pendingIndex].isCorrect;
        
        const currentCat = getCategoryForQuestion(state, state.currentQuestionIndex);
        if (isCorrect) {
          state.categoryScores[currentCat] = (state.categoryScores[currentCat] || 0) + 1;
        }
        
        state.answers.push({
          question: question.question,
          selected: pendingIndex,
          correct: isCorrect
        });
        
        state.showFeedback = true;
        state.lastSelectedIndex = pendingIndex;
        
        render();
      });
    }
  }

  render();
}

document.addEventListener('DOMContentLoaded', renderApp);