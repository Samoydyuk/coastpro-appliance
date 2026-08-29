import type { marketing as source } from '../en/marketing';

/**
 * The marketing screens, in Ukrainian.
 *
 * Typed against the English file, so a key added there and forgotten here is a
 * compile error rather than an English word on a Ukrainian screen.
 */
export const marketing: Record<keyof typeof source, string> = {
  'marketing.version.one': '{n} версія',
  'marketing.version.few': '{n} версії',
  'marketing.version.many': '{n} версій',
  'marketing.version.other': '{n} версії',

  // Назви каналів. Самі слаги — ключі для звʼязків у базі й ніколи не
  // перекладаються; тут лише те, що бачить людина. Більшість — назви
  // сервісів, які однакові обома мовами.
  'marketing.channel.google_ads': 'Google Ads',
  'marketing.channel.google_lsa': 'Local Services Ads',
  'marketing.channel.google_organic': 'Google, органіка',
  'marketing.channel.meta_ads': 'Meta Ads',
  'marketing.channel.meta_organic': 'Facebook / Instagram',
  'marketing.channel.bing_ads': 'Microsoft Ads',
  'marketing.channel.bing_organic': 'Bing, органіка',
  'marketing.channel.tiktok_ads': 'TikTok Ads',
  'marketing.channel.yelp_ads': 'Yelp Ads',
  'marketing.channel.yelp': 'Yelp',
  'marketing.channel.nextdoor': 'Nextdoor',
  'marketing.channel.email': 'Email',
  'marketing.channel.sms': 'SMS',
  'marketing.channel.referral': 'Переходи з інших сайтів',
  'marketing.channel.organic_other': 'Інша органіка',
  'marketing.channel.paid_other': 'Інша реклама',
  'marketing.channel.direct': 'Прямі заходи',
  'marketing.channel.internal': 'Внутрішні',
  'marketing.channel.unknown': 'Невідомо',

  // Колонки, спільні для цих екранів
  'marketing.col.channel': 'Канал',
  'marketing.col.visits': 'Візитів',
  'marketing.col.leads': 'Звернень',
  'marketing.col.calls': 'Дзвінків',
  'marketing.col.convRate': 'Конверсія',
  'marketing.col.booked': 'Заявок',
  'marketing.col.won': 'Виграно',
  'marketing.col.closeRate': 'Частка виграних',
  'marketing.col.spend': 'Витрати',
  'marketing.col.costPerRequest': 'Ціна звернення',
  'marketing.col.costPerJob': 'Ціна роботи',
  'marketing.col.costPerLead': 'Ціна звернення',
  'marketing.col.costPerClick': 'Ціна кліку',
  'marketing.col.invoiced': 'Виставлено',
  'marketing.col.marked': 'За платформою',
  'marketing.col.roas': 'ROAS',
  'marketing.col.revenue': 'Виручка',
  'marketing.col.day': 'День',
  'marketing.col.campaign': 'Кампанія',
  'marketing.col.cost': 'Вартість',
  'marketing.col.clicks': 'Кліків',
  'marketing.col.impressions': 'Показів',
  'marketing.col.source': 'Джерело',
  'marketing.col.query': 'Запит',
  'marketing.col.page': 'Сторінка',
  'marketing.col.shown': 'Показів',
  'marketing.col.clickRate': 'Клікабельність',
  'marketing.col.position': 'Позиція',
  'marketing.col.change': 'Зміна',
  'marketing.col.measure': 'Показник',
  'marketing.col.thisPeriod': 'За період',
  'marketing.col.started': 'Початок',
  'marketing.col.rows': 'Рядків',
  'marketing.col.outcome': 'Результат',
  'marketing.col.finished': 'Завершено',
  'marketing.col.fault': 'Несправність',
  'marketing.col.codes': 'Коди',
  'marketing.col.photos': 'Фото',

  // Спільні слова
  'marketing.any': 'Усі',
  'marketing.action.apply': 'Застосувати',
  'marketing.action.clear': 'Скинути',
  'marketing.action.save': 'Зберегти',
  'marketing.action.close': 'Закрити',
  'marketing.msg.saved': 'Збережено.',
  'marketing.msg.couldNotSave': 'Не вдалося зберегти.',
  'marketing.msg.noServer': 'Немає звʼязку із сервером.',

  // «3 дн тому» — словами, бо relativeTime не знає про мову. Скорочено: ці
  // рядки стоять у підзаголовку.
  'marketing.ago.s': '{n} с тому',
  'marketing.ago.m': '{n} хв тому',
  'marketing.ago.h': '{n} год тому',
  'marketing.ago.d': '{n} дн тому',

  // Канали
  'marketing.channels.title': 'Канали',
  'marketing.channels.creditThe': 'Зараховувати',
  'marketing.channels.lastClick': 'Останній клік',
  'marketing.channels.firstClick': 'Перший клік',
  'marketing.channels.attributionHint':
    'За останнім кліком роботу отримує той канал, який був у ділі, коли людина написала чи ' +
    'подзвонила. За першим — той, що привів її вперше, часто на кілька тижнів раніше: ' +
    'зазвичай це реклама, навіть якщо заходом, після якого людина звернулася, був пошук назви ' +
    'компанії в Google. Перемикання між цими двома поглядами — найшвидший спосіб побачити, які ' +
    'канали недооцінює звітність самих рекламних платформ.',
  'marketing.channels.spend': 'Витрати',
  'marketing.channels.spendSub': 'Куди пішли гроші',
  'marketing.channels.noSpendBefore': 'За цей період витрат не записано.',
  'marketing.channels.noSpendLink': 'Додайте їх',
  'marketing.channels.noSpendAfter': ', і зʼявиться ціна звернення та ROAS.',
  'marketing.channels.revenue': 'Виручка',
  'marketing.channels.revenueSub': 'Виставлено в JobPocket за роботами, що почалися зі звернення',
  'marketing.channels.noWon': 'Виграних робіт із сумою поки немає.',
  'marketing.channels.every': 'Усі канали',
  'marketing.channels.everySub': 'Трафік, звернення, витрати й що з цього вийшло',
  'marketing.channels.nothing': 'За цей період нічого не записано.',
  'marketing.channels.inside': 'Усередині каналів',
  'marketing.channels.insideSub': 'Ті самі цифри, на рівень глибше',
  'marketing.channels.group.campaign': 'Кампанія',
  'marketing.channels.group.content': 'Оголошення / креатив',
  'marketing.channels.group.term': 'Ключове слово',
  'marketing.channels.untagged': 'На цьому рівні поки нічого не розмічено.',
  'marketing.channels.taggingHintBefore':
    'Рядки з ключовими словами й креативами зʼявляються лише для трафіку, який прийшов із ' +
    'мітками. Автопозначення Google Ads передає ідентифікатор кліку, але не ключове слово, ' +
    'тож додайте ',
  'marketing.channels.taggingHintAfter':
    ' до шаблону відстеження, якщо хочете бачити цей рівень.',

  // Витрати на рекламу
  'marketing.spend.title': 'Витрати на рекламу',
  'marketing.spend.spent': 'Витрачено',
  'marketing.spend.costPerRequest': 'Ціна звернення',
  'marketing.spend.costPerRequestHint': '{n} звернень і дзвінків',
  'marketing.spend.costPerJob': 'Ціна роботи',
  'marketing.spend.costPerJobHint': 'виграно: {n}',
  'marketing.spend.return': 'Віддача',
  'marketing.spend.returnHint': 'виставлено {amount}',
  'marketing.spend.add': 'Додати витрати',
  'marketing.spend.addSub': 'Один рядок на день і кампанію — повторне збереження перезапише його',
  'marketing.spend.addHint':
    'Беріть цифри просто зі звітів самої платформи. Рядки по кампаніях вносити не обовʼязково, ' +
    'але саме вони дають ціну звернення в розрізі кампаній; залиште поле кампанії порожнім, щоб ' +
    'записати денний підсумок цілого каналу.',
  'marketing.spend.vsRevenue': 'Витрати проти виручки',
  'marketing.spend.daily': 'По днях',
  'marketing.spend.seriesSpend': 'Витрати',
  'marketing.spend.seriesRevenue': 'Виручка з виграних робіт',
  'marketing.spend.chartHint':
    'Виручка стоїть на тому дні, коли прийшло звернення, а не коли оплатили інвойс, — тому ' +
    'свіжий день може виглядати порожнім просто тому, що ті роботи ще не зроблено.',
  'marketing.spend.recorded': 'Записані витрати',
  'marketing.spend.nothing': 'За цей період нічого не записано.',
  'marketing.spend.source.manual': 'Вручну',
  'marketing.spend.campaignOptional': 'Кампанія (необовʼязково)',
  'marketing.spend.campaignPlaceholder': 'Порожньо — весь канал',

  // Пошук
  'marketing.search.title': 'Пошук',
  'marketing.search.dataThrough': ' · у Google є дані по {day}',
  'marketing.search.held': 'без змін',
  'marketing.search.up': 'вгору на {n}',
  'marketing.search.down': 'вниз на {n}',
  'marketing.search.new': 'нове',
  'marketing.search.nothingYet': 'За цей період поки нічого не записано.',
  'marketing.search.laggedAll':
    'Google віддає пошукові дані із запізненням на два-три дні, а цей період майже цілком у ' +
    'цьому проміжку — нулі внизу є затримкою, а не обвалом трафіку. Візьміть ширший період, щоб ' +
    'побачити щось змістовне.',
  'marketing.search.laggedEdge':
    'Останні два-три дні цього періоду ще наповнюються. Google уточнює їх, поки зводить ' +
    'підсумки, тож правий край графіка за кілька днів підніметься.',
  'marketing.search.notConnectedBefore':
    'Search Console не підключено, тож за цими цифрами поки що нічого немає. Підключіть його на сторінці ',
  'marketing.search.notConnectedLink': 'Довідники',
  'marketing.search.notConnectedAfter': '.',
  'marketing.search.timesShown': 'Показів',
  'marketing.search.timesShownHint': 'скільки разів сайт зʼявився у видачі',
  'marketing.search.clicksFrom': 'Кліків із пошуку',
  'marketing.search.clicksHint': 'люди, які обрали нас',
  'marketing.search.avgPosition': 'Середня позиція',
  'marketing.search.avgPositionHint': 'зважено за тим, як часто показувався кожен запит',
  'marketing.search.clickRateHint': '{queries} показано, але жодного кліку',
  'marketing.search.shownAndClicked': 'Покази й кліки',
  'marketing.search.shownAndClickedSub': 'День за днем, просто з Google',
  'marketing.search.noDays': 'Жодного дня ще не завантажено.',
  'marketing.search.restatesHint':
    'Google уточнює останні кілька днів, поки зводить їх остаточно, тож правий край цього ' +
    'графіка рухається ще близько трьох діб після появи.',
  'marketing.search.nearly': 'Найближче до першої сторінки',
  'marketing.search.nearlySub': 'Реальні обсяги, позиції з 4 до 25 — де невеликий поштовх окупається',
  'marketing.search.nearlyHint':
    'Ці запити вже ранжуються, просто недостатньо високо, щоб їх обирали. Майже всі кліки ' +
    'дістаються першій сторінці, тож запит на 12-й позиції з кількома сотнями показів вартий ' +
    'значно більшої уваги, ніж нова сторінка під запит, за яким сайт не зʼявлявся жодного разу.',
  'marketing.search.every': 'Усі запити',
  'marketing.search.everySub': 'Що люди набирали, спершу найчастіші',
  'marketing.search.everyHint':
    'Google приховує запити, якими користується надто мало людей, щоб ті лишалися анонімними, — ' +
    'тому ці рядки рідко сходяться з підсумками вгорі. Різниця є реальним трафіком, а не збоєм.',
  'marketing.search.pages': 'Сторінки, які отримують покази',
  'marketing.search.pagesSub': 'Які адреси пошук справді показує',
  'marketing.search.pagesHint':
    'Сторінка, яку опубліковано, але тут її немає, — це сторінка, яку Google не вважає вартою ' +
    'показу взагалі. Це інша біда, ніж та, що часто показується й рідко отримує клік.',
  'marketing.search.fetch': 'Забрати з Google',
  'marketing.search.fetching': 'Забираю…',
  'marketing.search.refreshFailed': 'Оновити не вдалося.',
  'marketing.search.nothingToFetch': 'Забирати нічого.',
  'marketing.search.rowsWritten': 'записано {rows}',
  'marketing.search.heldThrough': 'Дані є по {day}; оновлюються щоночі.',
  'marketing.search.nothingImported': 'Поки нічого не завантажено.',

  // Довідники
  'marketing.presence.title': 'Довідники',
  'marketing.presence.source.gbp_api': 'отримано з Google',
  'marketing.presence.source.meta_api': 'отримано з Meta',
  'marketing.presence.source.manual_entry': 'внесено вручну',
  'marketing.presence.connections': 'Підключені акаунти',
  'marketing.presence.connectionsSub':
    'Підключити акаунт — це один клік; зареєструвати сам застосунок у Google і Meta треба один ' +
    'раз, у їхніх консолях для розробників',
  'marketing.presence.googleSetup':
    'Спершу задайте GBP_CLIENT_ID і GBP_CLIENT_SECRET — саме вони реєструють застосунок.',
  'marketing.presence.searchConsoleSetup':
    'Використовує ті самі GBP_CLIENT_ID і GBP_CLIENT_SECRET, і потребує ввімкненого Search ' +
    'Console API у тому ж проєкті Google Cloud.',
  'marketing.presence.metaSetup':
    'Спершу задайте META_APP_ID і META_APP_SECRET — саме вони реєструють застосунок.',
  'marketing.presence.serviceAccount':
    '{email} — додайте цю адресу в Search Console: Налаштування → Користувачі й дозволи',
  'marketing.presence.connectedFallback': 'Підключено',
  'marketing.presence.noneYet':
    'Жоден довідник ще нічого не показав. Google, Instagram і Facebook заповнюються самі, щойно ' +
    'їхні акаунти підключено вище; Yelp і Apple вносяться руками.',
  'marketing.presence.nothingFetched': 'Ще нічого не отримано',
  'marketing.presence.nothingEntered': 'Ще нічого не внесено',
  'marketing.presence.through': ' · по {day}',
  'marketing.presence.staleAuto':
    'Нових рядків немає вже {days} — імпортер міг зупинитися або втратити доступ.',
  'marketing.presence.staleManual':
    'Востаннє вносили {days} тому. Ці цифри старші за вибраний період.',
  'marketing.presence.emptyRange':
    'За цей період нічого немає. Заповниться, щойно в імпортера будуть доступи.',
  'marketing.presence.runs': 'Запуски імпортера',
  'marketing.presence.runsSub':
    'Імпортер, який тихо зупинився, виглядає точно так само, як тихий місяць',
  'marketing.presence.noRuns': 'Імпортер ще жодного разу не запускався.',
  'marketing.presence.ok': 'ок',
  'marketing.presence.running': 'триває',
  'marketing.presence.footHint':
    'Нічого звідси не додається до звернень чи дзвінків. Дотик до кнопки «Подзвонити» в Google і ' +
    'телефон, який справді задзвонив, — це дві різні події, і той самий клієнт часто спричиняє обидві.',
  'marketing.presence.notConnected': 'Не підключено',
  'marketing.presence.key': 'Ключ',
  'marketing.presence.reconnect': 'Перепідключити',
  'marketing.presence.connect': 'Підключити',
  'marketing.presence.disconnect': 'Відключити',
  'marketing.presence.disconnectConfirm':
    'Відключити {label}? Імпортер зупиниться, доки його не підключать знову.',
  'marketing.presence.refreshFetched': 'Оновити отримане',
  'marketing.presence.working': 'Працюю…',
  'marketing.presence.enterByHand': 'Внести вручну',
  'marketing.presence.listing': 'Довідник',
  'marketing.presence.savedDay': 'Збережено: {channel} за {day}.',
  'marketing.presence.blankZero':
    'Порожнє поле рахується як нуль. Надісланий ще раз той самий день замінює попередній.',
  'marketing.presence.saveDay': 'Зберегти день',
  'marketing.presence.saving': 'Зберігаю…',
  'marketing.presence.refreshFailed': 'Оновити не вдалося.',
  'marketing.presence.nothingToFetch': 'Забирати нічого.',

  // Каталог довідників лежить поруч з імпортерами, у lib/presence/store.ts,
  // тож його підписи відповідаються тут — по каналу й показнику.
  'marketing.presence.measure.google_business.impressions': 'Перегляди',
  'marketing.presence.hint.google_business.impressions': 'Пошук і Карти, компʼютер і телефон',
  'marketing.presence.measure.google_business.calls': 'Дзвінки',
  'marketing.presence.measure.google_business.directions': 'Маршрути',
  'marketing.presence.measure.google_business.clicks': 'Переходи на сайт',
  'marketing.presence.measure.google_business.bookings': 'Заявки',
  'marketing.presence.measure.google_business.conversations': 'Повідомлення',
  'marketing.presence.measure.apple_maps.impressions': 'Перегляди',
  'marketing.presence.measure.apple_maps.calls': 'Дотики до дзвінка',
  'marketing.presence.measure.apple_maps.directions': 'Маршрути',
  'marketing.presence.measure.apple_maps.clicks': 'Дотики до сайту',
  'marketing.presence.measure.yelp_profile.impressions': 'Перегляди сторінки',
  'marketing.presence.measure.yelp_profile.leads': 'Звернення',
  'marketing.presence.measure.yelp_profile.calls': 'Дзвінки',
  'marketing.presence.measure.yelp_profile.clicks': 'Переходи на сайт',
  'marketing.presence.measure.yelp_profile.reviews': 'Відгуки',
  'marketing.presence.hint.yelp_profile.reviews': 'Усього в профілі, а не нових',
  'marketing.presence.measure.instagram.impressions': 'Покази',
  'marketing.presence.measure.instagram.reach': 'Охоплення',
  'marketing.presence.hint.instagram.reach': 'Люди, а не перегляди',
  'marketing.presence.measure.instagram.profileViews': 'Перегляди профілю',
  'marketing.presence.measure.instagram.clicks': 'Дотики до сайту',
  'marketing.presence.measure.instagram.followers': 'Підписники',
  'marketing.presence.hint.instagram.followers': 'Усього на той день, а не нових',
  'marketing.presence.measure.facebook.impressions': 'Покази',
  'marketing.presence.measure.facebook.reach': 'Охоплення',
  'marketing.presence.measure.facebook.profileViews': 'Перегляди сторінки',
  'marketing.presence.measure.facebook.clicks': 'Переходи на сайт',
  'marketing.presence.measure.facebook.followers': 'Підписники',
  'marketing.presence.reason.apple_maps':
    'API Apple розрахований на мережі та агрегаторів; одна картка звітує лише у власній панелі.',
  'marketing.presence.reason.yelp_profile':
    'Fusion API віддає публічні дані про бізнес, а не аналітику власника. Ці цифри живуть лише в Yelp for Business.',

  // Маркетинг: список відкритих робіт
  'marketing.jobs.title': 'Маркетинг',
  'marketing.jobs.none': 'Відкритих робіт поки немає',
  'marketing.jobs.releasedCount': '{jobs} відкрито для контенту',
  'marketing.jobs.houseVoice': 'Голос компанії',
  'marketing.jobs.emptyState':
    'Тут поки порожньо. Завершена робота зʼявляється, коли її відкрито для сайту — перемикач ' +
    'унизу картки завершення роботи в застосунку, а фото мають власний перемикач у списку ' +
    'знімків. Обидва вимкнені за замовчуванням, тому ця сторінка починається порожньою, а не повною.',
  'marketing.jobs.search': 'Пошук',
  'marketing.jobs.searchPlaceholder': 'Несправність, ремонт, модель',
  'marketing.jobs.appliance': 'Прилад',
  'marketing.jobs.brand': 'Бренд',
  'marketing.jobs.town': 'Місто',
  'marketing.jobs.errorCode': 'Код помилки',
  'marketing.jobs.content': 'Контент',
  'marketing.jobs.status.none': 'Нічого не написано',
  'marketing.jobs.status.draft': 'Чернетка',
  'marketing.jobs.status.generated': 'Згенеровано',
  'marketing.jobs.status.edited': 'Відредаговано',
  'marketing.jobs.status.published': 'Опубліковано',
  'marketing.jobs.status.skipped': 'Пропущено',
  'marketing.jobs.noMatch': 'За цим фільтром відкритих робіт немає.',
  'marketing.jobs.newer': '← Новіші',
  'marketing.jobs.older': 'Старіші →',
  'marketing.jobs.listHint':
    'Цей список — копія того, що JobPocket готовий оприлюднити, і більшим він бути не може: ' +
    'жодного імені клієнта, телефону, пошти чи адреси сюди не передається, і таких колонок тут ' +
    'просто немає. З місця — тільки місто, не докладніше.',
  'marketing.jobs.refresh': 'Оновити з JobPocket',
  'marketing.jobs.reading': 'Читаю…',
  'marketing.jobs.readFailed': 'Не вдалося прочитати з JobPocket.',
  'marketing.jobs.refreshResult': '{jobs}, {photos}',
  'marketing.jobs.lastRead': 'Востаннє читали {when}',

  // Маркетинг: одна робота
  'marketing.job.back': '← Маркетинг',
  'marketing.job.repairFallback': 'Ремонт',
  'marketing.job.model': 'Модель {model}',
  'marketing.job.unreleased':
    'Цю роботу прибрано зі списку для сайту в застосунку. Вона лишається тут, бо з неї вже щось ' +
    'написано, — але нового писати не варто, а те, що вже опубліковано, краще зняти.',
  'marketing.job.similarLead': 'Про {jobs} уже щось написано:',
  'marketing.job.similarTail':
    '. Варто глянути, перш ніж писати ще одну: дві сторінки про ту саму несправність змагаються ' +
    'між собою за той самий пошуковий запит. Це не привід не писати — друга може вийти кращою.',
  'marketing.job.live': ' (опубліковано)',
  'marketing.job.theRepair': 'Ремонт',
  'marketing.job.whatWasWrong': 'Що було не так',
  'marketing.job.whatWasDone': 'Що зробили',
  'marketing.job.techNote': 'Нотатка техніка для сайту',
  'marketing.job.nothingWritten':
    'На цій роботі нічого не написано. Статтю все одно можна зібрати з приладу, бренду й ' +
    'запчастин — але вона вийде худою.',
  'marketing.job.redacted':
    'Вилучено ще до того, як це залишило JobPocket: {fields}. Вище — те, що лишилося: телефон ' +
    'чи імʼя, набране техніком, до цього сервера не дійшло, а підписи стоять тут, щоб це було ' +
    'видно, а не малося на увазі.',
  'marketing.job.parts': 'Замінені запчастини',
  'marketing.job.noParts': 'Жодної запчастини з номером не записано.',
  'marketing.job.content': 'Контент',
  'marketing.job.contentSub': 'Написано з полів вище й більше ні з чого. Кожен матеріал — чернетка.',
  'marketing.job.photos': 'Фото',
  'marketing.job.photosSub': '{photos} відкрито · торкніться, щоб вибрати',
  'marketing.job.noPhotos':
    'Для цієї роботи фото не відкрито. У знімка власний перемикач у застосунку — вимкнений, доки ' +
    'його не ввімкнуть, бо жоден фільтр полів не побачить на картинці номер будинку чи обличчя.',
  'marketing.job.photosHint':
    'Віддається через цю консоль, а не зі сховища, тож місце, яке камера записала у файл, ' +
    'знімається дорогою, а ключ до браузера не потрапляє.',

  // Голос компанії й матеріали, до яких він застосовується
  'marketing.voice.title': 'Голос компанії',
  'marketing.voice.subtitle':
    'Діє на всі канали. Зміни впливають на наступну чернетку, а не на вже написані.',
  'marketing.voice.whatGets': 'Що саме пишеться',
  'marketing.voice.hint':
    'Кожна чернетка будується з плану, зібраного з тих полів, які в роботі справді є. Ремонт без ' +
    'записаної діагностики не отримає розділу «що ми знайшли», вигаданого з нічого, — він ' +
    'отримає план, у якому такого розділу просто немає.',
  'marketing.piece.article': 'Стаття',
  'marketing.piece.instagram': 'Instagram',
  'marketing.piece.facebook': 'Facebook',
  'marketing.piece.google_business': 'Google Business',
  'marketing.piece.short': 'Коротка версія',
  'marketing.brief.article':
    'Сторінка на власному сайті майстерні про цей ремонт. Читач прийшов із пошуку по тому ж ' +
    'симптому й хоче знати, чим ця несправність зазвичай виявляється, чи лагодиться вона ' +
    'взагалі й що приблизно буде далі.',
  'marketing.brief.instagram':
    'Підпис до фото цього ремонту. Починається з конкретної поломки, а не з питання чи гачка. ' +
    'Хештеги окремим останнім рядком, не більше шести, і кожен — або прилад, або бренд, або ' +
    'несправність, або місто.',
  'marketing.brief.facebook':
    'Допис на сторінку майстерні. Читається так, ніби власник написав його між викликами: що ' +
    'привезли, чим воно виявилося, що зробили. Без хештегів.',
  'marketing.brief.google_business':
    'Оновлення в профілі Google Business. Місцеве й конкретне: місто й прилад у першому реченні, ' +
    'бо саме заради цього картку й читають.',
  'marketing.brief.short':
    'Два речення, які можна поставити під будь-яким фото: що було не так, що зробили. Без ' +
    'заклику до дії та хештегів.',

  // Множина: в англійській дві форми, в українській — чотири.
  'marketing.plural.piece.one': '{n} матеріал',
  'marketing.plural.piece.few': '{n} матеріали',
  'marketing.plural.piece.many': '{n} матеріалів',
  'marketing.plural.piece.other': '{n} матеріалу',
  'marketing.plural.photo.one': '{n} фото',
  'marketing.plural.photo.few': '{n} фото',
  'marketing.plural.photo.many': '{n} фото',
  'marketing.plural.photo.other': '{n} фото',
  'marketing.plural.query.one': '{n} запит',
  'marketing.plural.query.few': '{n} запити',
  'marketing.plural.query.many': '{n} запитів',
  'marketing.plural.query.other': '{n} запиту',
  'marketing.plural.row.one': '{n} рядок',
  'marketing.plural.row.few': '{n} рядки',
  'marketing.plural.row.many': '{n} рядків',
  'marketing.plural.row.other': '{n} рядка',
  'marketing.plural.finishedJob.one': '{n} завершена робота',
  'marketing.plural.finishedJob.few': '{n} завершені роботи',
  'marketing.plural.finishedJob.many': '{n} завершених робіт',
  'marketing.plural.finishedJob.other': '{n} завершеної роботи',
  'marketing.plural.similarJob.one': '{n} схожу роботу',
  'marketing.plural.similarJob.few': '{n} схожі роботи',
  'marketing.plural.similarJob.many': '{n} схожих робіт',
  'marketing.plural.similarJob.other': '{n} схожої роботи',
};
