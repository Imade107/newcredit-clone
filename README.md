# NewCredit Clone — Demo Loan App

A mobile-first web clone of the **NewCredit** instant loan app (Nigeria) — the
registration, credit-limit, loan application, and repayment experience rebuilt
as a single-page web app in plain HTML, CSS, and JavaScript.

> **This is an educational UI clone.** It is not affiliated with, endorsed by,
> or connected to Newedge Finance Limited or the real NewCredit app. No real
> loans are offered, no data is collected, and everything is fake and in-memory.

## Features

- Phone-number registration with OTP verification (demo: any 4 digits work)
- Credit limit dashboard card
- Loan calculator:
  - Amount slider from ₦10,000 to ₦300,000
  - Terms of 91 / 120 / 180 / 270 / 365 days
  - Live monthly interest, total interest, monthly payment, and due date
- AI-style "assessing" state, then approval screen
- My Loans tab with active/repaid loans, repayment progress bars
- Repay sheet — repay 25%, 50%, or in full; your credit limit frees up
- Profile tab with preferences and logout

## Interest Model (demo)

Monthly interest rate depends on the term, echoing the real app's 24–56% APR band:

| Term | Monthly rate | Approx. APR |
| ---- | ------------ | ----------- |
| 91 days | 4% | 48% |
| 120 days | 3.5% | 42% |
| 180 days | 3% | 36% |
| 270 days | 2.5% | 30% |
| 365 days | 2% | 24% |

## Getting Started

No build step, no dependencies.

```bash
git clone https://github.com/your-username/newcredit-clone.git
cd newcredit-clone
open index.html        # or: npx serve .
```

## Project Structure

```
newcredit-clone/
├── index.html        # All screens (login, OTP, home, loans, profile, apply flow)
├── css/style.css     # Fintech theme, phone-frame shell, responsive
├── js/app.js         # Screen router, loan math, repayment logic
├── LICENSE
└── README.md
```

## Tech

Plain HTML, CSS, and JavaScript. Fonts (Clash Display, General Sans,
JetBrains Mono) load from CDNs with system fallbacks.

## License

[MIT](LICENSE)
