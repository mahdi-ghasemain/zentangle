# نمایش نسخهٔ وب به کارفرما

کد منبع: https://github.com/mahdi-ghasemain/zentangle

این پروژه برای نمایش تعاملی طرح آماده شده است. کارفرما می‌تواند در صفحهٔ ورود، «ورود به نسخهٔ آزمایشی» را انتخاب کند و بدون ساخت حساب، جلسات، آموزش‌ها، گالری و صفحات دیگر را ببیند. داده‌های آزمایشی هر بازدیدکننده روی مرورگر خودش ذخیره می‌شوند.

## Vercel

۱. در https://vercel.com/new مخزن `mahdi-ghasemain/zentangle` را Import کنید.
۲. Root Directory برابر ریشهٔ مخزن بماند. تنظیمات `vercel.json` خودکار اعمال می‌شوند:

- Framework: Other
- Install Command: `npm ci --include=dev`
- Build Command: `npm run build:web`
- Output Directory: `dist`
- Node.js: 22.x

۳. برای نمایش آزمایشی **هیچ متغیر محیطی یا اتصال Supabase لازم نیست**.
۴. Deploy را بزنید. پس از Ready شدن، نشانی Production با پسوند `vercel.app` را از بخش Domains بردارید و برای کارفرما بفرستید. لینک عمومی را در یک مرورگر بدون ورود به Vercel امتحان کنید.

قانون rewrite برای باز کردن و تازه‌سازی مسیرهایی مانند `/login` و `/gallery` در فایل تنظیمات وجود دارد. فایل‌های ساخته‌شده و node_modules در Git قرار نمی‌گیرند؛ Vercel آن‌ها را از کد منبع می‌سازد. در صورت اتصال Git integration، تغییرات بعدی شاخهٔ main دوباره منتشر می‌شوند.

## استفادهٔ واقعی

این انتشار، پیش‌نمایش طرح و عملکرد آزمایشی است. برای دادهٔ واقعی، احراز هویت، تماس گروهی و آماده‌سازی انتشار نهایی، README.md و VERIFICATION.md را بخوانید. کلید service_role یا رمز عبور را در متغیرهای EXPO_PUBLIC قرار ندهید.

مرجع تنظیمات: https://docs.expo.dev/guides/publishing-websites/#vercel
