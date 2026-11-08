/* ============================================================
   NewCredit Clone — demo loan app logic
   Vanilla JS, no dependencies. All data is fake and in-memory.
   ============================================================ */

(function () {
  'use strict';

  /* ---------- Loan model ---------- */

  const LIMIT = 150000;
  const TERMS = [
    { days: 91, monthlyRate: 0.04 },
    { days: 120, monthlyRate: 0.035 },
    { days: 180, monthlyRate: 0.03 },
    { days: 270, monthlyRate: 0.025 },
    { days: 365, monthlyRate: 0.02 },
  ];

  const naira = (kobo) =>
    '₦' + Math.round(kobo).toLocaleString('en-NG');

  const el = (id) => document.getElementById(id);

  const dom = {
    app: el('app'),
    screenWelcome: el('screen-welcome'),
    screenOtp: el('screen-otp'),
    screenApply: el('screen-apply'),
    screenProcessing: el('screen-processing'),
    screenApproved: el('screen-approved'),
    appShell: el('app-shell'),
    otpSentTo: el('otp-sent-to'),
    otpError: el('otp-error'),
    phoneError: el('phone-error'),
    phoneInput: el('phone-input'),
    otpVerify: el('otp-verify'),
    userName: el('user-name'),
    userAvatar: el('user-avatar'),
    profilePhone: el('profile-phone'),
    limitAmount: el('limit-amount'),
    profileLimit: el('profile-limit'),
    activeLoanHome: el('active-loan-home'),
    homeLoanSub: el('home-loan-sub'),
    homeLoanStatus: el('home-loan-status'),
    homeLoanProgress: el('home-loan-progress'),
    homeLoanDue: el('home-loan-due'),
    loansEmpty: el('loans-empty'),
    loansList: el('loans-list'),
    amountValue: el('amount-value'),
    amountSlider: el('amount-slider'),
    termChips: el('term-chips'),
    calcRate: el('calc-rate'),
    calcInterest: el('calc-interest'),
    calcMonthly: el('calc-monthly'),
    calcTotal: el('calc-total'),
    calcDue: el('calc-due'),
    approvedSub: el('approved-sub'),
    repayBackdrop: el('repay-backdrop'),
    repaySub: el('repay-sub'),
    toggleReminders: el('toggle-reminders'),
  };

  /* ---------- State ---------- */

  const state = {
    phone: null,
    loans: [], // { id, principal, days, monthlyRate, totalDue, balance, repaid, takenAt, dueAt, status }
    applyAmount: 50000,
    applyTerm: 180,
  };

  let loanSeq = 1;

  /* ---------- Screen management ---------- */

  const screens = [
    'screen-welcome', 'screen-otp', 'screen-apply',
    'screen-processing', 'screen-approved', 'app-shell',
  ];

  function show(screenId) {
    screens.forEach((s) => {
      el(s).hidden = s !== screenId;
    });
  }

  function switchTab(tab) {
    document.querySelectorAll('.app-body').forEach((t) => {
      t.hidden = t.id !== 'tab-' + tab;
    });
    document.querySelectorAll('.tabbtn').forEach((b) => {
      const active = b.dataset.tab === tab;
      b.classList.toggle('active', active);
      if (active) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
  }

  /* ---------- Login flow ---------- */

  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = dom.phoneInput.value.replace(/\D/g, '');
    const valid = raw.length === 11 && raw.startsWith('0');
    dom.phoneError.hidden = valid;
    if (!valid) return;
    state.phone = raw;
    dom.otpSentTo.textContent =
      'We sent a 4-digit code to +234 ' + raw.slice(1) + '.';
    document.querySelectorAll('.otp-box').forEach((b) => (b.value = ''));
    show('screen-otp');
    document.querySelector('.otp-box').focus();
  });

  // OTP boxes: auto-advance, paste support
  const otpBoxes = [...document.querySelectorAll('.otp-box')];
  otpBoxes.forEach((box, i) => {
    box.addEventListener('input', () => {
      box.value = box.value.replace(/\D/g, '');
      if (box.value && i < otpBoxes.length - 1) otpBoxes[i + 1].focus();
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && i > 0) otpBoxes[i - 1].focus();
    });
    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 4);
      digits.split('').forEach((d, j) => {
        if (otpBoxes[j]) otpBoxes[j].value = d;
      });
      otpBoxes[Math.min(digits.length, 3)].focus();
    });
  });

  dom.otpVerify.addEventListener('click', () => {
    const code = otpBoxes.map((b) => b.value).join('');
    const valid = code.length === 4;
    dom.otpError.hidden = valid;
    if (!valid) return;
    enterApp();
  });

  function enterApp() {
    const last2 = state.phone.slice(-2);
    dom.userName.textContent = 'User ' + last2;
    dom.userAvatar.textContent = last2;
    dom.profilePhone.textContent = '+234 ' + state.phone.slice(1);
    dom.limitAmount.textContent = naira(LIMIT);
    dom.profileLimit.textContent = naira(LIMIT);
    show('app-shell');
    switchTab('home');
    renderLoans();
  }

  el('otp-back').addEventListener('click', () => show('screen-welcome'));

  /* ---------- Tabs ---------- */

  document.querySelectorAll('.tabbtn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  el('btn-logout').addEventListener('click', () => {
    state.phone = null;
    state.loans = [];
    dom.phoneInput.value = '';
    show('screen-welcome');
  });

  dom.toggleReminders.addEventListener('click', () => {
    const on = dom.toggleReminders.getAttribute('aria-checked') === 'true';
    dom.toggleReminders.setAttribute('aria-checked', String(!on));
  });

  /* ---------- Loan calculation ---------- */

  function termInfo(days) {
    return TERMS.find((t) => t.days === days) || TERMS[2];
  }

  function computeLoan(principal, days) {
    const { monthlyRate } = termInfo(days);
    const months = days / 30; // approximated billing months
    const interest = principal * monthlyRate * months;
    const total = principal + interest;
    return {
      monthlyRate,
      interest,
      total,
      monthly: total / months,
      months: Math.ceil(months),
    };
  }

  function formatDate(d) {
    return d.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function availableLimit() {
    const outstanding = state.loans
      .filter((l) => l.status === 'repaying')
      .reduce((s, l) => s + l.balance, 0);
    return Math.max(0, LIMIT - outstanding);
  }

  /* ---------- Apply screen ---------- */

  function updateSliderFill() {
    const pct =
      ((state.applyAmount - 10000) / (300000 - 10000)) * 100;
    dom.amountSlider.style.setProperty('--fill', pct + '%');
  }

  function renderApply() {
    const loan = computeLoan(state.applyAmount, state.applyTerm);
    dom.amountValue.textContent = naira(state.applyAmount);
    updateSliderFill();
    dom.calcRate.textContent = Math.round(loan.monthlyRate * 100) + '% / mo';
    dom.calcInterest.textContent = naira(loan.interest);
    dom.calcMonthly.textContent = naira(loan.monthly);
    dom.calcTotal.textContent = naira(loan.total);
    const due = new Date(Date.now() + state.applyTerm * 86400000);
    dom.calcDue.textContent = formatDate(due);
  }

  dom.amountSlider.addEventListener('input', () => {
    state.applyAmount = Number(dom.amountSlider.value);
    renderApply();
  });

  dom.termChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    dom.termChips.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    state.applyTerm = Number(chip.dataset.days);
    renderApply();
  });

  function openApply() {
    // cap the slider at the available limit
    const avail = availableLimit();
    if (avail < 10000) {
      alert('You have reached your demo credit limit. Repay an active loan to free it up.');
      return;
    }
    const max = Math.min(300000, Math.floor(avail / 5000) * 5000);
    dom.amountSlider.max = String(max);
    if (state.applyAmount > max) state.applyAmount = max;
    dom.amountSlider.value = String(state.applyAmount);
    renderApply();
    show('screen-apply');
  }

  el('btn-borrow').addEventListener('click', openApply);
  el('btn-borrow-empty').addEventListener('click', openApply);
  el('apply-back').addEventListener('click', () => {
    show('app-shell');
  });

  el('btn-submit-loan').addEventListener('click', () => {
    show('screen-processing');
    setTimeout(() => {
      const loan = computeLoan(state.applyAmount, state.applyTerm);
      const takenAt = new Date();
      state.loans.push({
        id: loanSeq++,
        principal: state.applyAmount,
        days: state.applyTerm,
        monthlyRate: loan.monthlyRate,
        totalDue: loan.total,
        balance: loan.total,
        repaid: 0,
        takenAt,
        dueAt: new Date(Date.now() + state.applyTerm * 86400000),
        status: 'repaying',
      });
      dom.approvedSub.textContent =
        naira(state.applyAmount) + ' is on its way to your bank account.';
      show('screen-approved');
      renderLoans();
    }, 1800);
  });

  el('btn-done').addEventListener('click', () => {
    show('app-shell');
    switchTab('home');
  });

  /* ---------- Loans list & repayment ---------- */

  function renderLoans() {
    const hasActive = state.loans.some((l) => l.status === 'repaying');
    dom.loansEmpty.hidden = state.loans.length > 0;
    dom.loansList.hidden = state.loans.length === 0;
    dom.activeLoanHome.hidden = !hasActive;

    // home card shows the most recent active loan
    const active = state.loans.find((l) => l.status === 'repaying');
    if (active) {
      dom.homeLoanSub.textContent =
        naira(active.principal) + ' · ' + active.days + ' days';
      dom.homeLoanDue.textContent =
        'Due ' + formatDate(active.dueAt);
      const pct = Math.round((active.repaid / active.totalDue) * 100);
      dom.homeLoanProgress.style.width = pct + '%';
      el('home-loan-progress-wrap').setAttribute('aria-valuenow', String(pct));
    }

    // available limit refresh
    const avail = availableLimit();
    dom.limitAmount.textContent = naira(avail);
    dom.profileLimit.textContent = naira(avail);

    // list
    dom.loansList.innerHTML = '';
    [...state.loans].reverse().forEach((loan) => {
      const item = document.createElement('article');
      item.className = 'loan-item';
      item.setAttribute('data-testid', 'card-loan-' + loan.id);

      const head = document.createElement('div');
      head.className = 'loan-card-head';
      const headTxt = document.createElement('div');
      const title = document.createElement('p');
      title.className = 'loan-card-title';
      title.textContent = 'Loan #' + loan.id;
      const sub = document.createElement('p');
      sub.className = 'loan-card-sub';
      sub.textContent =
        naira(loan.principal) + ' · ' + loan.days + ' days · due ' + formatDate(loan.dueAt);
      headTxt.append(title, sub);
      const pill = document.createElement('span');
      pill.className = 'pill ' + (loan.status === 'repaid' ? 'pill-done' : 'pill-ok');
      pill.textContent = loan.status === 'repaid' ? 'Repaid' : 'Repaying';
      head.append(headTxt, pill);

      const figures = document.createElement('div');
      figures.className = 'loan-figures';
      const bal = document.createElement('p');
      bal.className = 'loan-principal';
      bal.textContent = naira(loan.balance);
      const repaid = document.createElement('p');
      repaid.className = 'loan-balance';
      repaid.textContent = 'Repaid ' + naira(loan.repaid) + ' of ' + naira(loan.totalDue);
      figures.append(bal, repaid);

      const track = document.createElement('div');
      track.className = 'progress-track';
      track.setAttribute('role', 'progressbar');
      track.setAttribute('aria-label', 'Loan ' + loan.id + ' repaid');
      const fill = document.createElement('div');
      fill.className = 'progress-fill';
      fill.style.width = Math.round((loan.repaid / loan.totalDue) * 100) + '%';
      track.appendChild(fill);

      item.append(head, figures, track);

      if (loan.status === 'repaying') {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-primary btn-block';
        btn.textContent = 'Repay';
        btn.setAttribute('data-testid', 'button-repay-loan-' + loan.id);
        btn.addEventListener('click', () => openRepay(loan));
        item.appendChild(btn);
      }

      dom.loansList.appendChild(item);
    });
  }

  let repayTarget = null;

  function openRepay(loan) {
    repayTarget = loan;
    dom.repaySub.textContent =
      'Balance: ' + naira(loan.balance) + '. Choose an amount to repay today.';
    dom.repayBackdrop.hidden = false;
  }

  el('repay-options').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-frac]');
    if (!btn || !repayTarget) return;
    const amount = Math.min(
      repayTarget.balance,
      Math.round(repayTarget.totalDue * Number(btn.dataset.frac))
    );
    repayTarget.repaid += amount;
    repayTarget.balance -= amount;
    if (repayTarget.balance <= 0) {
      repayTarget.balance = 0;
      repayTarget.status = 'repaid';
    }
    dom.repayBackdrop.hidden = true;
    renderLoans();
  });

  el('repay-cancel').addEventListener('click', () => {
    dom.repayBackdrop.hidden = true;
  });

  /* ---------- Init ---------- */

  renderApply();
  show('screen-welcome');
})();
