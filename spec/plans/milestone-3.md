# תוכנית — Milestone 3: PWA ושימוש Offline

## מטרה
להפוך את האפליקציה הקיימת (שני מסכים + ארבעה צלילים) ל־PWA: Manifest, אייקונים, Service Worker ו־Precache של כל המשאבים — כך שאפשר להתקין אותה בדפדפן תומך, ולאחר טעינה ראשונה מלאה לפתוח אותה, לנווט ולהשמיע צלילים בלי אינטרנט. אין שינוי במסכים, בהתנהגות או בעיצוב.

## מקורות
- `MILESTONES.md` — Milestone 3 (מה לממש + Definition of Done).
- `PRD.md` §1.3 (זמינות Offline), §5 (PWA ו־Offline), קריטריון קבלה 9; §1.3 — דיסקרטיות (גם האייקון והשם לא מסגירים את אופי הצלילים).
- `ARCHITECTURE.md` §4 (`public/icons`, `manifest.webmanifest`), §7.1 (אודיו ב־Precache), §8.1–8.4, §10.2, §13.3, ADR-1 (פונט מקומי).
- `DESIGN.md` §2 — פלטה (Warm White `#FAF9F6`, Mint, Blush, Lavender, Sage) ומוטיב הטבעות.

## מצב קיים (מהקוד)
- `vite.config.ts` — רק `react()` + הגדרות Vitest. אין `vite-plugin-pwa`.
- אין תיקיית `public/`; אין אייקונים, Manifest או Service Worker.
- `index.html` כבר מכיל `lang="he"`, `dir="rtl"`, `theme-color` = `#FAF9F6`.
- ארבעת קובצי ה־MP3 מיובאים ב־`soundCatalog.ts` → Vite מוציא אותם ל־`dist/assets/` עם hash בשם. גם קובצי Heebo (`woff2`/`woff`) יוצאים ל־`dist/assets/`.
- Playwright רץ מול שרת הפיתוח (5173). סקריפט `preview` קיים ב־`package.json`.

## ✅ הוחלט: אייקון האפליקציה — אפשרות (א)
מקור האייקון נוצר: `public/icon-source.svg` — שלוש טבעות פסטל חופפות (Lavender, Mint, Blush) עם עיגול לבן במרכז, על רקע Warm White עם גרדיאנט עדין; כל הטבעות בתוך האזור הבטוח של אייקון maskable. בבנייה נשאר רק להפיק ממנו את קובצי ה־PNG.

### (רקע ההחלטה)
ה־spec מחייב אייקונים (ARCHITECTURE §8.1), אבל אין במקורות עיצוב לאייקון (DESIGN מגדיר רק את אייקוני הממשק Play ורמקול מושתק). **הצעה:** אייקון פשוט שאני מצייר מתוך מוטיב הטבעות הקיים — שלוש־ארבע טבעות פסטל חופפות (Mint, Blush, Lavender) על רקע Warm White, בלי טקסט ובלי סמל Play. הוא דיסקרטי, תואם לשפה העיצובית, ולא מוסיף צורה חדשה. אפשרויות:
- **(א)** לאשר את ההצעה (ואחרי הבנייה תראי אותו ותחליטי אם לשנות).
- **(ב)** לספק בעצמך תמונת אייקון ריבועית (PNG או SVG, לפחות 512×512) — אשמור אותה בשם `public/icon-source.svg`/`png`.
- **(ג)** תיאור אחר של מה שאת רוצה באייקון.

שם האפליקציה ב־Manifest: `name` ו־`short_name` = „נשום פנימה” (לפי PRD §1.4; קצר מספיק למסך הבית בטלפון).

## גישה

### תלויות חדשות (devDependencies)
- `vite-plugin-pwa` (גרסה 2, תומכת ב־Vite 8) — יוצר Manifest ו־Service Worker מבוסס Workbox (`generateSW`). מושך איתו את `workbox-build`/`workbox-window`.
- `@vite-pwa/assets-generator` — יוצר מקובץ SVG אחד את כל גדלי האייקונים (64, 192, 512, maskable 512, apple-touch 180, favicon). מורץ פעם אחת; קובצי ה־PNG שנוצרים נשמרים ב־`public/` ונכנסים ל־git.

### מבנה קבצים (שינויים ותוספות)
```text
public/
  icon-source.svg            (חדש: מקור האייקון — טבעות פסטל על Warm White)
  favicon.ico, pwa-64x64.png, pwa-192x192.png, pwa-512x512.png,
  maskable-icon-512x512.png, apple-touch-icon-180x180.png   (נוצרים מה-SVG)
pwa-assets.config.ts         (חדש: הגדרת יצירת האייקונים, preset "minimal-2023")
vite.config.ts               (שינוי: הוספת VitePWA)
index.html                   (שינוי: favicon, apple-touch-icon, apple-mobile-web-app-title)
src/vite-env.d.ts            (שינוי: טיפוסי vite-plugin-pwa אם נדרש)
playwright.pwa.config.ts     (חדש: בדיקות PWA מול ה-Build ולא מול שרת הפיתוח)
e2e-pwa/offline.spec.ts      (חדש)
scripts/check-precache.mjs   (חדש: בדיקה שכל קובץ ב-dist נמצא ברשימת ה-Precache)
```
`ARCHITECTURE` §4 מציע `public/icons/` ו־`public/manifest.webmanifest`; בפועל ה־Manifest נוצר אוטומטית בזמן Build (`dist/manifest.webmanifest`) והאייקונים בשורש `public/` — זה ה־default של הכלי, ופשוט יותר. מותר לפי ההערה ב־§4 ("מבנה לוגי מומלץ").

### Manifest (מוגדר בתוך `VitePWA({ manifest })`)
- `name` / `short_name`: „נשום פנימה”; `lang: 'he'`, `dir: 'rtl'`.
- `start_url: '/'`, `scope: '/'`, `display: 'standalone'`.
- `theme_color` ו־`background_color`: `#FAF9F6` (Warm White — תואם ל־`theme-color` הקיים ולרקע, כך שמסך הפתיחה של האפליקציה המותקנת לא "מהבהב").
- `icons`: 64, 192, 512 (`purpose: 'any'`) + maskable 512 (`purpose: 'maskable'`).
- ללא `description` שיווקי, ללא screenshots/shortcuts — לא נדרשים ב־spec.

### Service Worker ו־Precache
- `strategies: 'generateSW'` (Workbox יוצר את ה־SW; אין קוד SW ידני).
- `workbox.globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff,woff2,mp3}']` — **מפורש** כולל `mp3` ו־`woff2`, כי ברירת המחדל לא כוללת אודיו (ARCHITECTURE §8.2: "לא להניח").
- `navigateFallback: '/index.html'` — פתיחה Offline של הכתובת הראשית מוגשת מה־Cache.
- אין `runtimeCaching` — אין בקשות רשת חיצוניות (ARCHITECTURE §8.2, §9.3).
- שימוש ב־`devOptions` כבוי: ה־SW פועל רק ב־Build. שרת הפיתוח וכל הבדיקות הקיימות לא משתנים.

### מדיניות עדכון (ARCHITECTURE §8.3, DoD: "עדכון גרסה אינו משאיר הפניות למשאבים חסרים")
- `registerType: 'autoUpdate'` + `injectRegister: 'auto'` — רישום ה־SW מתבצע אוטומטית, בלי שינוי בקוד React ובלי מסך עדכון.
- `cleanupOutdatedCaches: true`, `skipWaiting` + `clientsClaim` (ברירת המחדל של autoUpdate).
- **למה זה מונע ערבוב גרסאות:** כל קובצי ה־Build (JS, CSS, אודיו, פונט) נכנסים לאותה רשימת Precache עם hash בשם/revision. גרסה חדשה של ה־SW מורידה את **כל** הקבצים החדשים לפני שהיא נכנסת לפעולה; רק אז הישנים נמחקים. כך JS מגרסה חדשה תמיד מוצא את קובצי האודיו שלו. התוצאה למשתמשת: הגרסה החדשה מופיעה בפתיחה הבאה של האפליקציה (או ברענון), בלי הודעה.
- **סיכון ידוע:** אם הגרסה החדשה נכנסת לפעולה בזמן שמסך הפעולה פתוח, קבצים ישנים נמחקים מה־Cache — אבל אלמנטי ה־`Audio` כבר טענו את הצלילים מראש (`preload="auto"`), וכשיש רשת הדפדפן ימשיך לטעון מהשרת. נבדוק את התרחיש הזה במפורש (ראה "בדיקות").

### אודיו מתוך ה־Cache — נקודה לבדיקה
דפדפנים מבקשים קובצי מדיה לעיתים בבקשות חלקיות (Range). Precache של Workbox מחזיר את הקובץ המלא; Chrome מסתדר עם זה, ו־Safari לפעמים לא. מכיוון שהקבצים קצרים מאוד (כ־60KB), מתחילים בפתרון הפשוט (Precache רגיל) ובודקים השמעה Offline בפועל. **אם** תתגלה בעיה ב־Safari/iPhone (בבדיקה הידנית שלך) — התיקון יהיה מעבר ל־`injectManifest` עם `RangeRequestsPlugin` של Workbox לקובצי ה־mp3, ויתועד כ־ADR. לא מוסיפים את זה מראש.

### סקריפטים ב־`package.json`
- `generate-pwa-assets` = `pwa-assets-generator` (חד־פעמי, ליצירת האייקונים).
- `preview` = `vite preview --port 4173 --strictPort` (שינוי קטן: פורט קבוע).
- `test:pwa` = `npm run build && node scripts/check-precache.mjs && playwright test -c playwright.pwa.config.ts`.
- `.claude/launch.json`: הוספת תצורה `pwa-preview` (Build + preview על 4173) — כדי שאוכל להריץ לך את הגרסה עם ה־PWA ("הרץ כדי שאבדוק").
- `CLAUDE.md` → "פקודות הרצה": הוספת הרצת גרסת PWA (`npm run build` ואז `npm run preview`, http://localhost:4173) והסבר שבשרת הפיתוח (5173) אין Service Worker.

## בדיקות

### `scripts/check-precache.mjs` (אחרי Build)
- קורא את `dist/sw.js` ומוציא את רשימת ה־Precache.
- מוודא: כל קובץ ב־`dist/` (חוץ מ־`sw.js`/`workbox-*.js` עצמם) מופיע ברשימה; ארבעת קובצי ה־mp3 (`fart`, `burp`, `bouncy-cartoon`, `boing`) מופיעים; קובצי Heebo מופיעים; `manifest.webmanifest` וכל האייקונים שהוא מפנה אליהם קיימים ב־`dist/`.
- נכשל עם הודעה ברורה אם משהו חסר.

### Playwright — `playwright.pwa.config.ts` + `e2e-pwa/offline.spec.ts`
- `webServer`: `npm run preview` (פורט 4173) — ה־Build האמיתי, עם Service Worker. Chromium בלבד, מובייל + Desktop כמו היום. אותה הגדרת autoplay כמו בבדיקות הקיימות.
- **רישום ו־Manifest:** `navigator.serviceWorker.ready` מצליח; `<link rel="manifest">` נטען, ה־JSON תקין (name, `display: standalone`, `start_url`, אייקונים 192 ו־512), וכל אייקון מחזיר 200 ותמונה תקינה.
- **Cache מלא:** אחרי טעינה ראשונה והמתנה ל־SW פעיל — `caches` מכיל את ארבעת קובצי ה־mp3, את ה־JS/CSS ואת `index.html`.
- **Offline:** `context.setOffline(true)` → רענון → מסך הבית מופיע (כולל פונט Heebo, `document.fonts.check`) → `Enter` → מסך הפעולה, צליל הכניסה מתנגן (ה־`play()` לא נדחה ואין אירוע `error`) → לחיצות על `Start` ועל Play משמיעות צלילים מתוך ארבעת הקבצים, בלי שגיאת טעינה.
- **אין בקשות חיצוניות:** כל הבקשות במהלך הבדיקה הן לאותו origin.

### עדכון גרסה (DoD 5) — בדיקה מתועדת שאני מריץ בזמן הבנייה
1. Build + preview, טעינה מלאה (SW פעיל, Cache מלא).
2. שינוי זמני ומזערי בקוד (למשל הערה ב־JS שמשנה את ה־hash) ו־Build מחדש — בלי לסגור את הדף.
3. רענון: ה־SW החדש מותקן ונכנס לפעולה; ב־Cache נשארת רק הגרסה החדשה; כל הקבצים שה־JS החדש מפנה אליהם (כולל ה־mp3) נמצאים ב־Cache; ניתוק רשת + השמעה עובדים.
4. החזרת השינוי הזמני. התוצאות נרשמות בדוח הבנייה.
(לא נכנס כבדיקה אוטומטית קבועה — מסובך מדי לתועלת שלו, ו־`check-precache.mjs` כבר שומר על העיקרון בכל Build.)

### בדיקות קיימות
`npm test`, `npm run test:e2e`, `typecheck`, `lint`, `build` — חייבות להמשיך לעבור בלי שינוי. `tsconfig.node.json` יורחב לכלול את `playwright.pwa.config.ts`, `pwa-assets.config.ts`, `e2e-pwa/` ו־`scripts/` לפי הצורך; ESLint יכסה גם אותם.

## קבצים לשנות
- `package.json` / `package-lock.json`, `vite.config.ts`, `index.html`, `tsconfig.node.json`, `src/vite-env.d.ts` (אם נדרש), `.claude/launch.json`.
- חדשים: `public/*` (מקור האייקון + הקבצים שנוצרו), `pwa-assets.config.ts`, `playwright.pwa.config.ts`, `e2e-pwa/offline.spec.ts`, `scripts/check-precache.mjs`.
- `.gitignore` — הוספת `dev-dist/` (התיקייה ש־vite-plugin-pwa יוצר אם מפעילים SW בפיתוח; ליתר ביטחון).
- `spec/ARCHITECTURE.md` — ADR-4: PWA עם `generateSW` + `autoUpdate`, Precache מפורש לאודיו ולפונט, ומיקום Manifest/אייקונים (נוצרים בזמן Build, אייקונים בשורש `public/`).
- `CLAUDE.md` — פקודות הרצה/בדיקה חדשות.
- `spec/MILESTONES.md` — 🟡 ליד כותרת Milestone 3 בסיום הבנייה.

## אימות בסיום הבנייה
1. `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e`, `npm run test:pwa` — כולם עוברים.
2. Build + preview בדפדפן המובנה: ב־DevTools/JS — SW פעיל, Manifest תקין, אייקונים נטענים, Cache מכיל את כל הקבצים; ניתוק רשת (`setOffline`) + רענון + ניווט + השמעה.
3. בדיקת עדכון הגרסה (למעלה).
4. בדיקה חזותית של האייקון בגדלים 192/512 ובגרסת maskable (שהטבעות לא נחתכות בעיגול/ריבוע מעוגל).
5. שרת הפיתוח (5173) — מוודא שאין SW ושהכול עובד כמו קודם.
6. סגירת כל השרתים בסיום.

**בדיקות שרק את יכולה לעשות (יופיעו בהוראות "הרץ כדי שאבדוק"):** התקנה בפועל מ־Chrome ב־Desktop (אייקון ההתקנה בשורת הכתובת), ובטלפון — רק אחרי הפריסה ב־HTTPS (Milestone 4), כי טלפון לא יכול לגשת ל־localhost של המחשב באופן מאובטח. iPhone/Safari: התקנה דרך "הוספה למסך הבית" — מגבלה של הדפדפן ולא תקלה (DoD 4).

## Definition of Done (מ־MILESTONES.md)
- [ ] קובץ Manifest תקין, אייקונים תקינים ו־Service Worker נרשם בהצלחה ב־HTTPS או ב־localhost נתמך.
- [ ] כל ארבעת קובצי האודיו ומשאבי האפליקציה מופיעים ב־Cache לאחר טעינה ראשונה מלאה.
- [ ] לאחר טעינה מלאה וניתוק הרשת ניתן לפתוח את האפליקציה, לנווט בין שני המסכים ולהשמיע צלילים. *(הערה: "לנווט בין שני המסכים" = בית → פעולה; אין חזרה, לפי ההחלטה ב־Milestone 2.)*
- [ ] האפליקציה ניתנת להתקנה בדפדפן תומך; מגבלות התקנה של דפדפנים אחרים אינן מוצגות כתקלה במוצר.
- [ ] עדכון גרסה אינו משאיר הפניות למשאבים חסרים או משבית את ההשמעה.
- [ ] בדיקות Offline ו־PWA מתועדות ומוצגות למשתמש לאישור.

## מחוץ לטווח באבן דרך זו
פריסה ל־Cloudflare Pages ובדיקות ב־HTTPS אמיתי ובטלפון (Milestone 4); מסך/הודעת "גרסה חדשה זמינה"; כפתור התקנה בתוך האפליקציה; בדיקות בדפדפנים Firefox/WebKit; כל שינוי במסכים או בהתנהגות.
