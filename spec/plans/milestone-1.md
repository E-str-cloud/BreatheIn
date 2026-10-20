# תוכנית — Milestone 1: אפליקציה עובדת ומסך הבית

## מטרה
להקים פרויקט React + TypeScript + Vite שרץ מקומית ונבנה ל־Production, ומציג מסך בית מעוצב („נשום פנימה” + כפתור `Enter`) לפי `DESIGN.md`, במובייל וב־Desktop, בעברית וב־RTL. אין צלילים, אין מסך פעולה ואין PWA באבן דרך זו.

## מקורות
- `MILESTONES.md` — Milestone 1 (מה לממש + Definition of Done).
- `DESIGN.md` §1.1, §2 (פלטה, טיפוגרפיה, כפתורים, רקעים, צללים, RTL) + `wireframes.png`, `style-guide.png`, `mockups.png` (המסך השמאלי בלבד).
- `ARCHITECTURE.md` §3–5, §12, §14.

## מצב קיים
- יש repo של git (ענף `main`), `.gitignore`, תיקיית `spec/`, ו־`src/assets/sounds/` עם ארבעת קובצי ה־MP3 ו־`SOURCES.md`.
- אין עדיין `package.json` או קוד. Node 24 ו־npm 11 מותקנים.
- **לא נוגעים** בקובצי הצלילים ולא מייבאים אותם באבן דרך זו.

## גישה
### הקמת הפרויקט
- יצירת קובצי הפרויקט ידנית בשורש התיקייה (לא דרך `npm create vite`, כי התיקייה אינה ריקה), לפי תבנית `react-ts` הרשמית של Vite.
- תלויות (גרסאות יציבות עדכניות, ננעלות ב־`package-lock.json`):
  - runtime: `react`, `react-dom`, `@fontsource/heebo`.
  - dev: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`.
- Playwright **לא** מותקן עכשיו — יתווסף ב־Milestone 2, כשיש זרימה לבדוק (מסך אחד בלי ניווט לא מצדיק אותו).
- סקריפטים ב־`package.json`: `dev`, `build` (`tsc -b && vite build`), `preview`, `typecheck` (`tsc -b --noEmit` או מקבילה), `lint`, `test` (`vitest run`).
- `tsconfig` עם `strict: true` (+ `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`).

### פונט Heebo — מקומי, לא מ־Google Fonts
- הפונט ייטען מחבילת `@fontsource/heebo` (משקלים 400, 600, 700, subset עברי + לטיני) ויוגש מתוך האפליקציה עצמה.
- סיבה: ARCHITECTURE דורש שלא תהיה תלות בשירות חיצוני בזמן ריצה, ו־Milestone 3 דורש עבודה Offline. תיעוד כ־ADR-1 ב־`ARCHITECTURE.md`.

### מצב מסכים (שלד)
- `src/app/appState.ts`: טיפוס `Screen = 'home' | 'action'`.
- `App.tsx` מחזיק `useState<Screen>('home')` ומציג את `HomeScreen` כאשר המצב `home`. מסך הפעולה עדיין לא קיים, ולכן `Enter` לא מנווט כרגע (לחיצה עליו לא עושה דבר). ב־Milestone 2 יחובר `onEnter` למעבר ל־`action`.
- בלי Router, בלי ספריית state.

### עיצוב
- `src/styles/tokens.css` — Design Tokens כ־CSS variables:
  - צבעים: Mint `#C8F9D9`, Aqua `#C9F8F4`, Lime `#E7F8A7`, Blush `#F7D2E9`, Lavender `#E7DDF7`, Warm White `#FAF9F6`, Charcoal `#4B5563`, Sage `#92B8A2`, White `#FFFFFF`.
  - טיפוגרפיה: משפחה `Heebo`; H1 32px/700, H2 24px/600, Body 16px/400, Caption 12px/400.
  - ריווח בסולם 8px (8, 16, 24, 32, 48, 64); רדיוס pill `999px`, רדיוס כרטיס `24px`; צל רך `0 8px 24px` באטימות נמוכה.
- `src/styles/global.css` — reset קל, `box-sizing`, `body` בגובה `100dvh` ללא גלילה אופקית, רקע Warm White עם גרדיאנטים פסטליים רכים (radial-gradients ב־Mint/Aqua/Lime/Blush/Lavender), סגנון Focus גלוי (`:focus-visible`), תמיכה ב־`prefers-reduced-motion`.
- **מסך הבית** (לפי ה־Wireframe וה־Mockup):
  - פריסה ממורכזת אנכית ואופקית; הכותרת מעל הכפתור עם מרווח נדיב.
  - כותרת `h1` „נשום פנימה”: Heebo Bold, Charcoal, ממורכזת, 32px לפי ה־Style Guide.
  - כפתור `Enter`: pill רחב (כ־240px, לא יותר מרוחב המסך פחות שוליים), גובה ≥ 48px, רקע Sage, טקסט לבן, צל רך. אותו רכיב ישמש ל־`Start` ב־Milestone 2.
  - עיטור רקע: טבעות/עיגולים פסטליים שקופים ועמומים בפינה העליונה ובפינה התחתונה, כמו ב־Mockup — אלמנט דקורטיבי בלבד (`aria-hidden`, CSS בלבד, ללא תמונות).
  - Desktop: הרקע ממלא את כל החלון, והתוכן נשאר ממורכז בעמודה צרה (פרופורציות סמארטפון), בלי מתיחה.
- `index.html`: `<html lang="he" dir="rtl">`, `viewport` (כולל `viewport-fit=cover`), `<title>נשום פנימה</title>`, `theme-color` בהיר.

### בדיקות
- Vitest + Testing Library (סביבת `jsdom`) — בדיקה אחת ל־`HomeScreen`/`App`:
  - מוצגת כותרת „נשום פנימה” וכפתור בשם `Enter`.
  - אין כפתורים/תוכן נוספים מלבד אלה.
  - לא נוצר אובייקט `Audio` ולא נקרא `play()` בטעינה (spy על `HTMLMediaElement.prototype.play`).

## קבצים ליצור
```text
package.json
package-lock.json            (נוצר ע"י npm install)
index.html
vite.config.ts               (React plugin + הגדרות Vitest)
tsconfig.json
tsconfig.app.json
tsconfig.node.json
eslint.config.js
src/
  main.tsx                   (ייבוא פונטים, global.css, רינדור App)
  vite-env.d.ts
  app/
    App.tsx
    appState.ts
  components/
    PrimaryButton.tsx        (כפתור pill ראשי; ישמש גם ל-Start)
    PrimaryButton.css
  features/
    home/
      HomeScreen.tsx
      HomeScreen.css
  styles/
    tokens.css
    global.css
  test/
    setup.ts                 (jest-dom)
    App.test.tsx
```

## קבצים לשנות
- `CLAUDE.md` — מילוי "פקודות הרצה": dev = `npm run dev`, test = `npm test`.
- `spec/ARCHITECTURE.md` — הוספת `## החלטות מרכזיות (ADRs)` עם ADR-1 (פונט Heebo מקומי דרך `@fontsource/heebo`).
- `spec/MILESTONES.md` — סימון 🟡 ליד כותרת Milestone 1 בסיום הבנייה.
- `.gitignore` — כנראה אין צורך בשינוי (`node_modules/`, `dist/`, `*.tsbuildinfo` כבר קיימים).

## אימות בסיום הבנייה
1. `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` — כולם עוברים.
2. הרצת `npm run dev` ובדיקה בדפדפן המובנה: רוחב מובייל (375px) ורוחב Desktop — כותרת, כפתור, צבעים, פונט Heebo, RTL, אין גלילה אופקית, Focus גלוי במקלדת, אין שגיאות בקונסול ואין בקשות רשת חיצוניות (בפרט לא ל־Google Fonts).
3. השוואה חזותית מול ה־Mockup (המסך השמאלי).
4. סגירת שרת הפיתוח בסיום.

## Definition of Done (מ־MILESTONES.md)
- [ ] הפעלת הפרויקט מציגה את מסך הבית ללא שגיאות Runtime או Build.
- [ ] מופיעים רק הכותרת „נשום פנימה” וכפתור `Enter` כרכיבי התוכן המרכזיים.
- [ ] אין השמעת צליל בטעינת המסך או בזמן שהייה בו.
- [ ] Heebo, RTL, צבעים, כפתור ופריסה תואמים למסמכי העיצוב במובייל וב־Desktop.
- [ ] Typecheck, ESLint ו־Build עוברים ללא שגיאות.
- [ ] ניתן להציג את מסך הבית לאישור חזותי.

## מחוץ לטווח באבן דרך זו
מסך הפעולה, ניווט בפועל, צלילים, Playwright, PWA/Service Worker/Manifest, פריסה ל־Cloudflare, חיבור ל־GitHub (ייעשה בשלב הדחיפה, לפי כתובת שתינתן).

## הערה לבעלת המוצר
טקסט לבן על רקע Sage (`#92B8A2`) — כפי שמוגדר ב־DESIGN וב־Mockup — הוא בניגודיות נמוכה (בערך 2.2:1), מתחת למה שמומלץ לקריאוּת. לפי כללי הפרויקט DESIGN קובע את המראה, ולכן ייושם כפי שהוא; אם תרצי, אפשר בהמשך להכהות מעט את הירוק.
