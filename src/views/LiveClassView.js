/**
 * LiveClassView.js
 * Vue pour les cours en direct
 */

export class LiveClassView {
  constructor(containerId, userRole = 'student') {
    this.container = document.getElementById(containerId);
    this.userRole = userRole; // 'student', 'teacher', 'admin'
    
    if (!this.container) {
      console.warn(`[LiveClassView] Container #${containerId} not found`);
    }
  }

  // ============================================
  // RENDER - UPCOMING
  // ============================================

  renderUpcoming(liveClasses) {
    if (!this.container) return;

    if (liveClasses.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">📅</div>
          <h3>Aucun cours à venir</h3>
          <p>Les cours en direct seront listés ici</p>
        </div>
      `;
      return;
    }

    const html = `
      <div class="live-classes-grid">
        ${liveClasses.map(lc => this._renderUpcomingCard(lc)).join('')}
      </div>
    `;
    this.container.innerHTML = html;
    this._attachUpcomingHandlers(liveClasses);
  }

  _renderUpcomingCard(liveClass) {
    const startDate = new Date(liveClass.startDate);
    const formattedDate = startDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const meetingIcon = this._getMeetingIcon(liveClass.meetingProvider);

    return `
      <div class="live-class-card live-class-card--upcoming">
        <div class="live-class-card__header">
          <h3 class="live-class-card__title">${this._escape(liveClass.title)}</h3>
          <span class="badge badge--info">${liveClass.level}</span>
        </div>
        <p class="live-class-card__description">${this._escape(liveClass.description || '')}</p>
        <div class="live-class-card__meta">
          <div class="meta-item">
            <span class="meta-icon">📅</span>
            <span>${formattedDate}</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">⏱️</span>
            <span>${liveClass.duration} min</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">${meetingIcon}</span>
            <span>${this._formatProvider(liveClass.meetingProvider)}</span>
          </div>
        </div>
        <div class="live-class-card__actions">
          <button class="btn btn--primary" data-action="join" data-id="${liveClass.id}">
            Rejoindre
          </button>
          <button class="btn btn--secondary" data-action="details" data-id="${liveClass.id}">
            Détails
          </button>
        </div>
      </div>
    `;
  }

  _attachUpcomingHandlers(liveClasses) {
    const cards = this.container.querySelectorAll('.live-class-card');
    cards.forEach((card, idx) => {
      const joinBtn = card.querySelector('[data-action="join"]');
      const detailsBtn = card.querySelector('[data-action="details"]');
      
      if (joinBtn) {
        joinBtn.addEventListener('click', () => {
          this.onJoinClick?.(liveClasses[idx].id);
        });
      }
      
      if (detailsBtn) {
        detailsBtn.addEventListener('click', () => {
          this.onDetailsClick?.(liveClasses[idx].id);
        });
      }
    });
  }

  // ============================================
  // RENDER - LIVE NOW
  // ============================================

  renderLive(liveClasses) {
    if (!this.container) return;

    if (liveClasses.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">📡</div>
          <h3>Aucun cours en direct actuellement</h3>
          <p>Revenez bientôt !</p>
        </div>
      `;
      return;
    }

    const html = `
      <div class="live-now-section">
        <div class="section-header">
          <h2 class="section-title">🔴 EN DIRECT MAINTENANT</h2>
          <span class="live-badge">EN DIRECT</span>
        </div>
        <div class="live-classes-grid">
          ${liveClasses.map(lc => this._renderLiveCard(lc)).join('')}
        </div>
      </div>
    `;
    this.container.innerHTML = html;
    this._attachLiveHandlers(liveClasses);
  }

  _renderLiveCard(liveClass) {
    const attendanceCount = liveClass.attendance?.length || 0;
    const meetingIcon = this._getMeetingIcon(liveClass.meetingProvider);

    return `
      <div class="live-class-card live-class-card--live">
        <div class="live-class-card__badge">🔴 DIRECT</div>
        <div class="live-class-card__header">
          <h3 class="live-class-card__title">${this._escape(liveClass.title)}</h3>
          <span class="badge badge--success">${liveClass.level}</span>
        </div>
        <p class="live-class-card__description">${this._escape(liveClass.description || '')}</p>
        <div class="live-class-card__stats">
          <div class="stat">
            <span class="stat-icon">👥</span>
            <span>${attendanceCount} participant(s)</span>
          </div>
          <div class="stat">
            <span class="stat-icon">${meetingIcon}</span>
            <span>${this._formatProvider(liveClass.meetingProvider)}</span>
          </div>
        </div>
        <div class="live-class-card__actions">
          <button class="btn btn--success" data-action="join-live" data-id="${liveClass.id}">
            Rejoindre maintenant
          </button>
        </div>
      </div>
    `;
  }

  _attachLiveHandlers(liveClasses) {
    const cards = this.container.querySelectorAll('.live-class-card--live');
    cards.forEach((card, idx) => {
      const joinBtn = card.querySelector('[data-action="join-live"]');
      if (joinBtn) {
        joinBtn.addEventListener('click', () => {
          this.onJoinLiveClick?.(liveClasses[idx].id);
        });
      }
    });
  }

  // ============================================
  // RENDER - DETAIL
  // ============================================

  renderDetail(liveClass) {
    if (!this.container) return;

    const startDate = new Date(liveClass.startDate);
    const isUpcoming = startDate > new Date();
    const isLive = liveClass.status === 'in_progress';
    const isCompleted = liveClass.status === 'completed';

    let statusBadge = '';
    if (isLive) statusBadge = '<span class="badge badge--success">🔴 EN DIRECT</span>';
    else if (isCompleted) statusBadge = '<span class="badge badge--info">✓ Complété</span>';
    else if (isUpcoming) statusBadge = '<span class="badge badge--warning">⏰ À venir</span>';
    else if (liveClass.status === 'cancelled') statusBadge = '<span class="badge badge--error">✗ Annulé</span>';

    const html = `
      <div class="live-class-detail">
        <div class="detail-header">
          <div class="detail-header__info">
            <h1>${this._escape(liveClass.title)}</h1>
            ${statusBadge}
            <p class="detail-subtitle">${this._escape(liveClass.description)}</p>
          </div>
          ${this.userRole === 'teacher' ? this._renderTeacherActions(liveClass) : ''}
        </div>

        <div class="detail-content">
          <div class="detail-grid">
            <!-- INFO -->
            <div class="detail-section">
              <h3 class="section-title">📋 Informations</h3>
              <div class="info-list">
                <div class="info-item">
                  <span class="label">Date</span>
                  <span>${startDate.toLocaleDateString('fr-FR')}</span>
                </div>
                <div class="info-item">
                  <span class="label">Heure</span>
                  <span>${startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="info-item">
                  <span class="label">Durée</span>
                  <span>${liveClass.duration} minutes</span>
                </div>
                <div class="info-item">
                  <span class="label">Plateforme</span>
                  <span>${this._formatProvider(liveClass.meetingProvider)}</span>
                </div>
                <div class="info-item">
                  <span class="label">Niveau</span>
                  <span>${liveClass.level}</span>
                </div>
              </div>
            </div>

            <!-- MEETING -->
            <div class="detail-section">
              <h3 class="section-title">🔗 Accès à la réunion</h3>
              ${isLive || isUpcoming ? `
                <div class="meeting-info">
                  <p><strong>URL :</strong></p>
                  <input type="text" readonly value="${liveClass.meetingUrl}" class="meeting-url-input">
                  <button class="btn btn--small" onclick="navigator.clipboard.writeText('${liveClass.meetingUrl}')">
                    Copier l'URL
                  </button>
                </div>
              ` : ''}
              ${isCompleted && liveClass.recordingUrl ? `
                <div class="recording-info">
                  <p><strong>Enregistrement disponible</strong></p>
                  <a href="${liveClass.recordingUrl}" target="_blank" class="btn btn--primary">
                    👁️ Regarder l'enregistrement
                  </a>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- DOCUMENTS -->
          ${liveClass.documents && liveClass.documents.length > 0 ? `
            <div class="detail-section">
              <h3 class="section-title">📄 Documents</h3>
              <div class="documents-list">
                ${liveClass.documents.map((doc, idx) => `
                  <div class="document-item">
                    <a href="${doc.url}" target="_blank" class="document-link">
                      📄 ${this._escape(doc.name)}
                    </a>
                    <span class="document-date">${new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- ATTENDANCE -->
          ${this.userRole === 'teacher' ? `
            <div class="detail-section">
              <h3 class="section-title">👥 Présence</h3>
              <div id="attendance-container">Chargement...</div>
            </div>
          ` : ''}
        </div>

        <div class="detail-actions">
          ${isLive ? `
            <button class="btn btn--success" data-action="join-live">Rejoindre le cours</button>
          ` : isUpcoming ? `
            <button class="btn btn--primary" data-action="join">Ajouter à mon calendrier</button>
          ` : ''}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this._attachDetailHandlers(liveClass);
  }

  _renderTeacherActions(liveClass) {
    const isLive = liveClass.status === 'in_progress';
    
    return `
      <div class="teacher-actions">
        ${liveClass.status === 'scheduled' ? `
          <button class="btn btn--secondary" data-action="edit">✏️ Modifier</button>
          <button class="btn btn--secondary" data-action="cancel">❌ Annuler</button>
          <button class="btn btn--success" data-action="start">▶️ Démarrer</button>
        ` : ''}
        ${isLive ? `
          <button class="btn btn--warning" data-action="complete">⏹️ Terminer</button>
        ` : ''}
        ${liveClass.status === 'completed' ? `
          <button class="btn btn--secondary" data-action="upload-recording">📹 Ajouter enregistrement</button>
        ` : ''}
        <button class="btn btn--error" data-action="delete">🗑️ Supprimer</button>
      </div>
    `;
  }

  _attachDetailHandlers(liveClass) {
    const container = this.container;
    
    container.querySelectorAll('[data-action]').forEach(btn => {
      const action = btn.dataset.action;
      btn.addEventListener('click', () => {
        this._handleDetailAction(action, liveClass);
      });
    });
  }

  _handleDetailAction(action, liveClass) {
    switch (action) {
      case 'join':
      case 'join-live':
        this.onJoinClick?.(liveClass.id);
        break;
      case 'edit':
        this.onEditClick?.(liveClass.id);
        break;
      case 'start':
        this.onStartClick?.(liveClass.id);
        break;
      case 'complete':
        this.onCompleteClick?.(liveClass.id);
        break;
      case 'cancel':
        this.onCancelClick?.(liveClass.id);
        break;
      case 'delete':
        this.onDeleteClick?.(liveClass.id);
        break;
      case 'upload-recording':
        this.onUploadRecording?.(liveClass.id);
        break;
    }
  }

  // ============================================
  // RENDER - TEACHER LIST
  // ============================================

  renderTeacherList(liveClasses) {
    if (!this.container) return;

    if (liveClasses.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">📚</div>
          <h3>Aucun cours en direct créé</h3>
          <button class="btn btn--primary" data-action="create">
            + Créer un cours
          </button>
        </div>
      `;
      
      const btn = this.container.querySelector('[data-action="create"]');
      if (btn) {
        btn.addEventListener('click', () => this.onCreateClick?.());
      }
      return;
    }

    const upcoming = liveClasses.filter(lc => new Date(lc.startDate) > new Date());
    const past = liveClasses.filter(lc => new Date(lc.startDate) <= new Date());

    let html = `
      <div class="teacher-live-list">
        <div class="list-header">
          <h2>Mes Cours en Direct</h2>
          <button class="btn btn--primary" data-action="create">+ Créer un cours</button>
        </div>
    `;

    if (upcoming.length > 0) {
      html += `
        <div class="list-section">
          <h3>À venir (${upcoming.length})</h3>
          <table class="live-classes-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Date</th>
                <th>Plateforme</th>
                <th>Participants</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${upcoming.map(lc => this._renderTeacherTableRow(lc)).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    if (past.length > 0) {
      html += `
        <div class="list-section">
          <h3>Terminés (${past.length})</h3>
          <table class="live-classes-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Date</th>
                <th>Plateforme</th>
                <th>Participants</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${past.map(lc => this._renderTeacherTableRow(lc)).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    html += '</div>';
    this.container.innerHTML = html;
    this._attachTeacherListHandlers(liveClasses);
  }

  _renderTeacherTableRow(liveClass) {
    const date = new Date(liveClass.startDate);
    const participants = liveClass.attendance?.length || 0;
    const statusLabel = this._formatStatus(liveClass.status);

    return `
      <tr class="table-row">
        <td><strong>${this._escape(liveClass.title)}</strong></td>
        <td>${date.toLocaleDateString('fr-FR')}</td>
        <td>${this._formatProvider(liveClass.meetingProvider)}</td>
        <td>${participants}</td>
        <td><span class="badge badge--${this._getStatusColor(liveClass.status)}">${statusLabel}</span></td>
        <td>
          <div class="row-actions">
            <button class="btn btn--small btn--secondary" data-action="view" data-id="${liveClass.id}">Voir</button>
            ${liveClass.status === 'scheduled' ? `
              <button class="btn btn--small btn--secondary" data-action="edit" data-id="${liveClass.id}">Modifier</button>
            ` : ''}
            <button class="btn btn--small btn--error" data-action="delete" data-id="${liveClass.id}">Supprimer</button>
          </div>
        </td>
      </tr>
    `;
  }

  _attachTeacherListHandlers(liveClasses) {
    const createBtn = this.container.querySelector('[data-action="create"]');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.onCreateClick?.());
    }

    this.container.querySelectorAll('[data-action]').forEach(btn => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (!id) return;

      btn.addEventListener('click', () => {
        const liveClass = liveClasses.find(lc => lc.id === id);
        if (!liveClass) return;

        if (action === 'view') this.onDetailsClick?.(id);
        else if (action === 'edit') this.onEditClick?.(id);
        else if (action === 'delete') this.onDeleteClick?.(id);
      });
    });
  }

  // ============================================
  // RENDER - RECORDINGS
  // ============================================

  renderRecordings(recordings) {
    if (!this.container) return;

    if (recordings.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">📹</div>
          <h3>Aucun enregistrement disponible</h3>
          <p>Les enregistrements des cours seront listés ici</p>
        </div>
      `;
      return;
    }

    const html = `
      <div class="recordings-grid">
        ${recordings.map(rec => `
          <div class="recording-card">
            <div class="recording-card__header">
              <h3>${this._escape(rec.title)}</h3>
              <span class="badge badge--info">${rec.level}</span>
            </div>
            <p class="recording-card__date">
              ${new Date(rec.endDate).toLocaleDateString('fr-FR')}
            </p>
            <div class="recording-card__actions">
              <a href="${rec.recordingUrl}" target="_blank" class="btn btn--primary btn--small">
                ▶️ Regarder
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this.container.innerHTML = html;
  }

  // ============================================
  // RENDER - ATTENDANCE
  // ============================================

  renderAttendance(attendance) {
    const container = document.getElementById('attendance-container');
    if (!container) return;

    if (!attendance || attendance.length === 0) {
      container.innerHTML = '<p class="text-muted">Aucun participant</p>';
      return;
    }

    const html = `
      <table class="attendance-table">
        <thead>
          <tr>
            <th>Étudiant</th>
            <th>Arrivée</th>
            <th>Départ</th>
            <th>Durée</th>
          </tr>
        </thead>
        <tbody>
          ${attendance.map(a => `
            <tr>
              <td>${a.studentId}</td>
              <td>${new Date(a.joinedAt).toLocaleTimeString('fr-FR')}</td>
              <td>${a.leftAt ? new Date(a.leftAt).toLocaleTimeString('fr-FR') : '—'}</td>
              <td>${a.duration || '—'} min</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    container.innerHTML = html;
  }

  // ============================================
  // UTILS
  // ============================================

  renderLoading(text = 'Chargement...') {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>${this._escape(text)}</p>
      </div>
    `;
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }

  closeModal() {
    const modal = this.container.closest('.modal');
    if (modal) modal.remove();
  }

  _escape(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  _getMeetingIcon(provider) {
    const icons = {
      'zoom': '🎥',
      'google_meet': '🎬',
      'teams': '👥'
    };
    return icons[provider] || '🔗';
  }

  _formatProvider(provider) {
    const names = {
      'zoom': 'Zoom',
      'google_meet': 'Google Meet',
      'teams': 'Microsoft Teams'
    };
    return names[provider] || provider;
  }

  _formatStatus(status) {
    const labels = {
      'scheduled': 'Prévu',
      'in_progress': 'En direct',
      'completed': 'Complété',
      'cancelled': 'Annulé'
    };
    return labels[status] || status;
  }

  _getStatusColor(status) {
    const colors = {
      'scheduled': 'warning',
      'in_progress': 'success',
      'completed': 'info',
      'cancelled': 'error'
    };
    return colors[status] || 'info';
  }
}
