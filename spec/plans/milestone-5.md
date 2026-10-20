# תוכנית — Milestone 5: אימות סופי ופרסום Production

## מטרה
לוודא שהאפליקציה הקיימת (שני מסכים, ארבעה צלילים, PWA ו־Offline) תואמת ל־PRD, לארכיטקטורה ולעיצוב, לתקן ליקויים שיימצאו — רק במסגרת הדרישות הקיימות — ולפרסם אותה ב־Cloudflare Pages בכתובת HTTPS, עם אימות מלא בסביבת Production. אין פיצ'רים חדשים, מסכים חדשים או שינויי התנהגות.

## מקורות
- `MILESTONES.md` — Milestone 5 (מה לממש + Definition of Done) וכללי הביצוע.
- `PRD.md` — כל קריטריוני הקבלה (בדיקת התאמה סופית).
- `ARCHITECTURE.md` §5.3–5.4 (RTL, Responsive), §10 (Hosting, Build ו־Deploy, HTTPS), §11 (אבטחה: כותרות HTTP, CSP, תלויות), §12 (נגישות), §13 (בדיקות), §16 (קריטריוני קבלה), ADR-1 עד ADR-4.
- `DESIGN.md` — מראה, כפתורים, Focus, "יש לוודא קריאות, ניגודיות, מצבי Focus וגדלי לחיצה".

## מצב קיים (מהקוד)
- Build סטטי ל־`dist/` (`npm run build`), PWA עם `generateSW` + `autoUpdate`, Precache מלא (כולל mp3 ופונטים), `start_url`/`scope` = `/` — מתאים לפריסה משורש הדומיין (Cloudflare Pages), בלי צורך ב־`base`.
- בדיקות קיימות: Vitest (`src/test/`), Playwright מול שרת הפיתוח (`e2e/flow.spec.ts`), Playwright מול ה־Build (`e2e-pwa/offline.spec.ts`) + `scripts/check-precache.mjs`.
- ה־repo מחובר ל־GitHub: `https://github.com/E-str-cloud/BreatheIn` (ענף `main`), עד Milestone 3 כולל.
- אין קובץ כותרות HTTP לאירוח (`_headers`), ואין קובץ שקובע גרסת Node לבנייה בענן.
- Node מקומי: 24.

## ❓ החלטה פתוחה שצריכה את אישורך לפני הבנייה: ניגודיות כפתורי `Enter` ו־`Start`
לפי DESIGN, הכפתורים הם טקסט **לבן** על רקע **Sage** (`#92B8A2`). יחס הניגודיות בין השניים הוא כ־**2.2:1** — נמוך מהמינימום המקובל לנגישות (3:1 לטקסט גדול כמו שבכפתורים; 4.5:1 לטקסט רגיל). זו סתירה בין ה־Style Guide לבין דרישת הנגישות (ARCHITECTURE §12, DESIGN: "יש לוודא... ניגודיות"), ולכן אני לא משנה בלי החלטה שלך. אפשרויות:
- **(א) להשאיר כמו בעיצוב** — ולתעד את זה בדוח הבדיקות כחריגה ידועה ומאושרת. הכי נאמן ל־Mockups.
- **(ב) רקע Sage כהה יותר** (למשל `#5E8C72`) עם טקסט לבן — ניגודיות כ־4:1, עובר לטקסט גדול. הכפתור נראה דומה, רק כהה יותר. *(ההמלצה שלי — שינוי קטן במראה, ושומר על "טקסט לבן על ירוק").*
- **(ג) להשאיר את הרקע, וטקסט כהה** (Charcoal `#4B5563`) במקום לבן — ניגודיות כ־3.4:1. שינוי בולט יותר מהעיצוב.

בכל אפשרות שאינה (א) — נעדכן את הערך ב־`tokens.css` בלבד, ואשאל אותך אם לעדכן גם את DESIGN.md.

## גישה — ארבעה שלבים
הפריסה ב־Cloudflare Pages נעשית **מתוך GitHub**, ולכן הקוד חייב להיות שם לפני שאפשר לבדוק Production. לפי CLAUDE.md אני עוצר ומבקש את אישורך לפני ה־push הזה, ואת חיבור Cloudflare את עושה בעצמך בהדרכה שלי.

### שלב א' — אימות ותיקונים מקומיים (בלי push)
1. **הרצת כל הבדיקות הקיימות:** `typecheck`, `lint`, `test`, `test:e2e`, `test:pwa`, `build` + `npm audit` (התראות אבטחה בתלויות, ARCHITECTURE §11). תיקון כל כישלון.
2. **בדיקת נגישות אוטומטית** — תלות פיתוח חדשה `@axe-core/playwright` (כלי בדיקה בלבד, לא נכנס לאפליקציה). קובץ חדש `e2e/a11y.spec.ts`, מובייל + Desktop:
   - סריקת axe של מסך הבית, מסך הפעולה, ומסך הפעולה עם כפתור "הפעלת קול" (חסימת השמעה מדומה) — ללא הפרות (או, אם נבחרה אפשרות (א), החרגה מתועדת של כלל הניגודיות לכפתורים בלבד).
   - כל כפתור הוא `button` עם שם נגיש; `lang="he"`, `dir="rtl"`.
   - ניווט במקלדת (Tab) מגיע לכל כפתור לפי סדר הגיוני, ו־Focus גלוי (`outline`/`box-shadow` בפועל, לא רק ב־CSS).
   - גודל לחיצה: כל כפתור לפחות 44×44 פיקסלים.
   - אין גלילה אופקית ברוחב 320, 375 ו־1280.
   - `prefers-reduced-motion: reduce` — אין מעברי אנימציה בכפתורים.
3. **התאמה לעיצוב:** צילומי מסך של שני המסכים (מובייל + Desktop) בדפדפן המובנה והשוואה ל־Wireframes / Mockups / Style Guide; בדיקת היעדר טיימר, הנחיות נשימה, כפתור `Home` או מסך שלישי.
4. **אימות "אין תלות חיצונית ואין איסוף מידע"** (DoD 8):
   - בבדיקות Playwright: כל בקשת רשת היא לאותו origin (קיים ב־`e2e-pwa`; יורחב גם ל־`e2e/flow.spec.ts`).
   - חיפוש בקוד ובתלויות (`package.json`) אחר `fetch`, `XMLHttpRequest`, `localStorage`, `indexedDB`, `cookie`, `sendBeacon`, analytics — מתועד בדוח.
5. **קבצים לפריסה:**
   - `public/_headers` (חדש) — כותרות אבטחה ש־Cloudflare Pages קורא אוטומטית (ARCHITECTURE §11):
     - לכל הנתיבים: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy` שחוסם מצלמה/מיקרופון/מיקום.
     - `Content-Security-Policy` מצומצם: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; media-src 'self'; worker-src 'self'; manifest-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`. אם תתגלה חסימה (למשל style מוטבע), מרחיבים רק את מה שנדרש ומתעדים.
     - `/sw.js` ו־`/manifest.webmanifest`: `Cache-Control: no-cache` — כדי שגרסה חדשה תזוהה מיד (ARCHITECTURE §8.3). קובצי `/assets/*` (עם hash בשם): `Cache-Control: public, max-age=31536000, immutable`.
     - `check-precache.mjs` מוודא ש־`_headers` לא נכנס ל־Precache ולא מוגש כקובץ באתר (Cloudflare לא מגיש אותו; ב־Workbox מוחרג דרך `globIgnores`).
   - `.node-version` (חדש) עם `24` — כדי שהבנייה ב־Cloudflare תשתמש באותה גרסת Node כמו במחשב שלך.
   - בדיקה מקומית של ה־CSP לפני Production: `vite.config.ts` → `preview.headers` עם אותו CSP, כך שבדיקות `test:pwa` רצות תחת אותה מדיניות ותופסות חסימות מוקדם. הערך כתוב בשני המקומות, ו־`check-precache.mjs` מוודא ששניהם זהים.
6. **בדיקות מול Production** — `playwright.prod.config.ts` (חדש) + סקריפט `test:prod`:
   - כתובת היעד נלקחת מ־`PROD_URL` (משתנה סביבה בשורת הפקודה, לא סוד ולא `.env`); בלי `webServer`.
   - מריץ את `e2e/flow.spec.ts`, `e2e/a11y.spec.ts` ו־`e2e-pwa/offline.spec.ts` מול האתר המפורסם, מובייל + Desktop.
   - קובץ חדש `e2e-prod/production.spec.ts`: HTTPS בלבד; מסך הבית בלי שגיאות קונסול ובלי בקשות שנכשלו (404 וכד'); הכותרות מ־`_headers` קיימות בתשובה; Manifest + אייקונים + `sw.js` מחזירים 200; ארבעת קובצי ה־mp3 נטענים, ואורך כל אחד (`duration`) ≤ 2 שניות.
7. **דוח בדיקות** — `docs/test-report.md` (חדש): תוצאות כל הבדיקות האוטומטיות, בדיקות נגישות, בדיקות Production, וטבלת בדיקות ידניות לפי דפדפן/מכשיר (ממולאת בשלב ד').

### שלב ב' — עצירה: אישור push
אחרי ששלב א' עובר במלואו מקומית — **אעצור ואבקש את אישורך** ל־commit + push ל־`main` (הודעה: "Milestone 5: pre-deploy checks and hosting config"). ה־push הזה **אינו** אישור של ה־Milestone ולא מסמן ✅.

### שלב ג' — חיבור Cloudflare Pages (את מבצעת, אני מדריך)
הדרכה צעד־אחר־צעד בשפה פשוטה, בזמן הבנייה:
1. כניסה / הרשמה ל־Cloudflare (חינם) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. אישור גישה של Cloudflare ל־GitHub — רק ל־repo `BreatheIn`.
3. הגדרות בנייה: Framework preset = **None** (או Vite); Build command = `npm run build`; Build output directory = `dist`; Production branch = `main`. אין צורך במשתני סביבה או סודות.
4. **Save and Deploy**, והמתנה לסיום הבנייה. תעתיקי לי את הכתובת שהתקבלה (`https://<שם>.pages.dev`).
5. מכאן כל push ל־`main` מפרסם גרסה חדשה אוטומטית. דומיין מותאם אישית — לא נדרש (אפשר בעתיד; עשוי לעלות כסף).
אם הבנייה בענן נכשלת — תעתיקי לי את הודעת השגיאה מהלוג, ואני מתקן (תיקון = push נוסף, שוב רק באישורך).

### שלב ד' — אימות Production
1. `PROD_URL=https://<שם>.pages.dev npm run test:prod` — כל הבדיקות עוברות.
2. בדפדפן המובנה מול האתר: מסך הבית, `Enter`, `Start`, השמעה; Service Worker פעיל ו־Cache מלא; ניתוק רשת + רענון + ניווט + השמעה; צילומי מסך מובייל + Desktop.
3. **בדיקת עדכון גרסה ב־Production:** שינוי זעיר שאינו נראה (למשל הערה בקוד) נכנס ב־push הבא (אם יש) — מוודאים שהגרסה החדשה נכנסת בפתיחה הבאה ושהצלילים עובדים Offline. אם אין push נוסף במהלך ה־Milestone, הבדיקה מסתמכת על בדיקת העדכון המקומית מ־Milestone 3 + כותרת `no-cache` של `sw.js`, ומתועדת כך.
4. **בדיקות ידניות שלך בטלפון** (רשימה פשוטה שאתן לך): iPhone/Safari ו־Android/Chrome (מה שיש לך) — פתיחה, צליל כניסה (או כפתור "הפעלת קול" אם נחסם, ולחיצה עליו), `Start` כמה פעמים, הוספה למסך הבית/התקנה, מצב טיסה → פתיחה מהאייקון → השמעה. את מדווחת לי, ואני רושם בדוח.
   - אם ב־iPhone הצלילים לא מתנגנים Offline — זה התרחיש שצפוי ב־ADR-4; התיקון: `injectManifest` + `RangeRequestsPlugin` לקובצי ה־mp3, ADR חדש, ובדיקה חוזרת.
5. עדכון `docs/test-report.md`, סימון 🟡 ב־MILESTONES.md.

## קבצים לשנות
- חדשים: `public/_headers`, `.node-version`, `playwright.prod.config.ts`, `e2e/a11y.spec.ts`, `e2e-prod/production.spec.ts`, `docs/test-report.md`.
- שינוי: `package.json` / `package-lock.json` (`@axe-core/playwright`, סקריפט `test:prod`), `vite.config.ts` (`preview.headers`, `globIgnores` ל־`_headers`), `scripts/check-precache.mjs`, `e2e/flow.spec.ts` (בדיקת same-origin), `tsconfig.node.json` + ESLint (כיסוי הקבצים החדשים).
- תיקונים שיימצאו בשלב א' — בקובצי הקוד הרלוונטיים בלבד; `src/styles/tokens.css` רק לפי החלטת הניגודיות.
- `spec/ARCHITECTURE.md` — ADR-5: פריסה ל־Cloudflare Pages (הגדרות בנייה, `.node-version`, כותרות ו־CSP ב־`_headers`, מדיניות Cache ל־`sw.js` ול־`assets`).
- `CLAUDE.md` — "פקודות הרצה": `test:prod` עם `PROD_URL`, וכתובת ה־Production.
- `spec/MILESTONES.md` — 🟡 בסיום.

## Definition of Done (מ־MILESTONES.md) — ואיך כל סעיף נבדק
- [ ] אתר Production נפתח ב־HTTPS ומציג את מסך הבית ללא שגיאות או משאבים חסרים. ← `production.spec.ts` (קונסול + בקשות שנכשלו) + בדיקה בדפדפן המובנה.
- [ ] כל זרימת `Enter` → מסך הפעולה → `Start` פועלת באתר המפורסם. ← `flow.spec.ts` מול Production + בדיקה ידנית בטלפון.
- [ ] צליל הכניסה, בחירה אקראית מכל ארבעת הצלילים, חזרות מותרות וניסיון חוזר לאחר חסימה נבדקו. ← `flow.spec.ts` + Vitest + בדיקה ידנית.
- [ ] כל ארבעת הצלילים נבדקו בסביבת Production; אורכם עד שתי שניות. ← `production.spec.ts` (`duration`) + האזנה ידנית.
- [ ] אחרי טעינה מלאה ב־Production, ניתוק הרשת אינו מונע פתיחה, ניווט או השמעת צלילים. ← `offline.spec.ts` מול Production + מצב טיסה בטלפון.
- [ ] המסכים תואמים ל־`DESIGN.md`; אין מסך הדרכה שלישי, טיימר או פיצ'רים שלא הוגדרו. ← צילומי מסך + השוואה למקורות + `a11y.spec.ts`.
- [ ] בדיקות TypeScript, ESLint, Build, Vitest ו־Playwright עוברות, ותוצאות בדיקות ידניות בדפדפנים הרלוונטיים מתועדות. ← `docs/test-report.md`.
- [ ] לא קיימים Backend, Database, Authentication, APIs חיצוניים, Analytics או איסוף מידע אישי. ← בדיקת same-origin + חיפוש בקוד, מתועד בדוח.
- [ ] המשתמש קיבל קישור לאפליקציה ואת תוצאות הבדיקות לצורך אישור סופי. ← בסיכום הבנייה.

## מחוץ לטווח באבן דרך זו
דומיין מותאם אישית; GitHub Pages; סביבת Preview נפרדת או CI אוטומטי ב־GitHub Actions; בדיקות אוטומטיות ב־Firefox/WebKit (Safari נבדק ידנית בטלפון); כפתור התקנה או הודעת "גרסה חדשה" בתוך האפליקציה; כל פיצ'ר, מסך או שינוי התנהגות שלא מופיע ב־PRD.
