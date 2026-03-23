/**
 * Check-in modal — shared between dashboard.html and preview.html
 * Expects window.CHECKIN_API_ENABLED = true|false
 * and window.openModal(student) to be called from card clicks.
 */

(function () {
  // ── Inject modal HTML ───────────────────────────────────
  const modalHTML = `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal" id="modal" role="dialog" aria-modal="true">

        <!-- Header -->
        <div class="modal-header">
          <button class="modal-back" id="modalBack" style="display:none">← Back</button>
          <div>
            <div class="modal-student-name" id="modalStudentName"></div>
            <div class="modal-student-meta" id="modalStudentMeta"></div>
          </div>
          <button class="modal-x" id="modalClose" aria-label="Close">✕</button>
        </div>

        <!-- Screen 1: option selection -->
        <div class="modal-screen" id="screenOptions">
          <p class="modal-question">What option best fits the current situation with <strong id="optionStudentName"></strong>?</p>
          <div class="option-list" id="optionList"></div>
          <div class="modal-footer">
            <button class="btn-primary" id="btnContinue" disabled>Continue →</button>
          </div>
        </div>

        <!-- Screen 2: follow-up questions (rendered dynamically) -->
        <div class="modal-screen" id="screenQuestions" style="display:none">
          <form id="checkinForm" novalidate>
            <div id="questionFields"></div>
            <div class="modal-footer">
              <button class="btn-primary" type="submit">Submit check-in</button>
            </div>
          </form>
        </div>

        <!-- Screen 3: success -->
        <div class="modal-screen" id="screenSuccess" style="display:none">
          <div class="success-block">
            <div class="success-icon">✓</div>
            <div class="success-title">Check-in recorded</div>
            <div class="success-msg" id="successMsg"></div>
          </div>
          <div class="modal-footer">
            <button class="btn-primary" id="btnDone">Done</button>
          </div>
        </div>

      </div>
    </div>
  `;

  const modalCSS = `
    <style id="checkinStyles">
      .modal-overlay {
        display: none; position: fixed; inset: 0;
        background: rgba(15,23,42,0.5);
        z-index: 200;
        align-items: center; justify-content: center;
        padding: 16px;
      }
      .modal-overlay.open { display: flex; }

      .modal {
        background: #fff; border-radius: 16px;
        width: 100%; max-width: 520px;
        max-height: 90vh; overflow-y: auto;
        box-shadow: 0 24px 64px rgba(0,0,0,0.22);
        animation: modalIn .2s ease;
        display: flex; flex-direction: column;
      }
      @keyframes modalIn {
        from { opacity: 0; transform: translateY(20px) scale(.98); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      .modal-header {
        display: flex; align-items: flex-start; justify-content: space-between;
        padding: 20px 24px 16px;
        border-bottom: 1px solid #f0f2f7;
        gap: 12px;
        position: sticky; top: 0; background: #fff; z-index: 1;
        border-radius: 16px 16px 0 0;
      }
      .modal-back {
        background: none; border: none; color: #6b7280;
        font-size: 13px; font-weight: 600; cursor: pointer; padding: 0;
        white-space: nowrap; margin-top: 2px;
      }
      .modal-back:hover { color: #1a1a2e; }
      .modal-student-name { font-size: 17px; font-weight: 700; color: #1a1a2e; }
      .modal-student-meta { font-size: 13px; color: #9ca3af; margin-top: 1px; }
      .modal-x {
        background: none; border: none; color: #9ca3af;
        font-size: 18px; cursor: pointer; line-height: 1;
        padding: 0; flex-shrink: 0; margin-top: 1px;
      }
      .modal-x:hover { color: #1a1a2e; }

      .modal-screen { padding: 20px 24px 0; }

      .modal-question {
        font-size: 15px; color: #374151; margin-bottom: 16px; line-height: 1.5;
      }

      /* ── Option list ── */
      .option-list { display: flex; flex-direction: column; gap: 8px; }
      .option-item {
        display: flex; align-items: flex-start; gap: 12px;
        padding: 13px 16px; border-radius: 10px;
        border: 2px solid #e8eaf0; cursor: pointer;
        transition: border-color .15s, background .15s;
        user-select: none;
      }
      .option-item:hover { border-color: #c7d2fe; background: #f5f7ff; }
      .option-item.selected { border-color: #4f46e5; background: #eef2ff; }
      .option-num {
        width: 24px; height: 24px; border-radius: 50%;
        background: #e8eaf0; color: #6b7280;
        font-size: 12px; font-weight: 700;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; margin-top: 1px;
        transition: background .15s, color .15s;
      }
      .option-item.selected .option-num { background: #4f46e5; color: #fff; }
      .option-text { font-size: 14px; color: #374151; line-height: 1.45; }

      /* ── Question fields ── */
      .field { margin-bottom: 18px; }
      .field label {
        display: block; font-size: 13px; font-weight: 600;
        color: #374151; margin-bottom: 6px;
      }
      .field input[type="text"],
      .field input[type="date"],
      .field textarea {
        width: 100%; padding: 10px 12px;
        border: 1.5px solid #e0e4ef; border-radius: 8px;
        font-size: 14px; font-family: inherit;
        outline: none; transition: border-color .15s;
        color: #1a1a2e;
      }
      .field input:focus, .field textarea:focus { border-color: #4f46e5; }
      .field textarea { min-height: 90px; resize: vertical; }
      .field-hint { font-size: 12px; color: #9ca3af; margin-top: 4px; }

      /* ── Yes/No toggle ── */
      .yn-toggle { display: flex; gap: 8px; }
      .yn-btn {
        flex: 1; padding: 9px;
        border: 2px solid #e0e4ef; border-radius: 8px;
        background: none; font-size: 14px; font-weight: 600;
        color: #6b7280; cursor: pointer; transition: all .15s;
      }
      .yn-btn.yes.active { border-color: #22c55e; background: #f0fdf4; color: #15803d; }
      .yn-btn.no.active  { border-color: #ef4444; background: #fef2f2; color: #b91c1c; }
      .yn-btn:hover      { border-color: #c7d2fe; }

      /* Info box (e.g. option 6 "no" message) */
      .info-box {
        padding: 14px 16px; border-radius: 8px;
        font-size: 13px; line-height: 1.6;
      }
      .info-box.amber { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
      .info-box.blue  { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }

      /* ── Footer ── */
      .modal-footer { padding: 20px 24px; }
      .btn-primary {
        width: 100%; padding: 12px;
        background: #1e3a8a; color: white;
        border: none; border-radius: 8px;
        font-size: 15px; font-weight: 600; cursor: pointer;
        transition: background .15s;
      }
      .btn-primary:hover:not(:disabled) { background: #1e40af; }
      .btn-primary:disabled { background: #c7d2fe; cursor: not-allowed; }

      /* ── Success ── */
      .success-block { text-align: center; padding: 32px 16px 16px; }
      .success-icon {
        width: 56px; height: 56px; border-radius: 50%;
        background: #dcfce7; color: #16a34a;
        font-size: 26px; font-weight: 700;
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 14px;
      }
      .success-title { font-size: 18px; font-weight: 700; color: #1a1a2e; margin-bottom: 6px; }
      .success-msg { font-size: 14px; color: #6b7280; line-height: 1.5; }
    </style>
  `;

  document.head.insertAdjacentHTML('beforeend', modalCSS);
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // ── State ───────────────────────────────────────────────
  let currentStudent = null;
  let selectedOption = null;

  const OPTIONS = [
    { num: 1, text: 'You have contacted the family in 2026 and are in the process of organising a session' },
    { num: 2, text: 'You have contacted the family in 2026 and are still discussing their tutoring options for the year' },
    { num: 3, text: 'You have contacted the family in 2026 but have not heard back from them' },
    { num: 4, text: 'You have contacted the family in 2026 and they have told you they do not need tutoring right now' },
    { num: 5, text: 'You are no longer tutoring this student' },
    { num: 6, text: 'You have not contacted the family yet in 2026' },
    { num: 7, text: 'Other' },
  ];

  // ── DOM refs ────────────────────────────────────────────
  const overlay      = document.getElementById('modalOverlay');
  const btnBack      = document.getElementById('modalBack');
  const btnClose     = document.getElementById('modalClose');
  const btnContinue  = document.getElementById('btnContinue');
  const btnDone      = document.getElementById('btnDone');
  const scrnOptions  = document.getElementById('screenOptions');
  const scrnQuestions = document.getElementById('screenQuestions');
  const scrnSuccess  = document.getElementById('screenSuccess');
  const checkinForm  = document.getElementById('checkinForm');

  // ── Option list ─────────────────────────────────────────
  function renderOptions(student) {
    document.getElementById('optionStudentName').textContent = student.studentName;
    const list = document.getElementById('optionList');
    list.innerHTML = '';
    OPTIONS.forEach(opt => {
      const item = document.createElement('div');
      item.className = 'option-item';
      item.dataset.num = opt.num;
      // Replace generic "this student" with actual name for opt 5
      const text = opt.num === 5
        ? `You are no longer tutoring ${student.studentName}`
        : opt.text;
      item.innerHTML = `<div class="option-num">${opt.num}</div><div class="option-text">${text}</div>`;
      item.addEventListener('click', () => selectOption(opt.num));
      list.appendChild(item);
    });
  }

  function selectOption(num) {
    selectedOption = num;
    document.querySelectorAll('.option-item').forEach(el => {
      el.classList.toggle('selected', parseInt(el.dataset.num) === num);
    });
    btnContinue.disabled = false;
  }

  // ── Question screens ────────────────────────────────────
  function showQuestions(student, optNum) {
    const container = document.getElementById('questionFields');
    container.innerHTML = buildQuestionHTML(student, optNum);
    wireYesNo(container);
    showScreen('questions');
    btnBack.style.display = 'inline';
  }

  function buildQuestionHTML(student, opt) {
    const name = student.studentName;
    switch (opt) {
      case 1: return `
        <div class="field">
          <label>Do you have an estimated date for the first session?</label>
          <input type="date" name="estimatedSessionDate" />
          <div class="field-hint">Leave blank if not yet known.</div>
        </div>
        ${helpField(name)}`;

      case 2: return `
        <div class="field">
          <label>When did you contact them?</label>
          <input type="date" name="dateContacted" required />
        </div>
        <div class="field">
          <label>When did you last hear from them?</label>
          <input type="date" name="lastHeardFrom" />
        </div>
        ${helpField(name)}`;

      case 3: return `
        <div class="field">
          <label>When did you contact them?</label>
          <input type="date" name="dateContacted" required />
        </div>
        <div class="info-box blue" style="margin-bottom:18px">
          <strong>Tip:</strong> If you have not already, please call the family and send an SMS if they do not pick up. Try and do one or two follow-ups. On your second follow-up, if they do not respond, you can ask them directly to let you know if they no longer need tutoring so that you can update your records.
        </div>
        ${helpField(name)}`;

      case 4: return `
        <div class="field">
          <label>Do you have a rough estimate of when they may like to start again?</label>
          <input type="text" name="estimatedRestartDate" placeholder="e.g. Term 2, mid-year, not sure…" />
        </div>
        <div class="field">
          <label>Are you comfortable reaching out to them again when the time comes?</label>
          <div class="yn-toggle">
            <button type="button" class="yn-btn yes" data-field="recontactBy" data-value="Tutor will re-contact">Yes, I'll reach out</button>
            <button type="button" class="yn-btn no"  data-field="recontactBy" data-value="ATA to re-contact">No, please handle it</button>
          </div>
          <input type="hidden" name="recontactBy" />
        </div>`;

      case 5: return `
        <div class="field">
          <label>Could you please share some context for our records?</label>
          <textarea name="context" placeholder="Please share what happened. We apologise if you have already let us know and we missed it." required></textarea>
        </div>`;

      case 6: return `
        <div class="field">
          <label>Do you still want to tutor ${name} in 2026?</label>
          <div class="yn-toggle">
            <button type="button" class="yn-btn yes" data-field="stillWantsToTutor" data-value="yes">Yes</button>
            <button type="button" class="yn-btn no"  data-field="stillWantsToTutor" data-value="no">No</button>
          </div>
          <input type="hidden" name="stillWantsToTutor" />
        </div>
        <div id="opt6NoMsg" class="info-box amber" style="display:none; margin-top:4px;">
          We will remove ${name} from your profile and find another tutor. In future, if you no longer intend to tutor a student, please let us know as soon as possible so we can find someone who would be interested.
        </div>
        <div id="opt6YesMsg" class="info-box blue" style="display:none; margin-top:4px;">
          Please reach out to the family via call to assess their needs for 2026. Please perform at least two follow-ups. Often families will have lots of things going on, so following up is usually very much appreciated. Please let us know if they do not intend to continue tutoring with you.
        </div>`;

      case 7: return `
        <div class="field">
          <label>Please share some context so we can follow up appropriately.</label>
          <textarea name="context" placeholder="Describe the situation…" required></textarea>
        </div>`;

      default: return '';
    }
  }

  function helpField(name) {
    return `
      <div class="field">
        <label>Do you need any help from us to get in contact with ${name}?</label>
        <div class="yn-toggle">
          <button type="button" class="yn-btn yes" data-field="needsHelp" data-value="yes">Yes</button>
          <button type="button" class="yn-btn no"  data-field="needsHelp" data-value="no">No</button>
        </div>
        <input type="hidden" name="needsHelp" />
      </div>
      <div id="helpDetailsField" class="field" style="display:none">
        <label>What do you need help with?</label>
        <textarea name="helpDetails" placeholder="Share some context and we'll be in touch…"></textarea>
      </div>`;
  }

  function wireYesNo(container) {
    container.querySelectorAll('.yn-toggle').forEach(toggle => {
      const buttons = toggle.querySelectorAll('.yn-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          buttons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const field = container.querySelector(`input[name="${btn.dataset.field}"]`);
          if (field) field.value = btn.dataset.value;

          // Special behaviours
          if (btn.dataset.field === 'needsHelp') {
            const details = document.getElementById('helpDetailsField');
            if (details) details.style.display = btn.dataset.value === 'yes' ? 'block' : 'none';
          }
          if (btn.dataset.field === 'stillWantsToTutor') {
            const noMsg  = document.getElementById('opt6NoMsg');
            const yesMsg = document.getElementById('opt6YesMsg');
            if (noMsg)  noMsg.style.display  = btn.dataset.value === 'no'  ? 'block' : 'none';
            if (yesMsg) yesMsg.style.display = btn.dataset.value === 'yes' ? 'block' : 'none';
          }
        });
      });
    });
  }

  // ── Screen switcher ─────────────────────────────────────
  function showScreen(name) {
    scrnOptions.style.display   = name === 'options'   ? 'block' : 'none';
    scrnQuestions.style.display = name === 'questions' ? 'block' : 'none';
    scrnSuccess.style.display   = name === 'success'   ? 'block' : 'none';
    btnBack.style.display = name === 'questions' ? 'inline' : 'none';
  }

  // ── Submit ──────────────────────────────────────────────
  checkinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = checkinForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';

    const formData = new FormData(checkinForm);
    const answers = Object.fromEntries(formData.entries());

    // Convert needsHelp/stillWantsToTutor to boolean where needed
    const boolFields = ['needsHelp', 'stillWantsToTutor'];
    boolFields.forEach(f => {
      if (answers[f] !== undefined) answers[f] = answers[f] === 'yes';
    });

    try {
      if (window.CHECKIN_API_ENABLED) {
        const res = await fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: currentStudent.studentId,
            studentName: currentStudent.studentName,
            option: selectedOption,
            answers,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Server error');
        }
      } else {
        // Preview mode — simulate a delay
        await new Promise(r => setTimeout(r, 600));
        console.log('Preview submission:', { option: selectedOption, answers });
      }

      // Mark student as submitted on dashboard
      if (window.markStudentSubmitted) {
        window.markStudentSubmitted(currentStudent.studentId);
      }

      const optionLabels = {
        1: 'Organising a session', 2: 'Discussing options', 3: 'No response yet',
        4: 'Not needed right now', 5: 'No longer tutoring', 6: 'Not yet contacted', 7: 'Other',
      };
      document.getElementById('successMsg').textContent =
        `Your response for ${currentStudent.studentName} has been saved (Option ${selectedOption}: ${optionLabels[selectedOption]}).`;

      showScreen('success');
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit check-in';
    }
  });

  // ── Open / close ────────────────────────────────────────
  window.openCheckinModal = function (student) {
    currentStudent = student;
    selectedOption = null;

    document.getElementById('modalStudentName').textContent = student.studentName;
    const meta = student.lastSessionDate ? `Last session: ${student.lastSessionDate}` : '';
    document.getElementById('modalStudentMeta').textContent = meta;

    renderOptions(student);
    showScreen('options');
    btnContinue.disabled = true;
    checkinForm.reset();

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ── Event wiring ────────────────────────────────────────
  btnClose.addEventListener('click', closeModal);
  btnDone.addEventListener('click', closeModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  btnBack.addEventListener('click', () => {
    showScreen('options');
    btnBack.style.display = 'none';
  });

  btnContinue.addEventListener('click', () => {
    if (selectedOption) showQuestions(currentStudent, selectedOption);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

})();
