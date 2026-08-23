# أَثر (Athar-App)

تطبيق **أَثر** هو تطبيق ويب تقدمي (PWA) مبني باستخدام React وVite، ويقدّم محتوى دينيًا يوميًا مثل الأحداث الهجرية، تعقيبات الصلوات، الأدعية، الزيارات، المناجاة، والمحتوى المكتبي. صُمم التطبيق وفق نموذج **Local-first / Offline-first**: يبدأ من البيانات المضمّنة محليًا، ثم يستفيد من Supabase عند توفر الاتصال، من غير أن يجعل الشبكة شرطًا لفتح التطبيق أو قراءة المحتوى الأساسي.

> **المبدأ التشغيلي:** JSON محلي → واجهة فورية Offline → IndexedDB للمفضلات → مزامنة خلفية مع Supabase عند توفر الإنترنت.

لا يحتوي التطبيق على تكامل Telegram أو أزرار إرسال أو دوال ربط حسابات. كما أن التطبيق لا يضع أي مفتاح إداري أو `service_role` في الواجهة الأمامية.

## 1. أهداف المرحلة الحالية

الهدف الحالي هو تثبيت طبقة البيانات والمزامنة فقط، وليس إضافة ميزات جديدة. لذلك يركّز الكود على أربعة أمور: تشغيل الواجهة من JSON فورًا، جلب التحديثات السحابية في الخلفية، حفظ المفضلات محليًا مع طابور قابل لإعادة المحاولة، واستخدام Anonymous Auth عند توفر الشبكة من دون منع القراءة المحلية.

| المجال | السلوك النهائي |
|---|---|
| التشغيل الأول | يبدأ من JSON ولا ينتظر Supabase |
| الاتصال | يجلب محتوى الشاشة المطلوبة فقط في الخلفية |
| انقطاع الاتصال | تبقى الواجهة والمحتوى المحلي والمفضلات متاحة |
| المفضلات | حفظ فوري محلي ثم `upsert` أو حذف سحابي لاحقًا |
| المصادقة | جلسة مجهولة اختيارية، ولا تمنع الاستخدام المحلي |
| الأمان | الواجهة تستخدم anon/publishable key فقط مع RLS |

## 2. هيكل المشروع ومسؤوليات الملفات

```text
src/
├── App.tsx                         # التوجيه وتجميع Providers
├── main.tsx                        # نقطة إقلاع React
├── components/
│   ├── BottomNav.jsx               # التنقل فقط
│   ├── ReaderView.jsx               # عرض النص والتحكم بالمفضلة محليًا
│   └── PDFViewer.jsx                # عرض رابط PDF إن كان pdf_url صالحًا
├── contexts/
│   ├── AppContext.jsx               # الحالة العامة ومحتوى اليوم
│   └── AuthContext.jsx               # الجلسة المجهولة والمزامنة الخلفية
├── data/
│   ├── hijri_events.json            # Bootstrap محلي للأحداث الهجرية
│   ├── taqibat.json                 # Bootstrap محلي للتعقيبات
│   └── weekly.json                  # Bootstrap محلي للمحتوى الأسبوعي
├── pages/
│   ├── Home.jsx                     # البرنامج اليومي
│   ├── Prayers.jsx                  # مواقيت الصلاة والتعقيبات
│   ├── Library.jsx                  # محتوى المكتبة عند فتح الشاشة
│   ├── Favorites.jsx                # المفضلات المحلية/السحابية
│   └── Settings.jsx                 # إعدادات المستخدم والتطبيق
├── repositories/
│   └── contentRepository.js         # جميع قراءات محتوى Supabase
├── services/
│   ├── offlineDB.js                 # IndexedDB والطابور والمزامنة
│   ├── supabaseClient.js            # عميل Supabase العام
│   └── prayerCalc.js                # حساب مواقيت الصلاة
└── utils/
    └── dateSync.js                  # التاريخ الهجري واليوم الأسبوعي
```

طبقة العرض لا تحتوي استعلامات Supabase مباشرة. المكونات تعرض الحالة وتتفاعل مع المستخدم فقط، و`AppContext` ينسق محتوى اليوم، و`contentRepository` يقرأ من السحابة، و`offlineDB` يدير التخزين المحلي وطابور العمليات، بينما `supabaseClient` ينشئ عميل الاتصال العام.

## 3. البيانات المحلية بصيغة JSON

توجد ملفات JSON في `src/data`، ولا يجوز حذفها لأنها تمثل **Local Bootstrap Data** واحتياط التشغيل عند عدم توفر الشبكة. حجم البيانات المحلية الحالية صغير ومقصود كبداية محلية؛ أما المصدر الغني في Supabase فيُجلب عند توفر الاتصال أو عند فتح الشاشة التي تحتاجه.

| الملف | عدد العناصر الحالي | الحقول الأساسية | الاستخدام |
|---|---:|---|---|
| `src/data/hijri_events.json` | 3 | `id`, `hijri_date`, `month`, `day`, `text` | الأحداث المعروضة في Home |
| `src/data/taqibat.json` | 4 | `id`, `category`, `prayer`, `title`, `text` | تعقيبات شاشة Prayers |
| `src/data/weekly.json` | 3 | `id`, `weekday`, `title`, `is_pdf`, `file_id`, و`text` اختياري | احتياط Home وLibrary |

### 3.1 شكل ملف `hijri_events.json`

```json
[
  {
    "id": "EV00001",
    "hijri_date": "01-01",
    "month": "محرم الحرام",
    "day": "1",
    "text": "نص المناسبة الهجرية"
  }
]
```

`hijri_date` نص بصيغة `DD-MM` كما يتوقعه `AppContext` عند تصفية أحداث اليوم. قيمة `text` هي النص المعروض، وقد تتضمن أكثر من فقرة مفصولة بسطر جديد.

### 3.2 شكل ملف `taqibat.json`

```json
[
  {
    "id": "F001",
    "category": "taqibat",
    "prayer": "fajr",
    "title": "تعقيب الفجر",
    "text": "نص التعقيب"
  }
]
```

القيمة `prayer` تربط السجل بأحد مفاتيح الصلاة في `Prayers.jsx`: `fajr`, `dhuhr`, `asr`, `maghrib`, أو `isha`.

### 3.3 شكل ملف `weekly.json`

```json
[
  {
    "id": "WZ001",
    "weekday": "saturday",
    "title": "زيارة يوم السبت",
    "is_pdf": true,
    "file_id": "legacy-file-identifier"
  },
  {
    "id": "WD001",
    "weekday": "saturday",
    "title": "دعاء يوم السبت",
    "is_pdf": false,
    "text": "نص الدعاء"
  }
]
```

`text` اختياري لأن عناصر PDF لا تحتوي نصًا محليًا. الحقل `file_id` موجود في البيانات القديمة، لكنه لا يُستخدم لفتح الملف أو إرساله؛ التطبيق يفتح PDF فقط عندما يتوفر `pdf_url` صريح وآمن من المصدر السحابي.

## 4. مشروع Supabase ومخططه الفعلي

يستخدم التطبيق مشروع Supabase الحالي ذي المعرّف `ocjytwphvzrhoxmmgujh`. أسماء الجداول الفعلية تختلف عن بعض الأسماء المختصرة الواردة في الوصف الأولي؛ الأسماء المعتمدة في الكود هي `hijri_events` و`weekly_content` و`weekly_duas` و`weekly_ziyarat` و`pdf_library`.

### 4.1 جداول المحتوى

| الجدول | الحقول الفعلية | استخدام Athar-App الحالي |
|---|---|---|
| `wisdoms` | `id text`, `text text`, `author text`, `source text`, `sent boolean`, `sent_at timestamptz`, `created_at timestamptz`, `tag_status text`, `tags text[]`, `is_active boolean`, `duplicate_of text` | غير معروض حاليًا لعدم وجود شاشة حكم مستقلة |
| `hadiths` | `id text`, `text text`, `author text`, `source text`, `category text`, `is_featured boolean`, `sent boolean`, `sent_at timestamptz`, `created_at timestamptz`, `tag_status text`, `tags text[]`, `is_active boolean`, `duplicate_of text` | غير معروض حاليًا لعدم وجود شاشة حديث مستقلة |
| `hijri_events` | `id text`, `hijri_date text`, `month text`, `day text`, `text text` | Home، حسب تاريخ اليوم الهجري |
| `taqibat` | `id text`, `category text`, `prayer text`, `title text`, `text text`, `source text`, `delay_minutes integer`, `priority integer`, `content_length integer`, `recommended_time text`, `is_featured boolean`, `send_score double precision` | Prayers |
| `weekly_content` | `id text`, `category text`, `weekday text`, `title text`, `text text`, `source text`, `content_length integer`, `recommended_time text`, `is_featured boolean`, `send_score double precision`, `is_pdf boolean`, `file_id text`, `pdf_url text` | Home عند اليوم الحالي، وLibrary عند فتحها |
| `weekly_duas` | `id text`, `weekday text`, `title text`, `text text`, `source text`, `content_length integer`, `recommended_time text`, `is_featured boolean`, `send_score real`, `sent boolean`, `sent_at timestamptz`, `created_at timestamptz` | Library عند فتحها |
| `weekly_ziyarat` | `id text`, `weekday text`, `title text`, `is_pdf boolean`, `file_id text`, `sent boolean`, `sent_at timestamptz`, `created_at timestamptz`, `pdf_url text` | Library عند فتحها |
| `munajat` | `id text`, `category text`, `title text`, `text text`, `source text`, `content_length integer`, `recommended_time text`, `is_featured boolean`, `send_score double precision` | Library عند فتحها |
| `pdf_library` | `id text`, `title text`, `is_pdf boolean`, `file_id text`, `pdf_url text` | Library عند فتحها |

الحقول التشغيلية مثل `sent`, `sent_at`, `send_score` و`file_id` جزء من المخطط الفعلي الحالي، لكنها لا تُستخدم من طبقة Athar-App الحالية. كما أن `file_id` ليس رابط قراءة؛ لذلك لا يحوله التطبيق إلى URL ولا يعتمد عليه لفتح ملف.

### 4.2 جداول المستخدمين والمفضلات

| الجدول | الحقول الفعلية | مسؤولية التطبيق |
|---|---|---|
| `users` | `id uuid`, `telegram_user_id bigint`, `username text`, `full_name text`, `city text`, `latitude double precision`, `longitude double precision`, `created_at timestamptz`, `last_active timestamptz` | يكتب التطبيق `id` و`last_active` فقط عند توفر جلسة Supabase |
| `favorites` | `id bigint`, `user_id uuid`, `content_type text`, `content_id text`, `title text`, `added_at timestamptz` | تخزين المفضلات السحابية بعد المزامنة |

يوجد في جدول `users` حقل قديم باسم `telegram_user_id`، لكنه غير مقروء وغير مكتوب من Athar-App، ولا توجد له دالة أو واجهة في المشروع. إبقاء الحقل في قاعدة البيانات يحافظ على المخطط والبيانات الموجودة؛ حذفه قرار مستقل يحتاج Migration ونسخة احتياطية إذا تقرر تنظيف المخطط مستقبلًا.

يملك جدول `favorites` فهرسًا فريدًا مركبًا على `(user_id, content_type, content_id)`. لذلك يمكن إعادة إرسال العملية نفسها بأمان باستخدام `upsert` دون إنشاء سجل مكرر. في التطبيق، `user_id` يأتي من جلسة Supabase وليس من قيمة يكتبها المستخدم داخل الواجهة.

## 5. متغيرات البيئة وعميل Supabase

أنشئ ملفًا محليًا باسم `.env.local` في جذر المشروع:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
```

ملفات `.env*` مستثناة من Git، و`.env.example` يحتوي أسماء المتغيرات فقط. لا تضع أبدًا `SUPABASE_SERVICE_ROLE_KEY` أو أي مفتاح إداري داخل `VITE_*` أو داخل ملفات `src`. المفتاح العام لا يمنح صلاحيات آمنة بمفرده؛ RLS هو الذي يقيّد القراءة والكتابة.

`src/services/supabaseClient.js` لا ينشئ العميل إلا إذا كانت القيم موجودة. إذا غابت القيم، تكون `supabase` مساوية لـ`null` ويستمر التطبيق في الوضع المحلي بدل استخدام عناوين أو مفاتيح وهمية.

## 6. مسار تحميل المحتوى

يبدأ `AppContext` من `getLocalTodayContent()` أثناء إنشاء الحالة، فيُظهر JSON فورًا. بعد أول Render يستدعي `fetchTodayContent()` في الخلفية. لا توجد شاشة تحميل تنتظر Supabase، وإذا فشل أي جدول أو الطلب كله تبقى البيانات المحلية في الحالة.

```text
فتح التطبيق
    ↓
تحميل hijri_events.json + taqibat.json + weekly.json
    ↓
ظهور Home وPrayers من البيانات المحلية
    ↓
Background Sync عند توفر الاتصال
    ↓
Repository يقرأ الجداول المطلوبة فقط
    ├── hijri_events حسب hijri_date
    ├── weekly_content حسب weekday
    └── taqibat
    ↓
استبدال المصدر المحلي فقط عندما تصل بيانات سحابية غير فارغة
```

لا تُحمّل جداول `wisdoms` أو `hadiths` عند بدء التطبيق لأنها لا تخدم شاشة موجودة حاليًا. وعند فتح Library فقط، يُستدعى `fetchLibraryContent()` ويقرأ `weekly_content` و`weekly_duas` و`weekly_ziyarat` و`munajat` و`pdf_library`، ثم يوحّد الشكل إلى العناصر التي يفهمها `Library.jsx`.

## 7. نظام المفضلات النهائي

المفضلة Local-first ولا تنتظر الشبكة. يقوم `ReaderView` بفحص حالة العنصر من IndexedDB، وعند الضغط:

```text
ReaderView
    ↓
saveFavorite() أو removeFavorite()
    ↓
IndexedDB عبر localforage: تحديث favorites فورًا
    ↓
pendingFavoriteOperations: إضافة upsert أو delete
    ↓
تحديث الواجهة مباشرة
    ↓
عند توفر user_id والاتصال:
    ↓
syncFavorites()
    ├── upsert إلى favorites عند الإضافة
    └── delete بواسطة user_id + content_type + content_id عند الحذف
    ↓
إزالة العملية من Queue بعد رد Supabase ناجح فقط
```

يستخدم الطابور مفتاحًا منطقيًا من نوع `content_type:content_id` لمنع تكرار العملية نفسها. إذا فشل الطلب أو انقطع الاتصال، تبقى العملية في الطابور ولا تُحذف. إذا أضيف العنصر ثم حُذف قبل المزامنة، تُحفظ آخر عملية منطقية لذلك المستخدم، وهي عملية الحذف.

عند عودة الجلسة المجهولة، تُربط العمليات التي أُنشئت قبل اكتمال المصادقة بمعرّف المستخدم الحالي. ثم تُقرأ المفضلات السحابية وتُدمج مع المحلية، مع احترام عمليات الحذف المعلقة حتى لا يعيد الجلب السحابي عنصرًا حذفه المستخدم محليًا.

## 8. Anonymous Auth دون تعطيل Offline

`AuthContext` لا يجعل المصادقة شرطًا لعرض التطبيق. إذا كانت هناك Session محفوظة تُستخدم مباشرة. وإذا لم توجد Session وكان الجهاز Online يحاول التطبيق إنشاء جلسة مجهولة بصمت. أما عند Offline أو عند فشل Supabase، فيستمر `user` بقيمة `null` وتبقى القراءة المحلية والمفضلات المحلية عاملة.

عند نجاح إنشاء جلسة، يُستدعى `ensureUserRecord()` لتحديث صف المستخدم ووقت نشاطه، ثم تبدأ مزامنة المفضلات. لا توجد شاشة Login تقليدية ولا خطوة مطلوبة من المستخدم.

## 9. سياسات RLS

تم تفعيل RLS على جداول المحتوى، وإضافة سياسة قراءة للمستخدمين المجهولين والمسجلين. كما أن `users` و`favorites` يملكان سياسات ملكية تعتمد على `auth.uid()`؛ فلا يستطيع المستخدم قراءة أو تعديل سجل مستخدم آخر عبر المفتاح العام.

المطلوب الحفاظ على هذه القواعد عند أي تغيير لاحق:

| العملية | القاعدة |
|---|---|
| قراءة المحتوى | مسموحة للـ`anon` و`authenticated` عبر سياسة قراءة عامة للمحتوى |
| قراءة `users` | الصف الذي يساوي `id = auth.uid()` فقط |
| كتابة `users` | الصف الذي يساوي `id = auth.uid()` فقط |
| قراءة `favorites` | الصفوف التي تساوي `user_id = auth.uid()` فقط |
| إدخال أو تعديل `favorites` | `user_id` يجب أن يساوي `auth.uid()` |
| حذف `favorites` | لا يتم إلا للمالك عبر `auth.uid()` |

## 10. التشغيل والاختبارات

المتطلبات هي Node.js حديث وnpm. شغّل الأوامر التالية:

```bash
npm install
npm run dev
npm run lint
npm run build
```

نتيجة التحقق الحالية:

| الاختبار | النتيجة | الملاحظات |
|---|---|---|
| فتح التطبيق Online | PASS | ظهرت Home دون انتظار Supabase |
| عرض JSON محلي في Home | PASS | ظهر محتوى «زيارة يوم الاحد» من المسار المحلي/الاحتياطي |
| فتح Prayers Offline | PASS | ظهرت التعقيبات المحلية |
| إضافة مفضلة | PASS | ظهرت فورًا وتغير زر القارئ إلى إزالة المفضلة |
| بقاء المفضلة بعد Reload | PASS | ظهرت في صفحة Favorites بعد التنقل وإعادة التحميل |
| حذف مفضلة | PASS | اختفت فورًا وبقيت محذوفة بعد Reload |
| تشغيل نسخة الإنتاج Offline | PASS | بعد تثبيت Service Worker، أُوقف الخادم وفتح التطبيق من Cache |
| التنقل الداخلي Offline | PASS | فُتحت شاشة Prayers أثناء توقف الخادم |
| قراءة جداول Supabase بالمفتاح العام | PASS | REST أعاد HTTP 200 وبيانات من جداول المحتوى |
| جلب Library عند فتحها | PASS | ظهرت الأدعية والزيارات والمناجاة وملفات المكتبة من Supabase |
| فتح نص سحابي في ReaderView | PASS | فُتح «دعاء يوم السبت» بنجاح |
| تكرار المفضلة | PASS بالكود | dedupe محلي + قيد فريد مركب + upsert سحابي |
| حذف Offline ثم مزامنة الحذف | PASS بالكود، غير منفذ end-to-end | يحتاج اختبارًا بحساب مصادق وقطع الشبكة أثناء طلب DELETE |
| انقطاع الاتصال أثناء المزامنة | PASS بالكود، غير منفذ end-to-end | الاستثناء يبقي العملية في Queue، ويجب تأكيده في بيئة متصفح فعلية |
| `npm run lint` | PASS | انتهى `tsc --noEmit` دون أخطاء |
| `npm run build` | PASS | تم إنشاء `dist` وService Worker بنجاح |

يظهر تحذير Vite بأن حزمة JavaScript أكبر من 500 kB بعد التصغير. هذا تحذير أداء وليس فشل بناء، ولم أضف تقسيمًا للكود في هذه المرحلة حتى لا تتغير المعمارية قبل استقرار طبقة البيانات.

## 11. الملفات التي عُدّلت أو أُضيفت

| الملف | التغيير |
|---|---|
| `.env.example` | حُصر في متغيرات Supabase العامة المطلوبة |
| `vite.config.ts` | أضيف نطاق المضيف المؤقت للاختبار المحلي عبر proxy |
| `src/services/supabaseClient.js` | إزالة القيم الوهمية ودعم الوضع المحلي عند غياب البيئة |
| `src/repositories/contentRepository.js` | إضافة طبقة Repository لجلب محتوى اليوم والمكتبة والمفضلات السحابية |
| `src/contexts/AppContext.jsx` | بدء التشغيل من JSON ثم مزامنة محتوى اليوم في الخلفية |
| `src/contexts/AuthContext.jsx` | جلسة مجهولة غير حاجبة، وربطها بالمزامنة عند توفرها |
| `src/services/offlineDB.js` | إضافة favorites store وطابور `upsert/delete` وإعادة المحاولة |
| `src/components/ReaderView.jsx` | ربط زر المفضلة بالحفظ والحذف المحليين والطابور |
| `src/pages/Favorites.jsx` | قراءة محلية فورية، دمج Remote، وحذف Local-first |
| `src/pages/Library.jsx` | تحميل مكتبة Supabase عند فتح الشاشة مع JSON كاحتياط |
| `src/components/PDFViewer.jsx` | عرض رابط PDF فقط عند وجود `pdf_url` صالح، دون استخدام معرف ملف قديم |
| `README.md` | توثيق التطبيق والبنية والمخططات ومسارات التزامن والاختبارات |

## 12. المشاكل المتبقية بوضوح

البيانات المحلية الحالية في `weekly.json` تحتوي PDF items بلا `pdf_url`، كما أن صفوف PDF في Supabase التي فُحصت تحتوي `pdf_url = null`. لذلك يعرض التطبيق هذه العناصر ويخبر المستخدم بأن رابط القراءة غير متاح، لكنه لا يحاول تحويل `file_id` القديم إلى رابط. لإتاحة الملفات، يجب رفعها إلى Supabase Storage أو مصدر ملفات موثوق ثم تعبئة `pdf_url`، وهي مهمة بيانات مستقلة وليست جزءًا من طبقة Offline الحالية.

توجد حقول قديمة مرتبطة بتاريخ البوت في قاعدة البيانات، مثل `users.telegram_user_id` و`file_id` وحقول الإرسال `sent` و`sent_at`. لم تُحذف لأن حذف الأعمدة قد يغيّر المخطط أو يسبب فقدًا لبيانات موجودة، ولأن التطبيق لا يعتمد عليها. يمكن تنظيفها في Migration منفصلة بعد تصدير نسخة احتياطية ومراجعة كل المستهلكين.

اختبار المزامنة أثناء قطع الاتصال في منتصف طلب Supabase موثق ومحمى بالكود، لكنه لم يُنفذ كاختبار end-to-end متحكم فيه داخل المتصفح. قبل النشر النهائي، ينبغي إجراء هذا الاختبار في بيئة staging بحساب مجهول، مع التحقق من بقاء `pendingFavoriteOperations` ثم تفريغه بعد عودة الاتصال.

## 13. حدود المرحلة

لم تُضف هذه المرحلة Login تقليديًا، أو إشعارات، أو ميزات اجتماعية، أو Gamification، أو AI، أو Dashboard. كما لم تُحذف ملفات JSON أو تُعاد كتابة المعمارية من الصفر. الأولوية بقيت: **Correctness → Offline reliability → Data integrity → Performance → Code cleanliness**.
