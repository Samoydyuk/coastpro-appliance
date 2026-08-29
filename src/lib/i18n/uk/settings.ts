import type { settings as source } from '../en/settings';

/**
 * The settings screens, in Ukrainian.
 *
 * Typed against the English file, so a key added there and forgotten here is a
 * compile error rather than an English word on a Ukrainian screen.
 *
 * Назви змінних середовища (ADMIN_TOTP_SECRET, RESEND_API_KEY), шляхи
 * (/api/telnyx/webhook) та пункти меню самого JobPocket лишаються так, як їх
 * видно на екрані: їх копіюють і шукають очима, а не читають.
 */
export const settings: Record<keyof typeof source, string> = {
  // Сама сторінка
  'settings.title': 'Налаштування',
  'settings.subtitle': 'Номери, інтеграції та те, чого ще бракує',

  // Що підключено
  'settings.integrations.title': 'Інтеграції',
  'settings.integrations.subtitle': 'Що працює просто зараз',
  'settings.integrations.ready': 'готово',
  'settings.integrations.notReady': 'не налаштовано',

  'settings.integ.database': 'База даних',
  'settings.integ.database.on': 'Підключено. Візити, звернення й дзвінки записуються.',

  'settings.integ.resend': 'Сповіщення про звернення (Resend)',
  'settings.integ.resend.on': 'Надходять на {email}',
  'settings.integ.resend.off':
    'RESEND_API_KEY не задано — заявки з форм зберігаються, але листа про них ніхто не отримує.',

  'settings.integ.jobpocket': 'Заявки в JobPocket',
  'settings.integ.jobpocket.on':
    'Звернення одразу йдуть на телефон як запити на візит, а результат кожної роботи повертається сюди.',
  'settings.integ.jobpocket.paused':
    'Налаштовано, але вимкнено — звернення записуються й чекають у черзі, на виїзд їх ніхто не передає.',
  'settings.integ.jobpocket.off':
    'Ключа плагіна немає. Звернення записуються тут, але нікому про них не повідомляють.',

  'settings.integ.telnyx': 'Відстеження дзвінків (Telnyx)',
  'settings.integ.telnyx.on':
    'Вебхук підписано. Кожен відстежуваний номер має вести на /api/telnyx/webhook.',
  'settings.integ.telnyx.off':
    'Немає ні публічного ключа, ні токена — вебхук дзвінків прийме будь-що. Так можна хіба на час тестів.',

  'settings.integ.googleAds': 'Конверсії Google Ads',
  'settings.integ.googleAds.on': 'Виграні роботи вивантажуються назад до кліка, з якого прийшли.',
  'settings.integ.googleAds.off':
    'Не налаштовано. Google оптимізує рекламу під заповнені форми, а не під оплачені роботи.',

  'settings.integ.meta': 'Конверсії Meta',
  'settings.integ.meta.on': 'Події надсилаються з сервера через Conversions API.',
  'settings.integ.meta.off':
    'Не налаштовано. Meta бачить лише те, що вціліло в браузері, — а це менша частина.',

  // Хто може зайти
  'settings.access.title': 'Хто може зайти',
  'settings.access.subtitle':
    'У цій консолі видно імена й адреси клієнтів і розклад на тиждень',
  'settings.access.on': 'увімк.',
  'settings.access.off': 'вимк.',

  'settings.access.totp': 'Код із застосунку-автентифікатора',
  'settings.access.totp.on': 'Для входу потрібні пароль і шестизначний код.',
  'settings.access.totp.off':
    'ADMIN_TOTP_SECRET не задано — самого пароля досить, щоб відкрити тут усе.',

  'settings.access.sealed': 'Ключі зашифровані в базі',
  'settings.access.sealed.on': 'Копія бази не видасть ключів JobPocket.',
  'settings.access.sealed.off':
    'SETTINGS_ENCRYPTION_KEY не задано — ключі лежали б у базі відкритим текстом.',

  // Приймання дзвінків за компʼютером
  'settings.desk.title': 'Приймати дзвінки тут',
  'settings.desk.subtitle': 'Відповідати на робочий номер за компʼютером, а не з телефона',
  'settings.desk.seatReady': 'Місце готове — {name}',
  'settings.desk.noSeat': 'Місця диспетчера ще немає',
  'settings.desk.creating': 'Створюємо…',
  'settings.desk.createSeat': 'Створити місце',
  'settings.desk.ringing': 'Дзвінки надходять і сюди, і на телефон',
  'settings.desk.notRinging': 'Місце створено, але дзвінки на нього ще не доходять',
  'settings.desk.saving': 'Зберігаємо…',
  'settings.desk.stopRinging': 'Не дзвонити тут',
  'settings.desk.startRinging': 'Дзвонити і тут',
  'settings.desk.failed': 'Не вдалося виконати.',
  'settings.desk.takeCalls': 'Приймати дзвінки тут',
  'settings.desk.hint':
    'Місце — це адресат для телефонії, не більше: у нього немає ні пошти, ні номера, тож зайти під ним ніхто не може. Той, хто сидить за компʼютером, натискає «{button}» у смузі вгорі; щойно вкладку закрито, наступний дзвінок іде на телефон.',

  // Ключі JobPocket
  'settings.keys.title': 'Ключі JobPocket',
  'settings.keys.subtitle': 'Вставте сюди ключ, коли створюєте новий або міняєте старий',
  'settings.keys.scope': 'Для чого',
  'settings.keys.scope.operations': 'Заявки й календар',
  'settings.keys.scope.website': 'Звернення з сайту',
  'settings.keys.scope.marketing': 'Маркетинг',
  'settings.keys.field': 'Ключ',
  'settings.keys.checking': 'Перевіряємо…',
  'settings.keys.save': 'Зберегти ключ',
  'settings.keys.saved': '{label}: ключ збережено — {masked}',
  'settings.keys.failed': 'Не вдалося зберегти цей ключ.',
  'settings.keys.hint':
    'У JobPocket: Settings → Integrations → потрібна область → увімкніть перемикач і скопіюйте ключ, який показується один-єдиний раз. Тут його перевіряють перед збереженням, тож помилку в ключі ви побачите зараз, а не через тиждень у вигляді порожнього екрана.',

  // Відстежувані номери
  'settings.numbers.title': 'Відстежувані номери',
  'settings.numbers.subtitle':
    'По одному на канал — за тим, який задзвонив, видно, яка реклама оплатила дзвінок',
  'settings.numbers.number': 'Номер',
  'settings.numbers.shownTo': 'Кому показуємо',
  'settings.numbers.label': 'Підпис',
  'settings.numbers.labelPlaceholder': 'Нотатка, якщо потрібна',
  'settings.numbers.status': 'Статус',
  'settings.numbers.add': 'Додати',
  'settings.numbers.retire': 'Вимкнути',
  'settings.numbers.active': 'Активний',
  'settings.numbers.retired': 'Вимкнений',
  'settings.numbers.everyoneElse': 'Усім іншим',
  'settings.numbers.fallback': 'Усім іншим (запасний)',
  'settings.numbers.saveFailed': 'Не вдалося зберегти.',
  'settings.numbers.empty':
    'Номерів ще немає. Поки не додано жодного, кожен відвідувач бачить {phone}, і дзвінок неможливо віднести до каналу.',
  'settings.numbers.hint.1':
    'Купіть номери в Telnyx, переадресуйте кожен на {phone}, а їхній голосовий вебхук спрямуйте на',
  'settings.numbers.hint.2':
    'Далі сайт сам показує кожному відвідувачу номер його каналу; хто прийшов з каналу без номера, бачить основну лінію — тож через відсутній рядок у цій таблиці жоден дзвінок не загубиться.',

  // Як позначати рекламу
  'settings.tag.title': 'Як позначати рекламу',
  'settings.tag.subtitle': 'Що кожна платформа має нести у своїх посиланнях',
  'settings.tag.google': 'Google Ads',
  'settings.tag.google.body':
    'Автопозначення лишіть увімкненим — воно саме передає click id. А щоб бачити звіти за ключовими словами й креативами, вкажіть у налаштуваннях акаунта шаблон відстеження:',
  'settings.tag.lsa': 'Local Services Ads',
  'settings.tag.lsa.1':
    'У LSA немає click id, тож позначте посилання на сайт у профілі так:',
  'settings.tag.lsa.2':
    'Втім, більшість звернень з LSA приходить дзвінком, тож окремий номер для нього важить більше, ніж мітка.',
  'settings.tag.meta': 'Meta',
  'settings.tag.meta.1': 'Додайте',
  'settings.tag.meta.2':
    'у поле URL parameters. Без medium трафік з Meta не відрізнити від звичайної публікації.',
  'settings.tag.other': 'Yelp, Nextdoor, будь-що інше',
  'settings.tag.other.1': 'Підійде будь-яке посилання, аби в ньому були',
  'settings.tag.other.2': 'і',
  'settings.tag.other.3':
    'Трафік без міток теж розкладається по каналах — за реферером, просто менш точно.',

  // Вхід
  'settings.login.console': 'Маркетингова консоль',
  'settings.login.password': 'Пароль',
  'settings.login.code': 'Код автентифікатора',
  'settings.login.codeHint': 'Шість цифр із застосунку-автентифікатора',
  'settings.login.submit': 'Увійти',
  'settings.login.failed': 'Не вдалося увійти.',

  // Спільне для всіх форм на цих екранах
  'settings.unreachable': 'Не вдалося зʼєднатися із сервером.',
};
