import type { shared as source } from '../en/shared';

/**
 * The shared screens, in Ukrainian.
 *
 * Typed against the English file, so a key added there and forgotten here is a
 * compile error rather than an English word on a Ukrainian screen.
 *
 * A few values here begin or end with a space. That is deliberate, not a typo:
 * the sentence is broken around a `<code>` or a `<strong>` in the JSX, and
 * where English carries on with a comma Ukrainian carries on with a word, so
 * the space has to live in the string rather than in the markup.
 */
export const shared: Record<keyof typeof source, string> = {
  // ── Підписи статусів ─────────────────────────────────────────────────────
  // Ключі — це самі значення enum, як їх називають база й API. Перекладається
  // тільки підпис, ніколи не значення.
  'shared.status.new': 'Нове',
  'shared.status.contacted': 'Звʼязались',
  'shared.status.booked': 'Записано',
  'shared.status.won': 'Виграно',
  'shared.status.lost': 'Втрачено',
  'shared.status.spam': 'Спам',
  'shared.status.PENDING': 'Очікує',
  'shared.status.ACCEPTED': 'Прийнято',
  'shared.status.DECLINED': 'Відхилено',
  'shared.status.CANCELLED': 'Скасовано',
  'shared.status.SCHEDULED': 'Заплановано',
  'shared.status.IN_PROGRESS': 'В роботі',
  'shared.status.PAUSED': 'Призупинено',
  'shared.status.COMPLETED': 'Завершено',
  'shared.status.INVOICED': 'Виставлено',
  'shared.status.PAID': 'Оплачено',
  'shared.status.DRAFT': 'Чернетка',
  'shared.status.SENT': 'Надіслано',
  'shared.status.APPROVED': 'Погоджено',

  'shared.pay.PAID': 'Оплачено',
  'shared.pay.UNPAID': 'Не оплачено',
  'shared.pay.PARTIAL': 'Частково',
  'shared.pay.REFUNDED': 'Повернено',
  'shared.pay.WRITTEN_OFF': 'Списано',
  'shared.pay.FREE': 'Безкоштовно',

  // ── Екран, коли база недоступна ──────────────────────────────────────────
  'shared.setup.noDatabase': 'База даних ще не підключена',
  'shared.setup.noTables': 'Таблиці ще не створені',
  'shared.setup.failed': 'Не вдалося завантажити',
  'shared.setup.copy': 'Скопіюйте',
  'shared.setup.addToVercel': 'із сервісу Railway Postgres, додайте його у Vercel як',
  'shared.setup.andRedeploy': ' і передеплойте.',
  'shared.setup.publicOne': 'Потрібна саме публічна адреса. Внутрішня —',
  'shared.setup.internalOnly':
    '— розпізнається лише всередині мережі Railway, а цей сайт працює не там.',
  'shared.setup.emptyRun': 'База доступна, але порожня. Виконайте',
  'shared.setup.once': 'один раз.',

  // ── Екран, коли JobPocket ще не підключено ───────────────────────────────
  'shared.notConnected.title': 'Ще не підключено',
  'shared.notConnected.subtitle': '{what} надходять із JobPocket, а ключа ще немає',
  'shared.notConnected.body':
    'Цей екран порожній, бо йому нема в кого спитати. Він не каже, що роботи немає, — йому просто не дали, куди дивитися.',
  'shared.notConnected.step1': 'У JobPocket:',
  'shared.notConnected.step1menu': 'Налаштування → Інтеграції',
  'shared.notConnected.step1find': ', знайдіть',
  'shared.notConnected.step1toggle': 'Заявки й календар',
  'shared.notConnected.step1end': ' та увімкніть.',
  'shared.notConnected.step2': 'Скопіюйте ключ, який зʼявиться. Його показують',
  'shared.notConnected.step2once': 'лише раз',
  'shared.notConnected.step2end': '— закриєте екран, і доведеться робити новий.',
  'shared.notConnected.step3': 'Вставте його на сторінці',
  'shared.notConnected.step3under': 'у розділі',
  'shared.notConnected.step3keys': 'Ключі JobPocket',
  'shared.notConnected.step3end': ', вибравши тип «Заявки й календар».',
  'shared.notConnected.footnote':
    'Не той ключ, що «Ваш власний сайт», — той уміє лише приймати звернення, і тут його навмисно не приймають. Якщо вставите його помилково, екран так і скаже, а не замовкне.',

  // ── Графіки ──────────────────────────────────────────────────────────────
  'shared.chart.noData': 'Даних поки немає.',
  'shared.chart.overTime': '{series} у часі',
  'shared.chart.ofVisits': '{pct} візитів',
  'shared.chart.carriedOver': '{pct} пройшли далі',
  'shared.chart.heatmapHover': '{day} о {hour}:00 — {requests}',
  'shared.chart.heatmapLegend':
    'Найтемніша клітинка — {requests}. Наведіть на клітинку, щоб побачити точне число.',
  'shared.chart.cellTitle': '{day} {hour}:00 — {total}',

  'shared.day.0': 'Нд',
  'shared.day.1': 'Пн',
  'shared.day.2': 'Вт',
  'shared.day.3': 'Ср',
  'shared.day.4': 'Чт',
  'shared.day.5': 'Пт',
  'shared.day.6': 'Сб',

  // ── Гортання списків ─────────────────────────────────────────────────────
  'shared.pager.range': '{from}–{to}',
  'shared.pager.rangeOfTotal': '{from}–{to} з {total}',

  // ── Телефон на столі ─────────────────────────────────────────────────────
  'shared.call.takeCalls': 'Приймати дзвінки тут',
  'shared.call.goingToPhone': 'Дзвінки йдуть на телефон.',
  'shared.call.connecting': 'Підключаю телефон',
  'shared.call.onDuty': 'На звʼязку — дзвінки лунають тут і на телефоні.',
  'shared.call.stop': 'Зупинити',
  'shared.call.incoming': 'Вхідний дзвінок',
  'shared.call.ringing': 'Дзвонить',
  'shared.call.firstTime': 'Уперше',
  'shared.call.owes': 'Винен {amount}',
  'shared.call.multiple': 'На цьому номері кілька клієнтів',
  'shared.call.booked': 'Записано',
  'shared.call.lastVisit': 'Минулий візит',
  'shared.call.answer': 'Відповісти',
  'shared.call.mute': 'Вимкнути мікрофон',
  'shared.call.unmute': 'Увімкнути мікрофон',
  'shared.call.decline': 'Відхилити',
  'shared.call.hangUp': 'Покласти',

  'shared.call.stage.mic': 'Прошу доступ до мікрофона',
  'shared.call.stage.loading': 'Завантажую телефон',
  'shared.call.stage.connecting': 'Підключаюся',
  'shared.call.stage.signingIn': 'Входжу',
  'shared.call.stage.socketFailed': 'Не вдалося зʼєднатися з телефонною мережею',

  'shared.call.err.request': 'Не пройшло.',
  'shared.call.err.outbound': 'Дзвінок не пройшов.',
  'shared.call.err.noMediaApi':
    'Цей браузер не віддає сторінці мікрофон. Chrome, Edge або Safari через https — віддадуть.',
  'shared.call.err.micBlocked':
    'Мікрофон для цього сайту заблоковано. Натисніть замочок в адресному рядку, дозвольте мікрофон і перезавантажте сторінку.',
  'shared.call.err.micMissing':
    'Мікрофона не знайдено. Підключіть його або виберіть інший у системних налаштуваннях звуку.',
  'shared.call.err.micBusy': 'Мікрофон зайняла інша програма. Закрийте її і спробуйте ще раз.',
  'shared.call.err.micOther': 'Не вдалося відкрити мікрофон{detail}.',
  'shared.call.err.notTold': 'Підключено, але сервер про це не дізнався: {message}',
  'shared.call.err.lostServer': 'Звʼязок із сервером втрачено: {message}',
  'shared.call.err.phoneFailed': 'Телефонне зʼєднання обірвалося.',
  'shared.call.err.closed': 'Телефонна мережа розірвала зʼєднання. Спробуйте ще раз.',
  'shared.call.err.noAnswer': 'Телефонна мережа не відповіла{stage}. Спробуйте ще раз.',
  'shared.call.err.stoppedAt': ' — зупинилося на кроці: {stage}',
  'shared.call.err.unreachable': 'Не вдалося достукатися до телефонної мережі.',
  'shared.call.err.startPhone': 'Не вдалося запустити телефон.',
  'shared.call.err.audioBlocked':
    'Браузер заблокував звук дзвінка. Клацніть по сторінці й спробуйте ще раз.',
  'shared.call.err.answer': 'Не вдалося підняти слухавку.',
  'shared.call.notice.micLater': 'Мікрофон запитають уже на першому дзвінку.',

  'shared.callButton.title': 'Подзвонити з робочого номера',
  'shared.callButton.action': '↗ дзвінок',

  // ── Множина: чотири форми, не дві ────────────────────────────────────────
  'shared.request.one': '{n} звернення',
  'shared.request.few': '{n} звернення',
  'shared.request.many': '{n} звернень',
  'shared.request.other': '{n} звернення',
  // `one` is not only 1 — Ukrainian puts 21, 31 and 101 in the same category,
  // so the number has to stay in the string. Dropping it read fine at one job
  // and turned "Остання 21 робота" into "Остання робота" at twenty-one.
  'shared.lastJobs.one': 'Остання {n} робота',
  'shared.lastJobs.few': 'Останні {n} роботи',
  'shared.lastJobs.many': 'Останні {n} робіт',
  'shared.lastJobs.other': 'Останні {n} роботи',
};
