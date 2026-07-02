/**
 * AcademicCurriculumController.js
 * Controller pour orchestrer le cadre academique de la plateforme.
 */

import { aiService } from '../services/AIService.js';

export class AcademicCurriculumController {
  constructor() {
    this.view = null;
    this._programId = 'francophone-academy-core';
    this._currentLevelId = null;
  }

  setView(view) {
    this.view = view;
  }

  async bootstrap(programId = this._programId) {
    const result = await aiService.bootstrapAcademicProgram(programId);
    if (this.view?.renderBootstrapResult) {
      this.view.renderBootstrapResult(result);
    }
    return result;
  }

  async loadProgram(programId = this._programId) {
    const data = await aiService.getAcademicProgramStructure(programId);
    if (this.view?.renderProgram) {
      this.view.renderProgram(data);
    }
    return data;
  }

  async loadLevel(levelId) {
    this._currentLevelId = levelId;
    const framework = await aiService.getAcademicLevelFramework(levelId);
    if (this.view?.renderLevelFramework) {
      this.view.renderLevelFramework(framework);
    }
    return framework;
  }

  getTeacherWorkflow(levelId = this._currentLevelId) {
    return aiService.getAcademicTeacherWorkflow(levelId);
  }

  getStudentWorkflow(levelId = this._currentLevelId) {
    return aiService.getAcademicStudentWorkflow(levelId);
  }

  async createModule(data) {
    return aiService.createAcademicModule(data);
  }

  async createUnit(data) {
    return aiService.createAcademicUnit(data);
  }

  async createLesson(data) {
    return aiService.createAcademicLesson(data);
  }

  async createExercise(data) {
    return aiService.createAcademicExercise(data);
  }

  async createQuiz(data) {
    return aiService.createAcademicQuiz(data);
  }

  async createAssignment(data) {
    return aiService.createAcademicAssignment(data);
  }

  async createLiveClass(data) {
    return aiService.createAcademicLiveClass(data);
  }

  async createExam(data) {
    return aiService.createAcademicExam(data);
  }

  async createCertificate(data) {
    return aiService.createAcademicCertificate(data);
  }
}
