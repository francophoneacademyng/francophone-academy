# Academic Curriculum Framework

## Purpose

This document defines the core academic structure for Francophone Academy as a digital academy.
The framework is designed for progressive learning, measurable outcomes, and certification readiness.

## Curriculum Hierarchy

Program
-> Level
-> Module
-> Unit
-> Lesson
-> Exercise
-> Quiz
-> Assignment
-> Live Class
-> Exam
-> Certificate

## Program

- Program ID: francophone-academy-core
- Program Code: FA-CURRICULUM-CORE
- Program Name: Francophone Academy Curriculum
- Language: French

## Levels

The framework includes eleven levels/tracks:

1. French A1 - Foundations
2. French A2 - Everyday Life
3. French B1 - Independence
4. French B2 - Advanced
5. French C1 - Professional Mastery
6. French C2 - Expert
7. Business French
8. DELF Preparation
9. DALF Preparation
10. Pronunciation
11. Francophone Culture

Each level model includes:

- Objectives
- Duration (weeks, guided hours, self-study hours)
- Monthly structure
- Learning outcomes
- Required skills
- Recommended live classes
- Certificate requirements

## Modules

Modules segment each level into coherent thematic blocks.

Each module contains:

- Level linkage
- Ordered progression index
- Objectives
- Duration estimate
- Unit references

## Units

Units structure module content into targeted learning goals.

Each unit contains:

- Module linkage
- Learning outcomes
- Ordered lesson references
- Estimated learning time

## Lessons

Lessons are the smallest guided instruction block in the framework.

Each lesson contains:

- Unit, module, and level linkage
- Learning objectives
- Duration and lesson type
- Linked exercise, quiz, assignment, and live class entries

## Progression

Progression logic follows strict upward completion:

1. Student completes lesson activities.
2. Lesson completion contributes to unit completion.
3. Unit completion contributes to module completion.
4. Module completion contributes to level completion.
5. Level completion unlocks exam eligibility.
6. Exam + certificate rules produce certificate issuance.

## Teacher Workflow

1. Bootstrap or select the academic program.
2. Configure or refine level outcomes and monthly plans.
3. Author modules and units with measurable outcomes.
4. Attach lessons, exercises, quizzes, and assignments.
5. Schedule recommended live classes.
6. Publish final exam and certificate requirements.
7. Review progress analytics and provide remediation.

## Student Workflow

1. Enroll in a level/track.
2. Follow module and unit order.
3. Complete each lesson and exercise.
4. Pass formative quizzes and submit assignments.
5. Attend recommended live classes.
6. Sit the final exam.
7. Receive level certificate when requirements are met.

## Data Architecture Implementation

Implemented in codebase under:

- Models: src/models/Academic*.js
- Repositories: src/repositories/Academic*Repository.js
- Service: src/services/AcademicCurriculumService.js
- Controller: src/controllers/AcademicCurriculumController.js
- AI facade integration: src/services/AIService.js
- Firestore collection registry: src/config/firebase.js

This structure provides backend readiness for future pages without requiring UI redesign.
