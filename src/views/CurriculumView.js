/**
 * CurriculumView.js
 * View pour le curriculum : Niveaux, Unités, Modules, Leçons, Recherche, Filtres.
 *
 * Événements capturés → transmis au CurriculumController.
 */

import { BaseView } from './BaseView.js';

/**
 * @class CurriculumView
 * @extends BaseView
 * Gère l'affichage du curriculum pédagogique structuré.
 */
export class CurriculumView extends BaseView {
  constructor(options = {}) {
    super({
      viewName: 'CurriculumView',
      ...options
    });

    this.viewMode = 'levels'; // 'levels' | 'units' | 'modules' | 'lessons' | 'lesson'
    this.selectedLevel = null;
    this.selectedUnit = null;
    this.selectedModule = null;
    this.selectedLesson = null;
    this.searchQuery = '';
    this.activeFilters = {};
  }

  // ============================================================
  // Rendu principal
  // ============================================================

  /**
   * Rend l'interface du curriculum.
   * @returns {HTMLElement}
   */
  render() {
    this.clear();

    const wrapper = this.createElement('div', {
      classNames: ['curriculum-view'],
      attributes: { 'data-curriculum-view': '', 'data-view-mode': this.viewMode }
    });

    // Barre de recherche (toujours visible)
    wrapper.appendChild(this._renderSearchBar());

    // Navigation en fil d'Ariane
    wrapper.appendChild(this._renderBreadcrumb());

    // Contenu principal selon le mode
    const content = this.createElement('div', {
      classNames: ['curriculum-content']
    });

    switch (this.viewMode) {
      case 'levels':
        content.appendChild(this._renderLevelsView());
        break;
      case 'units':
        content.appendChild(this._renderUnitsView());
        break;
      case 'modules':
        content.appendChild(this._renderModulesView());
        break;
      case 'lessons':
        content.appendChild(this._renderLessonsView());
        break;
      case 'lesson':
        content.appendChild(this._renderLessonDetailView());
        break;
      case 'search':
        content.appendChild(this._renderSearchResultsView());
        break;
    }

    wrapper.appendChild(content);
    this.container.appendChild(wrapper);
    return this.container;
  }

  // ============================================================
  // Barre de recherche
  // ============================================================

  /**
   * Rend la barre de recherche.
   * @returns {HTMLElement}
   * @private
   */
  _renderSearchBar() {
    return this.createElement('div', {
      classNames: ['curriculum-search'],
      innerHTML: `
        <div class="search-input-wrapper">
          <span class="search-icon" aria-hidden="true">🔍</span>
          <input 
            type="search" 
            class="form-input form-input--large" 
            id="curriculum-search"
            placeholder="Rechercher une leçon, un concept, une règle de grammaire..."
            value="${this._escapeHtml(this.searchQuery)}"
            aria-label="Rechercher dans le curriculum"
          />
          <button class="btn btn--primary" data-action="search">Rechercher</button>
        </div>
        <div class="search-filters">
          <select class="form-select" data-filter="level" aria-label="Filtrer par niveau">
            <option value="">Niveau</option>
            <option value="A1" ${this.activeFilters.level === 'A1' ? 'selected' : ''}>A1</option>
            <option value="A2" ${this.activeFilters.level === 'A2' ? 'selected' : ''}>A2</option>
            <option value="B1" ${this.activeFilters.level === 'B1' ? 'selected' : ''}>B1</option>
            <option value="B2" ${this.activeFilters.level === 'B2' ? 'selected' : ''}>B2</option>
            <option value="C1" ${this.activeFilters.level === 'C1' ? 'selected' : ''}>C1</option>
            <option value="C2" ${this.activeFilters.level === 'C2' ? 'selected' : ''}>C2</option>
          </select>
          <select class="form-select" data-filter="category" aria-label="Filtrer par catégorie">
            <option value="">Catégorie</option>
            <option value="grammar" ${this.activeFilters.category === 'grammar' ? 'selected' : ''}>Grammaire</option>
            <option value="vocabulary" ${this.activeFilters.category === 'vocabulary' ? 'selected' : ''}>Vocabulaire</option>
            <option value="pronunciation" ${this.activeFilters.category === 'pronunciation' ? 'selected' : ''}>Prononciation</option>
            <option value="culture" ${this.activeFilters.category === 'culture' ? 'selected' : ''}>Culture</option>
            <option value="conversation" ${this.activeFilters.category === 'conversation' ? 'selected' : ''}>Conversation</option>
          </select>
          <select class="form-select" data-filter="difficulty" aria-label="Filtrer par difficulté">
            <option value="">Difficulté</option>
            <option value="easy" ${this.activeFilters.difficulty === 'easy' ? 'selected' : ''}>Facile</option>
            <option value="medium" ${this.activeFilters.difficulty === 'medium' ? 'selected' : ''}>Moyen</option>
            <option value="hard" ${this.activeFilters.difficulty === 'hard' ? 'selected' : ''}>Difficile</option>
          </select>
        </div>
      `
    });
  }

  // ============================================================
  // Fil d'Ariane
  // ============================================================

  /**
   * Rend le fil d'Ariane de navigation.
   * @returns {HTMLElement}
   * @private
   */
  _renderBreadcrumb() {
    const items = [{ label: 'Niveaux', view: 'levels', active: this.viewMode === 'levels' }];

    if (this.selectedLevel) {
      items.push({
        label: `Niveau ${this.selectedLevel}`,
        view: 'units',
        active: this.viewMode === 'units',
        data: { level: this.selectedLevel }
      });
    }

    if (this.selectedUnit) {
      items.push({
        label: this.selectedUnit.title || 'Unité',
        view: 'modules',
        active: this.viewMode === 'modules',
        data: { unit: this.selectedUnit }
      });
    }

    if (this.selectedModule) {
      items.push({
        label: this.selectedModule.title || 'Module',
        view: 'lessons',
        active: this.viewMode === 'lessons',
        data: { module: this.selectedModule }
      });
    }

    if (this.selectedLesson && this.viewMode === 'lesson') {
      items.push({
        label: this.selectedLesson.title || 'Leçon',
        view: 'lesson',
        active: true,
        data: { lesson: this.selectedLesson }
      });
    }

    return this.createElement('nav', {
      classNames: ['curriculum-breadcrumb'],
      attributes: { 'aria-label': 'Fil d\'Ariane' },
      innerHTML: `
        <ol class="breadcrumb-list">
          ${items.map((item, index) => `
            <li class="breadcrumb-item ${item.active ? 'breadcrumb-item--active' : ''}">
              ${!item.active
                ? `<button class="breadcrumb-link" data-navigate="${item.view}" ${item.data ? `data-context='${JSON.stringify(item.data)}'` : ''}>${item.label}</button>`
                : `<span aria-current="page">${item.label}</span>`
              }
            </li>
          `).join('')}
        </ol>
      `
    });
  }

  // ============================================================
  // Vue: Niveaux CECRL
  // ============================================================

  /**
   * Rend la vue des niveaux CECRL.
   * @returns {HTMLElement}
   * @private
   */
  _renderLevelsView() {
    const levels = this.controller?.getLevels?.() || [];

    const section = this.createElement('section', {
      classNames: ['curriculum-section', 'levels-view'],
      attributes: { 'aria-labelledby': 'levels-title' }
    });

    section.innerHTML = `
      <h2 id="levels-title" class="section-title section-title--centered">Parcours d'apprentissage</h2>
      <p class="section-subtitle">Sélectionnez votre niveau selon le Cadre Européen Commun de Référence</p>

      <div class="levels-path">
        ${levels.map((level, index) => `
          <article class="level-card level-card--${level.code?.toLowerCase()} ${level.locked ? 'level-card--locked' : ''} ${level.inProgress ? 'level-card--in-progress' : ''} ${level.completed ? 'level-card--completed' : ''}"
                   data-level-code="${level.code}"
                   data-action="select-level">
            <div class="level-card__badge">
              <span class="level-code">${level.code}</span>
            </div>
            <div class="level-card__content">
              <h3 class="level-card__title">${this._escapeHtml(level.name)}</h3>
              <p class="level-card__description">${this._escapeHtml(level.description)}</p>
              <div class="level-card__meta">
                ${level.progress !== undefined ? `
                  <div class="level-progress">
                    <div class="level-progress__bar">
                      <div class="level-progress__fill" style="width: ${level.progress}%"></div>
                    </div>
                    <span>${level.progress}%</span>
                  </div>
                ` : ''}
                <span class="level-card__count">${level.unitCount || 0} unités</span>
              </div>
            </div>
            <div class="level-card__status">
              ${level.completed ? '<span class="status-badge status-badge--completed" aria-label="Terminé">✅</span>' : ''}
              ${level.inProgress ? '<span class="status-badge status-badge--in-progress" aria-label="En cours">📖</span>' : ''}
              ${level.locked ? '<span class="status-badge status-badge--locked" aria-label="Verrouillé">🔒</span>' : ''}
            </div>
          </article>
        `).join('')}
      </div>
    `;

    return section;
  }

  // ============================================================
  // Vue: Unités
  // ============================================================

  /**
   * Rend la vue des unités d'un niveau.
   * @returns {HTMLElement}
   * @private
   */
  _renderUnitsView() {
    const units = this.controller?.getUnits?.(this.selectedLevel) || [];

    const section = this.createElement('section', {
      classNames: ['curriculum-section', 'units-view'],
      attributes: { 'aria-labelledby': 'units-title' }
    });

    section.innerHTML = `
      <div class="section-header">
        <h2 id="units-title" class="section-title">Unités - Niveau ${this.selectedLevel}</h2>
        <span class="section-count">${units.length} unité${units.length > 1 ? 's' : ''}</span>
      </div>

      ${units.length === 0
        ? this._renderEmptyState('Aucune unité disponible pour ce niveau', '📚')
        : `<div class="units-grid">
            ${units.map((unit, index) => `
              <article class="unit-card ${unit.locked ? 'unit-card--locked' : ''} ${unit.completed ? 'unit-card--completed' : ''}"
                       data-unit-id="${unit.id}"
                       data-action="select-unit">
                <div class="unit-card__number">${unit.number || index + 1}</div>
                <div class="unit-card__content">
                  <h3 class="unit-card__title">${this._escapeHtml(unit.title)}</h3>
                  <p class="unit-card__description">${this._escapeHtml(unit.description)}</p>
                  <div class="unit-card__meta">
                    <span><span aria-hidden="true">📦</span> ${unit.moduleCount || 0} modules</span>
                    <span><span aria-hidden="true">⏱️</span> ${unit.duration || 0}h</span>
                  </div>
                  ${unit.progress !== undefined ? `
                    <div class="unit-progress">
                      <div class="progress-bar">
                        <div class="progress-bar__fill" style="width: ${unit.progress}%"></div>
                      </div>
                      <span>${unit.progress}%</span>
                    </div>
                  ` : ''}
                </div>
                <div class="unit-card__status">
                  ${unit.locked ? '🔒' : unit.completed ? '✅' : '→'}
                </div>
              </article>
            `).join('')}
          </div>`
      }
    `;

    return section;
  }

  // ============================================================
  // Vue: Modules
  // ============================================================

  /**
   * Rend la vue des modules d'une unité.
   * @returns {HTMLElement}
   * @private
   */
  _renderModulesView() {
    const modules = this.controller?.getModules?.(this.selectedUnit?.id) || [];

    const section = this.createElement('section', {
      classNames: ['curriculum-section', 'modules-view'],
      attributes: { 'aria-labelledby': 'modules-title' }
    });

    section.innerHTML = `
      <div class="section-header">
        <h2 id="modules-title" class="section-title">${this._escapeHtml(this.selectedUnit?.title || 'Modules')}</h2>
        <span class="section-count">${modules.length} module${modules.length > 1 ? 's' : ''}</span>
      </div>

      ${modules.length === 0
        ? this._renderEmptyState('Aucun module dans cette unité', '📦')
        : `<div class="modules-list">
            ${modules.map((mod, index) => `
              <article class="module-card ${mod.locked ? 'module-card--locked' : ''} ${mod.completed ? 'module-card--completed' : ''}"
                       data-module-id="${mod.id}"
                       data-action="select-module">
                <div class="module-card__header">
                  <span class="module-card__number">${index + 1}</span>
                  <h3 class="module-card__title">${this._escapeHtml(mod.title)}</h3>
                  <div class="module-card__actions">
                    ${mod.locked
                      ? '<span class="module-status" aria-label="Verrouillé">🔒</span>'
                      : mod.completed
                        ? '<span class="module-status" aria-label="Terminé">✅</span>'
                        : '<span class="module-status" aria-label="Disponible">→</span>'
                    }
                  </div>
                </div>
                <p class="module-card__description">${this._escapeHtml(mod.description)}</p>
                <div class="module-card__meta">
                  <span><span aria-hidden="true">📖</span> ${mod.lessonCount || 0} leçons</span>
                  <span><span aria-hidden="true">⏱️</span> ${mod.duration || 0} min</span>
                  <span><span aria-hidden="true">📝</span> ${mod.quizCount || 0} quiz</span>
                </div>
                ${mod.topics?.length ? `
                  <div class="module-card__topics">
                    ${mod.topics.map(topic => `
                      <span class="topic-tag">${this._escapeHtml(topic)}</span>
                    `).join('')}
                  </div>
                ` : ''}
              </article>
            `).join('')}
          </div>`
      }
    `;

    return section;
  }

  // ============================================================
  // Vue: Leçons
  // ============================================================

  /**
   * Rend la vue des leçons d'un module.
   * @returns {HTMLElement}
   * @private
   */
  _renderLessonsView() {
    const lessons = this.controller?.getLessons?.(this.selectedModule?.id) || [];

    const section = this.createElement('section', {
      classNames: ['curriculum-section', 'lessons-view'],
      attributes: { 'aria-labelledby': 'lessons-title' }
    });

    section.innerHTML = `
      <div class="section-header">
        <h2 id="lessons-title" class="section-title">${this._escapeHtml(this.selectedModule?.title || 'Leçons')}</h2>
        <span class="section-count">${lessons.length} leçon${lessons.length > 1 ? 's' : ''}</span>
      </div>

      ${lessons.length === 0
        ? this._renderEmptyState('Aucune leçon dans ce module', '📖')
        : `<ul class="lessons-list" role="list">
            ${lessons.map((lesson, index) => `
              <li class="lesson-item ${lesson.locked ? 'lesson-item--locked' : ''} ${lesson.completed ? 'lesson-item--completed' : ''} ${lesson.inProgress ? 'lesson-item--in-progress' : ''}"
                  data-lesson-id="${lesson.id}"
                  role="listitem">
                <div class="lesson-item__marker">
                  ${lesson.completed
                    ? '<span class="lesson-check" aria-label="Terminé">✅</span>'
                    : lesson.locked
                      ? '<span class="lesson-lock" aria-label="Verrouillé">🔒</span>'
                      : `<span class="lesson-number">${index + 1}</span>`
                  }
                </div>
                <div class="lesson-item__content">
                  <h3 class="lesson-item__title">
                    <button class="btn btn--link lesson-link" data-action="open-lesson" data-lesson-id="${lesson.id}">
                      ${this._escapeHtml(lesson.title)}
                    </button>
                  </h3>
                  <p class="lesson-item__description">${this._escapeHtml(lesson.description)}</p>
                  <div class="lesson-item__meta">
                    <span class="lesson-type-badge lesson-type-badge--${lesson.type}">${this._getLessonTypeLabel(lesson.type)}</span>
                    <span><span aria-hidden="true">⏱️</span> ${lesson.duration || 0} min</span>
                    ${lesson.hasQuiz ? '<span><span aria-hidden="true">📝</span> Quiz</span>' : ''}
                  </div>
                </div>
                ${lesson.progress !== undefined && !lesson.locked ? `
                  <div class="lesson-item__progress">
                    <div class="progress-ring" style="--progress: ${lesson.progress}">
                      <span>${lesson.progress}%</span>
                    </div>
                  </div>
                ` : ''}
              </li>
            `).join('')}
          </ul>`
      }
    `;

    return section;
  }

  // ============================================================
  // Vue: Détail d'une leçon
  // ============================================================

  /**
   * Rend la vue détaillée d'une leçon.
   * @returns {HTMLElement}
   * @private
   */
  _renderLessonDetailView() {
    const lesson = this.selectedLesson;
    if (!lesson) return this.createElement('div');

    const section = this.createElement('article', {
      classNames: ['curriculum-section', 'lesson-detail'],
      attributes: { 'aria-labelledby': 'lesson-title' }
    });

    section.innerHTML = `
      <header class="lesson-detail__header">
        <div class="lesson-detail__meta">
          <span class="badge badge--${lesson.level?.toLowerCase()}">${lesson.level}</span>
          <span class="lesson-type-badge lesson-type-badge--${lesson.type}">${this._getLessonTypeLabel(lesson.type)}</span>
          <span><span aria-hidden="true">⏱️</span> ${lesson.duration || 0} min</span>
        </div>
        <h2 id="lesson-title" class="lesson-detail__title">${this._escapeHtml(lesson.title)}</h2>
        <p class="lesson-detail__description">${this._escapeHtml(lesson.description)}</p>
      </header>

      <div class="lesson-detail__content">
        ${lesson.content?.map(block => this._renderContentBlock(block)).join('') || '<p>Contenu en cours de chargement...</p>'}
      </div>

      ${lesson.vocabulary?.length ? `
        <aside class="lesson-detail__vocabulary">
          <h3 class="lesson-sidebar__title">📚 Vocabulaire clé</h3>
          <dl class="vocabulary-list">
            ${lesson.vocabulary.map(v => `
              <div class="vocabulary-item">
                <dt class="vocabulary-term">${this._escapeHtml(v.word)}</dt>
                <dd class="vocabulary-definition">${this._escapeHtml(v.definition)}</dd>
                ${v.example ? `<dd class="vocabulary-example">« ${this._escapeHtml(v.example)} »</dd>` : ''}
              </div>
            `).join('')}
          </dl>
        </aside>
      ` : ''}

      ${lesson.resources?.length ? `
        <aside class="lesson-detail__resources">
          <h3 class="lesson-sidebar__title">📎 Ressources</h3>
          <ul class="resources-list">
            ${lesson.resources.map(r => `
              <li class="resource-item">
                <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="resource-link">
                  <span aria-hidden="true">${r.type === 'pdf' ? '📄' : r.type === 'audio' ? '🔊' : r.type === 'video' ? '🎬' : '🔗'}</span>
                  ${this._escapeHtml(r.title)}
                </a>
              </li>
            `).join('')}
          </ul>
        </aside>
      ` : ''}

      <footer class="lesson-detail__footer">
        <div class="lesson-navigation">
          ${lesson.prevLesson
            ? `<button class="btn btn--outline" data-action="navigate-lesson" data-direction="prev" data-lesson-id="${lesson.prevLesson.id}">
                ← ${this._escapeHtml(lesson.prevLesson.title)}
              </button>`
            : '<span></span>'
          }
          ${lesson.nextLesson
            ? `<button class="btn btn--primary" data-action="navigate-lesson" data-direction="next" data-lesson-id="${lesson.nextLesson.id}">
                ${this._escapeHtml(lesson.nextLesson.title)} →
              </button>`
            : '<span></span>'
          }
        </div>

        ${lesson.hasQuiz ? `
          <button class="btn btn--primary btn--large" data-action="start-lesson-quiz" data-lesson-id="${lesson.id}">
            📝 Faire le quiz de cette leçon
          </button>
        ` : ''}

        ${!lesson.completed ? `
          <button class="btn btn--outline btn--large" data-action="mark-lesson-complete" data-lesson-id="${lesson.id}">
            ✅ Marquer comme terminé
          </button>
        ` : `
          <span class="lesson-complete-badge">✅ Leçon terminée</span>
        `}
      </footer>
    `;

    return section;
  }

  /**
   * Rend un bloc de contenu de leçon.
   * @param {Object} block
   * @returns {string}
   * @private
   */
  _renderContentBlock(block) {
    switch (block.type) {
      case 'text':
        return `<div class="content-block content-block--text"><p>${this._escapeHtml(block.content)}</p></div>`;
      case 'heading':
        return `<h3 class="content-block content-block--heading">${this._escapeHtml(block.content)}</h3>`;
      case 'example':
        return `
          <div class="content-block content-block--example">
            <p class="example-label">Exemple</p>
            <p class="example-french">${this._escapeHtml(block.french)}</p>
            ${block.translation ? `<p class="example-translation">${this._escapeHtml(block.translation)}</p>` : ''}
          </div>`;
      case 'note':
        return `<div class="content-block content-block--note"><strong>💡 Note :</strong> ${this._escapeHtml(block.content)}</div>`;
      case 'warning':
        return `<div class="content-block content-block--warning"><strong>⚠️ Attention :</strong> ${this._escapeHtml(block.content)}</div>`;
      case 'audio':
        return `
          <div class="content-block content-block--audio">
            <button class="btn btn--icon" data-action="play-audio" data-audio-url="${block.url}">
              🔊 ${this._escapeHtml(block.label || 'Écouter')}
            </button>
          </div>`;
      case 'exercise':
        return `<div class="content-block content-block--exercise" data-inline-exercise="${block.id}"></div>`;
      case 'table':
        return `
          <div class="content-block content-block--table">
            <table class="data-table">
              ${block.headers ? `<thead><tr>${block.headers.map(h => `<th>${this._escapeHtml(h)}</th>`).join('')}</tr></thead>` : ''}
              <tbody>
                ${block.rows?.map(row => `<tr>${row.map(cell => `<td>${this._escapeHtml(cell)}</td>`).join('')}</tr>`).join('') || ''}
              </tbody>
            </table>
          </div>`;
      default:
        return `<div class="content-block">${this._escapeHtml(block.content)}</div>`;
    }
  }

  // ============================================================
  // Vue: Résultats de recherche
  // ============================================================

  /**
   * Rend la vue des résultats de recherche.
   * @returns {HTMLElement}
   * @private
   */
  _renderSearchResultsView() {
    const results = this.controller?.getSearchResults?.() || [];

    const section = this.createElement('section', {
      classNames: ['curriculum-section', 'search-results-view'],
      attributes: { 'aria-labelledby': 'search-results-title' }
    });

    section.innerHTML = `
      <div class="section-header">
        <h2 id="search-results-title" class="section-title">
          ${results.length} résultat${results.length > 1 ? 's' : ''} pour "${this._escapeHtml(this.searchQuery)}"
        </h2>
      </div>

      ${results.length === 0
        ? this._renderEmptyState('Aucun résultat trouvé. Essayez avec d\'autres termes.', '🔍')
        : `<div class="search-results">
            ${results.map((result, index) => `
              <article class="search-result-card" data-result-index="${index}" data-result-type="${result.type}">
                <div class="search-result__type">
                  <span class="result-type-badge result-type-badge--${result.type}">${this._getResultTypeLabel(result.type)}</span>
                  ${result.level ? `<span class="badge badge--${result.level.toLowerCase()}">${result.level}</span>` : ''}
                </div>
                <h3 class="search-result__title">
                  <button class="btn btn--link" data-action="open-search-result" data-result-id="${result.id}" data-result-type="${result.type}">
                    ${this._escapeHtml(result.title)}
                  </button>
                </h3>
                <p class="search-result__excerpt">${this._escapeHtml(result.excerpt)}</p>
                <div class="search-result__breadcrumb">
                  ${result.path?.map(p => `<span>${this._escapeHtml(p)}</span>`).join(' <span class="breadcrumb-sep">›</span> ') || ''}
                </div>
              </article>
            `).join('')}
          </div>`
      }
    `;

    return section;
  }

  // ============================================================
  // Navigation
  // ============================================================

  /**
   * Navigue vers un niveau.
   * @param {string} levelCode
   */
  selectLevel(levelCode) {
    this.selectedLevel = levelCode;
    this.viewMode = 'units';
    this.render();
  }

  /**
   * Navigue vers une unité.
   * @param {Object} unit
   */
  selectUnit(unit) {
    this.selectedUnit = unit;
    this.viewMode = 'modules';
    this.render();
  }

  /**
   * Navigue vers un module.
   * @param {Object} module
   */
  selectModule(module) {
    this.selectedModule = module;
    this.viewMode = 'lessons';
    this.render();
  }

  /**
   * Ouvre une leçon.
   * @param {Object} lesson
   */
  openLesson(lesson) {
    this.selectedLesson = lesson;
    this.viewMode = 'lesson';
    this.render();
  }

  /**
   * Effectue une recherche.
   * @param {string} query
   */
  search(query) {
    this.searchQuery = query;
    this.viewMode = 'search';
    this.controller?.onSearch?.(query, this.activeFilters);
  }

  /**
   * Met à jour les filtres.
   * @param {string} filterType
   * @param {string} value
   */
  setFilter(filterType, value) {
    if (value) {
      this.activeFilters[filterType] = value;
    } else {
      delete this.activeFilters[filterType];
    }
    if (this.searchQuery) {
      this.controller?.onSearch?.(this.searchQuery, this.activeFilters);
    }
  }

  // ============================================================
  // Événements
  // ============================================================

  _bindEvents() {
    // Recherche
    const searchInput = this.query('#curriculum-search');
    if (searchInput) {
      this.bind(searchInput, 'keydown', (e) => {
        if (e.key === 'Enter') {
          this.search(e.target.value.trim());
        }
      });
    }

    this.bind('[data-action="search"]', 'click', () => {
      const value = this.query('#curriculum-search')?.value?.trim();
      if (value) this.search(value);
    });

    // Filtres
    this.queryAll('[data-filter]').forEach(select => {
      this.bind(select, 'change', (e) => {
        this.setFilter(e.currentTarget.dataset.filter, e.target.value);
      });
    });

    // Fil d'Ariane
    this.queryAll('[data-navigate]').forEach(link => {
      this.bind(link, 'click', (e) => {
        const view = e.currentTarget.dataset.navigate;
        this.viewMode = view;
        if (view === 'levels') {
          this.selectedLevel = null;
          this.selectedUnit = null;
          this.selectedModule = null;
        } else if (view === 'units') {
          this.selectedUnit = null;
          this.selectedModule = null;
        } else if (view === 'modules') {
          this.selectedModule = null;
        }
        this.render();
      });
    });

    // Sélection de niveau
    this.queryAll('[data-action="select-level"]').forEach(card => {
      this.bind(card, 'click', (e) => {
        const levelCode = e.currentTarget.dataset.levelCode;
        this.controller?.onSelectLevel?.(levelCode);
      });
    });

    // Sélection d'unité
    this.queryAll('[data-action="select-unit"]').forEach(card => {
      this.bind(card, 'click', (e) => {
        const unitId = e.currentTarget.dataset.unitId;
        this.controller?.onSelectUnit?.(unitId);
      });
    });

    // Sélection de module
    this.queryAll('[data-action="select-module"]').forEach(card => {
      this.bind(card, 'click', (e) => {
        const moduleId = e.currentTarget.dataset.moduleId;
        this.controller?.onSelectModule?.(moduleId);
      });
    });

    // Ouvrir une leçon
    this.queryAll('[data-action="open-lesson"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        const lessonId = e.currentTarget.dataset.lessonId;
        this.controller?.onOpenLesson?.(lessonId);
      });
    });

    // Navigation entre leçons
    this.queryAll('[data-action="navigate-lesson"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        const lessonId = e.currentTarget.dataset.lessonId;
        this.controller?.onNavigateLesson?.(lessonId);
      });
    });

    // Marquer comme terminé
    this.queryAll('[data-action="mark-lesson-complete"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        const lessonId = e.currentTarget.dataset.lessonId;
        e.currentTarget.disabled = true;
        e.currentTarget.textContent = '✅ Terminé !';
        this.controller?.onMarkLessonComplete?.(lessonId);
      });
    });

    // Quiz de leçon
    this.queryAll('[data-action="start-lesson-quiz"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        const lessonId = e.currentTarget.dataset.lessonId;
        this.controller?.onStartLessonQuiz?.(lessonId);
      });
    });

    // Audio
    this.queryAll('[data-action="play-audio"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        const audioUrl = e.currentTarget.dataset.audioUrl;
        this.controller?.onPlayAudio?.(audioUrl);
      });
    });

    // Résultats de recherche
    this.queryAll('[data-action="open-search-result"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        const resultId = e.currentTarget.dataset.resultId;
        const resultType = e.currentTarget.dataset.resultType;
        this.controller?.onOpenSearchResult?.(resultId, resultType);
      });
    });
  }

  // ============================================================
  // Utilitaires
  // ============================================================

  _getLessonTypeLabel(type) {
    const labels = {
      theory: 'Théorie',
      exercise: 'Exercice',
      video: 'Vidéo',
      audio: 'Audio',
      quiz: 'Quiz',
      culture: 'Culture',
      conversation: 'Conversation'
    };
    return labels[type] || type;
  }

  _getResultTypeLabel(type) {
    const labels = {
      lesson: 'Leçon',
      module: 'Module',
      unit: 'Unité',
      vocabulary: 'Vocabulaire',
      grammar: 'Grammaire',
      exercise: 'Exercice'
    };
    return labels[type] || type;
  }

  _escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
