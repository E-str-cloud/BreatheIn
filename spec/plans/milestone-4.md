# תוכנית — Milestone 4: הנפשת הטבעות במסך הפעולה

## מטרה
להוסיף למסך הפעולה תנועה אחת בלבד: הטבעות מסתובבות לאט, ברציפות ובעדינות סביב מרכז המוטיב, כל הזמן שהמסך מוצג. עיגול ה־Play, כפתור `Start` וכפתור "הפעלת קול" נשארים יציבים. אין שינוי בצלילים, בניווט, ברכיבי המסך או במסך הבית.

## מקורות
- `MILESTONES.md` — Milestone 4 (מה לממש + Definition of Done).
- `PRD.md` §3.4 (הטבעות מסתובבות לאט; עיגול ה־Play יציב), §Out of scope (אין אנימציות מלבד סיבוב הטבעות).
- `DESIGN.md` §1.2 "תנועה" (סיבוב מלא = כמה עשרות שניות; הערך המדויק נקבע במימוש), §3 (התנועה היחידה במסכים).
- `ARCHITECTURE.md` §12 (תמיכה ב־`prefers-reduced-motion`).

## מצב קיים (מהקוד)
- `src/features/action/ActionScreen.tsx` — בתוך `.action-screen__rings` יש חמש טבעות (`div` עם `aria-hidden`) וכפתור ה־Play, כולם אחים (siblings) באותו מיכל.
- `ActionScreen.css` — כל טבעת ממוקמת בעזרת `transform: translate(...)` משלה. למסך יש `overflow: hidden`.
- `src/styles/global.css` — כבר קיים כלל כללי: תחת `prefers-reduced-motion: reduce` כל ה־`animation` וה־`transition` מבוטלים (`!important`). זהו "הכלל הכללי של האפליקציה" שה־DESIGN מפנה אליו.
- `e2e/flow.spec.ts` — בדיקות זרימה ב־Playwright בשני פרויקטים: mobile (375×812) ו־desktop (1280×800).

## גישה

### מבנה (שינוי קטן ב־`ActionScreen.tsx`)
עוטפים את חמש הטבעות במיכל חדש אחד שמסתובב, וכפתור ה־Play נשאר **מחוץ** לו (אח של המיכל, לא ילד שלו) — כך שהוא לא מסתובב כלל:

```tsx
<div className="action-screen__rings">
  <div className="action-screen__orbit" aria-hidden="true">
    <div className="action-screen__ring action-screen__ring--1" />
    ... (ring 2–5)
  </div>
  <button className="action-screen__play" ...>  {/* unchanged */}
</div>
```
- `aria-hidden` עובר מכל טבעת אל המיכל (הטבעות דקורטיביות בלבד).
- אין שינוי ב־handlers, ב־props או בלוגיקת האודיו. ההנפשה היא CSS בלבד — אין JavaScript, אין ספרייה חדשה, אין state.

### CSS (`ActionScreen.css`)
- `.action-screen__orbit`: `position: absolute; inset: 0;` (ממלא בדיוק את ריבוע הטבעות, כך שמרכז הסיבוב = מרכז המוטיב = מרכז עיגול ה־Play), `pointer-events: none`, ו־`animation: action-screen-orbit 60s linear infinite`.
- `@keyframes action-screen-orbit { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`.
- `linear` + `infinite` → תנועה קבועה, בלי האטה/האצה ובלי "קפיצה" בסוף סיבוב (0° ו־360° זהים).
- **קצב:** סיבוב מלא אחד ב־**60 שניות** (בתוך הטווח "כמה עשרות שניות" של ה־DESIGN). זהו ערך התחלתי; אם התחושה בבדיקה שלך מהירה/איטית מדי — משנים מספר אחד.
- `will-change: transform` על המיכל — הדפדפן מסובב אותו כשכבה אחת (GPU), לחלק בטלפונים.
- `.action-screen__play` מקבל `z-index: 1` כדי להישאר תמיד מעל הטבעות. ה־`transform: scale(0.96)` הקיים בלחיצה נשאר כמו שהוא.
- הטבעות עצמן לא משתנות (אותם צבעים, גדלים ו־translate) — הן פשוט מסתובבות יחד כקבוצה סביב המרכז, כך שהמוטיב "זורם" לאט.

### גבולות המסך
סיבוב לא משנה את המרחק של טבעת מהמרכז, ולכן הטבעות תופסות לכל היותר עיגול ברדיוס ~53% מגודל המוטיב (≈150px ב־Desktop, ≈143px במובייל 375px) — הרבה פחות מחצי רוחב המסך. בנוסף, ל־`.action-screen` כבר יש `overflow: hidden`, ו־`body` עם `overflow-x: hidden` — אין גלילה אופקית גם בקצוות.

### הפחתת תנועה
לא נדרש קוד חדש: הכלל הקיים ב־`global.css` מבטל את ה־animation, ולכן למשתמש שהגדיר "הפחתת תנועה" הטבעות מוצגות סטטיות במצבן הנוכחי (כמו היום). שאר המסך זהה.

### מסך הבית
לא נוגעים ב־`HomeScreen` או ב־`HomeScreen.css`.

### ADR
להוסיף ל־`ARCHITECTURE.md` את **ADR-6: סיבוב הטבעות ב־CSS בלבד, במיכל נפרד מעיגול ה־Play** — הקשר (דרישת התנועה, Play יציב), החלטה (keyframes ב־CSS, 60s linear, מיכל עוטף, הכלל הקיים ל־reduced motion), השלכות (אין JS/ספרייה; ה־Play לא זז; שינוי קצב = ערך אחד).

## קבצים
| קובץ | שינוי |
|---|---|
| `src/features/action/ActionScreen.tsx` | עטיפת הטבעות במיכל `action-screen__orbit` |
| `src/features/action/ActionScreen.css` | מיכל, keyframes, `will-change`, `z-index` ל־Play |
| `src/test/App.test.tsx` | בדיקה: הטבעות בתוך מיכל ה־orbit, וה־Play לא בתוכו |
| `e2e/flow.spec.ts` (או `e2e/rings.spec.ts` חדש) | בדיקות התנועה (להלן) |
| `spec/ARCHITECTURE.md` | הוספת ADR-6 |
| `spec/MILESTONES.md` | סימון 🟡 בסיום הבנייה |

## בדיקות

### Vitest
- מיכל ה־orbit קיים במסך הפעולה, מסומן `aria-hidden`, ומכיל את חמש הטבעות.
- כפתור ה־Play (`Start` בשם הנגיש) **אינו** בתוך מיכל ה־orbit.
- הבדיקות הקיימות (צלילים, Start, Play, "הפעלת קול") ממשיכות לעבור בלי שינוי.

### Playwright (mobile + desktop)
1. **הטבעות מסתובבות:** אחרי `Enter`, ה־`animation-name` של המיכל אינו `none`, ושתי דגימות של `transform` (בהפרש ~0.5 שנייה) שונות זו מזו.
2. **ה־Play יציב:** המיקום והגודל של עיגול ה־Play (`boundingBox`) זהים בשתי דגימות בהפרש זמן; ה־Play ללא animation.
3. **Start ו"הפעלת קול" יציבים:** מיקום `Start` זהה בשתי דגימות.
4. **התנועה ממשיכה בזמן השמעה:** אחרי לחיצה על `Start` — הטבעות עדיין מסתובבות (שוב שתי דגימות שונות), וה־Play עדיין לוחץ ומשמיע צליל כמו `Start`.
5. **אין גלילה אופקית:** `scrollWidth <= clientWidth` של המסמך, בשני הגדלים.
6. **מסך הבית ללא תנועה חדשה:** אין אלמנט עם animation פעיל במסך הבית.
7. **הפחתת תנועה:** עם `page.emulateMedia({ reducedMotion: 'reduce' })` — ה־animation של המיכל הוא `none`, והמסך עובד כרגיל.

### בדיקות כלליות
`npm run typecheck`, `npm run lint`, `npm run build`, `npm test`, `npm run test:e2e`, וגם `npm run test:pwa` (לוודא שה־Build וה־Offline לא נפגעו).

### בדיקה חזותית
הרצת שרת הפיתוח, צילום מסך במובייל וב־Desktop, וצפייה בתנועה (חלקה, בלי קפיצה בסוף סיבוב, ה־Play עומד במקום). בסיום — סגירת השרת.

## Definition of Done — איך כל תנאי ייבדק
| תנאי | בדיקה |
|---|---|
| הטבעות מסתובבות לאט ובעדינות, בלי הפסקה, גם בזמן השמעה | Playwright 1, 4 + צפייה |
| עיגול ה־Play יציב, ולחיצה עליו = `Start` | Playwright 2, 4 + Vitest קיים |
| תנועה חלקה במובייל וב־Desktop, בלי גלילה אופקית ובלי יציאה מהמסך | Playwright 5 + צילומי מסך בשני הגדלים |
| במסך הבית אין תנועה חדשה | Playwright 6 |
| TypeScript, ESLint, Build, Vitest, Playwright עוברים | הרצת כל הסקריפטים |
| ההנפשה הוצגה לאישור חזותי | "הרץ כדי שאבדוק" אחרי הבנייה |

## מחוץ לתחום
- אין שינוי בצבעים, בגודל או במספר הטבעות; אין "נשימה" (הגדלה/הקטנה), הבהוב או תנועה נוספת.
- אין שינוי בצלילים, בניווט, ב־PWA או במסך הבית.
- אין ספריות אנימציה.
