# תוכנית — Milestone 2: חוויית צלילים מלאה בשני מסכים

## מטרה
להוסיף את מסך הפעולה ואת כל לוגיקת האודיו: `Enter` → מסך הפעולה + ניסיון להשמיע את צליל הפלוץ; `Start` (או העיגול עם סמל ה־Play) → צליל אקראי מתוך ארבעה; כפתור "הפעלת קול" כשהדפדפן חוסם; `Home` → חזרה לבית ועצירת הצליל. כולל בדיקות Vitest ו־Playwright. אין PWA/Offline באבן דרך זו.

## מקורות
- `MILESTONES.md` — Milestone 2 (מה לממש + Definition of Done).
- `PRD.md` §3.2–3.5, §4.1–4.4 (FR-02 עד FR-14), §5.3.
- `ARCHITECTURE.md` §4.1, §4.3–4.5, §6, §7, §12, §13.1–13.2.
- `DESIGN.md` §1.2, §2.3–2.5 + `wireframes.png` (המסך הימני), `mockups.png` (המסך האמצעי בלבד — המסך השלישי אינו חלק מהמוצר), `style-guide.png`.

## מצב קיים (מהקוד)
- `App.tsx` מחזיק `useState<Screen>('home')`; `onEnter` עדיין ריק.
- `PrimaryButton` (pill, Sage) מוכן לשימוש חוזר ל־`Start`.
- Tokens, רקע גרדיאנט ו־Focus גלוי — ב־`tokens.css` / `global.css`.
- Vitest + Testing Library מוגדרים; Playwright עדיין לא מותקן.
- ארבעת קובצי ה־MP3 נמצאים ב־`src/assets/sounds/`.

## ⚠️ תנאים מקדימים — נדרשת החלטה/פעולה של בעלת המוצר לפני הבנייה

### 1. אורך הקבצים (נמדד בפועל)
| קובץ | אורך | גודל | מצב |
|---|---|---|---|
| `fart.mp3` | 1.9 שניות | 60KB | ✅ תקין |
| `burp.mp3` | 3.0 שניות | 94KB | ארוך מדי |
| `boing.mp3` | 5.0 שניות | 158KB | ארוך מדי |
| `bouncy-cartoon.mp3` | **57 שניות** | **1.8MB** | ארוך מאוד — כנראה אוסף של כמה צלילים או קטע מוזיקלי |

ARCHITECTURE §7.1.1 קובע שקובץ ארוך משתי שניות יקוצר בעת המימוש. **הצעה:** קיצור מכני של שלושת הקבצים לשתי השניות הראשונות שלהם (חיתוך ברמת frames של MP3, בסקריפט Node חד־פעמי ב־scratchpad — ללא התקנת כלים נוספים וללא עריכת הצליל עצמו). המקור נשמר בהיסטוריית git.
- ב־`burp` וב־`boing` כנראה שתי השניות הראשונות הן הצליל עצמו — יש להאזין לתוצאה.
- ב־`bouncy-cartoon` (57 שניות) לא ברור ששתי השניות הראשונות הן "הצליל הקפיצי" — **צריך לבחור:** (א) להאזין ולומר מאיזו שנייה לחתוך, (ב) להוריד מ־Pixabay צליל אחר, קצר (עד 2 שניות), באותו שם קובץ, או (ג) לנסות את 2 השניות הראשונות ולהחליט אחרי האזנה.

### 2. תיעוד מקור (`SOURCES.md`)
בטבלה חסרים **קישור לדף הצליל** ו**שם היוצר** לכל ארבעת הקבצים (ARCHITECTURE §7.1.1, PRD §4.3). ה־DoD דורש ש"הושגה הרשאת שימוש מתאימה". בעלת המוצר ממלאת את העמודות האלה; אני לא ממציא אותן. הבנייה יכולה להתקדם במקביל, אבל סעיף ה־DoD הזה יסומן "לא הושלם" עד שהטבלה מלאה.

## גישה

### מבנה הקוד (שינויים ותוספות)
```text
src/
  app/
    App.tsx                  (שינוי: ניווט home↔action + יצירת בקר האודיו)
    appState.ts              (ללא שינוי)
  components/
    IconButton.tsx           (חדש: כפתור עגול קטן עם אייקון — ל-Home ול"הפעלת קול")
    IconButton.css
    icons.tsx                (חדש: SVG של בית, Play, רמקול מושתק)
  features/
    action/
      ActionScreen.tsx       (חדש)
      ActionScreen.css       (חדש)
      soundCatalog.ts        (חדש: קטלוג + בחירה אקראית)
      audioController.ts     (חדש: השמעה, עצירה, חסימה, ניסיון חוזר)
      useAudioStatus.ts      (חדש: חיבור מצב הבקר ל-React)
  test/
    App.test.tsx             (הרחבה: זרימת שני המסכים)
    soundCatalog.test.ts     (חדש)
    audioController.test.ts  (חדש)
e2e/
  flow.spec.ts               (חדש: Playwright)
playwright.config.ts         (חדש)
```
שמות הקבצים ב־ARCHITECTURE §4 הם הצעה; `HomeButton` ו־`AudioRetryControl` מאוחדים לרכיב `IconButton` אחד, כי הם זהים בעיצוב (DESIGN §2.3) ושונים רק באייקון ובשם הנגיש.

### `soundCatalog.ts`
- `type SoundId = 'fart' | 'burp' | 'bouncy-cartoon' | 'boing'`.
- `SOUND_CATALOG`: מערך יחיד של `{ id, src, volume }`, כש־`src` מיובא מקובץ ה־MP3 המקומי (`import fartUrl from '../../assets/sounds/fart.mp3'`) — Vite מוסיף אותו ל־Build.
- `ENTRY_SOUND_ID = 'fart'`.
- `volume` לכל צליל (ARCHITECTURE §7.1.1): מתחיל ב־`1`, ומכוונן אחרי האזנה כדי לאזן עוצמות — בלי לערוך את הקבצים.
- `pickRandomSound(random = Math.random)`: `SOUND_CATALOG[Math.floor(random() * SOUND_CATALOG.length)]`. אין זיכרון של הצליל הקודם → חזרות מותרות (FR-06, FR-07). פרמטר `random` מאפשר בדיקה דטרמיניסטית.

### `audioController.ts` (HTML Audio API בלבד, ללא ספרייה)
- `createAudioController(createAudio = (src) => new Audio(src))` — מחזיר אובייקט עם:
  - `playSound(id)`, `playEntrySound()` (= `playSound('fart')`), `playRandomSound()`, `retryLastSound()`, `stop()`.
  - `getStatus()` / `subscribe(listener)` — מצב: `idle` | `playing` | `blocked` | `error` (ARCHITECTURE §6).
- **אלמנט `Audio` אחד לכל צליל**, נוצר פעם אחת עם `preload="auto"` (טעינה מוקדמת = השמעה מהירה יותר), ונעשה בו שימוש חוזר.
- **מניעת חפיפה (FR-09):** כל `playSound` עוצר קודם את הצליל הפעיל (`pause()` + `currentTime = 0`) ורק אז מתחיל את החדש. כלומר, לחיצה בזמן השמעה = הצליל הקודם נקטע והחדש מתחיל — התנהגות עקבית, ואף פעם לא שני צלילים יחד.
- **מגבלת 2 שניות (FR-08):** טיימר של 2000ms מרגע תחילת ההשמעה שעוצר את הצליל — רשת ביטחון גם אחרי שהקבצים קוצרו.
- **טיפול בכשל:** אם ה־Promise של `play()` נדחה עם `NotAllowedError` → `blocked`; דחייה אחרת או אירוע `error` של הקובץ (טעינה/פענוח) → `error`. בשני המקרים נשמר `lastSoundId`, וכפתור "הפעלת קול" מוצג.
- **מירוצים:** מונה בקשות — תוצאה של `play()` ישן שמגיעה אחרי שהתחיל צליל חדש (או אחרי `stop()`) נזרקת ואינה משנה מצב.
- `ended` / סיום הטיימר → `idle`. השמעה מוצלחת → הכפתור נעלם.

### ניווט ו־`App.tsx`
- הבקר נוצר פעם אחת ב־`App` (`useState(() => createAudioController())`).
- **`Enter`:** בתוך ה־click handler עצמו קוראים קודם ל־`playEntrySound()` ורק אחר כך `setScreen('action')`. סיבה: Safari ב־iPhone מאשר השמעה רק אם `play()` נקרא ישירות בתוך הלחיצה — הפעלה מתוך `useEffect` אחרי מעבר המסך עלולה להיחסם. יתועד כ־ADR-2.
- **`Home`:** `stop()` ואז `setScreen('home')` — הצליל נעצר, ואין השמעה במסך הבית.
- ללא Router, ללא ספריית State.

### מסך הפעולה (`ActionScreen`) — עיצוב לפי Wireframe + Mockup (המסך האמצעי)
- `main` במלוא הגובה (`100dvh`), אותו רקע גרדיאנט כמו מסך הבית (מגיע מ־`body`).
- **`Home`** — `IconButton` עם אייקון בית, בפינה העליונה בצד ההתחלה של RTL (`inset-inline-start` = ימין, כמו ב־Wireframe), כ־44–48px, עיגול בהיר (Mint שקוף) עם אייקון Charcoal, צל רך. שם נגיש: `Home` (PRD FR-11 מתיר את השם הזה באנגלית).
- **טבעות + עיגול Play** במרכז:
  - 4–5 עיגולים חופפים ושקופים למחצה (Mint, Blush, Lavender, Lime, Aqua), CSS בלבד, `aria-hidden`, בקוטר ~260px (ומוקטן במסכים צרים מאוד, בלי גלילה אופקית).
  - במרכזם `button` עגול לבן (~110px) עם משולש Play ב־Sage, צל רך ו־Focus גלוי. מפעיל **בדיוק** את אותו handler של `Start`. שם נגיש: `Start` — אותה פעולה, ובלי להמציא טקסט חדש.
- **כפתור "הפעלת קול"** — `IconButton` עם אייקון רמקול מושתק (רמקול בתוך עיגול + קו אלכסוני), `aria-label="הפעלת קול"`, ללא טקסט גלוי. מוצג רק במצב `blocked`/`error`, בין הטבעות לכפתור `Start`. לחיצה → `retryLastSound()` (שוב בתוך הלחיצה עצמה). המקום שלו שמור גם כשהוא מוסתר, כדי ש־`Start` לא "יקפוץ".
- **`Start`** — `PrimaryButton` הקיים, `dir="ltr"`, מתחת לטבעות.
- אין טיימר, הנחיות נשימה, רשימת צלילים או טקסט נוסף.
- אייקונים: SVG inline, קו נקי בעובי אחיד, `aria-hidden` (השם הנגיש נמצא על הכפתור).
- `useAudioStatus(controller)` — `useSyncExternalStore` על `subscribe`/`getStatus` כדי להציג/להסתיר את כפתור "הפעלת קול".

### בדיקות
**Vitest (jsdom)** — `vite.config.ts`: הגבלת `test.include` ל־`src/**/*.test.{ts,tsx}` כדי שלא ירוץ על קובצי Playwright.
- `soundCatalog.test.ts`: ארבעה צלילים בדיוק, מזהים ייחודיים, צליל הכניסה הוא `fart`; `pickRandomSound` עם `random` מבוקר מחזיר כל אחד מארבעת הצלילים; שתי קריאות עם אותו ערך מחזירות את אותו צליל (חזרות מותרות).
- `audioController.test.ts` (עם `Audio` מזויף): השמעה מוצלחת → `playing`; `NotAllowedError` → `blocked`; שגיאה אחרת / אירוע `error` → `error`; `retryLastSound` משמיע שוב את אותו צליל וחוזר ל־`playing`; צליל חדש עוצר את הקודם (אין חפיפה); עצירה אוטומטית אחרי 2 שניות (fake timers); `stop()` עוצר; תוצאה של `play()` ישן לא דורסת מצב חדש.
- `App.test.tsx`: הבדיקות הקיימות נשארות; בנוסף — `Enter` מעביר למסך הפעולה ומפעיל `play()` על `fart`; במסך הפעולה רק `Home`, Play ו־`Start`; לחיצה על Play ועל `Start` מפעילה השמעה; `play()` נדחה → מופיע "הפעלת קול" → לחיצה משמיעה ומסתירה אותו; `Home` חוזר לבית ועוצר (`pause()`).

**Playwright** — התקנת `@playwright/test` + הורדת Chromium (`npx playwright install chromium`, כ־150MB, מהמקור הרשמי של Playwright).
- `playwright.config.ts`: `webServer` מריץ `npm run dev` על פורט 5173; פרויקט אחד בגודל מובייל (375×812) ואחד Desktop; Chromium בלבד.
- `e2e/flow.spec.ts` — האזנה ל־`play()` דרך `addInitScript` (רישום ה־`src` של כל השמעה), ולא שמיעה בפועל (ARCHITECTURE §13.2):
  - מסך הבית נפתח, אין השמעה.
  - `Enter` → מסך הפעולה, `Start` ו־`Home` גלויים, נרשמה השמעה של `fart`.
  - לחיצות חוזרות על `Start` ועל Play → כל לחיצה רושמת השמעה אחת מתוך ארבעת הקבצים.
  - מצב חסימה: `play()` מוחזר כדחייה → כפתור "הפעלת קול" מופיע → לחיצה (אחרי ביטול החסימה) מעלימה אותו.
  - `Home` → חזרה לבית, כל רכיבי האודיו במצב `paused`.
- `package.json`: סקריפט `test:e2e` = `playwright test`. `tsconfig.node.json`: הוספת `playwright.config.ts` ו־`e2e` ל־`include` (ו־`types` של Node) כדי ש־typecheck ו־lint יכסו אותם.
- `.gitignore` כבר מכיל `playwright-report/` ו־`test-results/` — אין צורך בשינוי.

## קבצים לשנות
- `src/app/App.tsx`, `vite.config.ts`, `tsconfig.node.json`, `package.json` / `package-lock.json`.
- `src/assets/sounds/burp.mp3`, `boing.mp3`, `bouncy-cartoon.mp3` — קיצור (לפי ההחלטה בתנאים המקדימים).
- `spec/ARCHITECTURE.md` — ADR-2: השמעת הצליל מתחילה בתוך ה־click handler (בקר האודיו ב־`App`); ADR-3: קיצור הקבצים לשתי שניות בחיתוך frames + עצירה בטיימר.
- `CLAUDE.md` — הוספת `npm run test:e2e` לפקודות הבדיקה.
- `spec/MILESTONES.md` — 🟡 ליד כותרת Milestone 2 בסיום הבנייה.

## אימות בסיום הבנייה
1. `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e`, `npm run build` — כולם עוברים.
2. בדיקת אורך הקבצים אחרי הקיצור (≤ 2 שניות כל אחד).
3. `npm run dev` + הדפדפן המובנה, ברוחב מובייל (375px) וב־Desktop: מראה מסך הפעולה מול ה־Mockup, RTL, אין גלילה אופקית, Focus גלוי במקלדת על Home / Play / Start / "הפעלת קול", אין שגיאות קונסול, אין בקשות רשת חיצוניות, קובצי האודיו נטענים מהאפליקציה עצמה.
4. בדיקת השמעה אמיתית בדפדפן (בכפוף למגבלות autoplay) — ובהמשך האזנה של בעלת המוצר לאיזון העוצמות.
5. סגירת שרת הפיתוח בסיום.

## Definition of Done (מ־MILESTONES.md)
- [ ] לחיצה על `Enter` מעבירה למסך הפעולה ומנסה להשמיע את צליל הפלוץ.
- [ ] מסך הפעולה מכיל רק את רכיבי ה־UI שנקבעו; העיגול עם סמל ה־Play פועל בדיוק כמו `Start`.
- [ ] כל לחיצה על `Start` בוחרת אחד מארבעת הצלילים, ללא סינון האחרון; בדיקות מוכיחות שחזרות מותרות.
- [ ] כל ארבעת הקבצים מקומיים, כל אחד עד שתי שניות, והושגה הרשאת שימוש (תלוי ב־`SOURCES.md` מלא).
- [ ] אם `play()` נדחה — אין קריסה, מוצג "הפעלת קול" עם רמקול מושתק, ולחיצה עליו משמיעה.
- [ ] `Home` מחזיר לבית ועוצר צליל פעיל; במסך הבית לא מתנגן צליל.
- [ ] בדיקות Vitest ו־Playwright עוברות; נבדקה ידנית השמעה בדפדפן אמיתי.
- [ ] שני המסכים נבדקו (מראה, RTL, Responsive) והזרימה הוצגה לאישור.

## מחוץ לטווח באבן דרך זו
PWA, Manifest, Service Worker, Offline, אייקוני אפליקציה, פריסה ל־Cloudflare. בדיקות Playwright בדפדפנים נוספים (Firefox/WebKit) — ב־Milestone 4.
