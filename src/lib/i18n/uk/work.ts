import type { work as source } from '../en/work';

/**
 * The work screens, in Ukrainian.
 *
 * Typed against the English file, so a key added there and forgotten here is a
 * compile error rather than an English word on a Ukrainian screen.
 */
export const work: Record<keyof typeof source, string> = {
  // ---------------------------------------------------------------------
  // Форми множини — чотири, не дві
  // ---------------------------------------------------------------------
  'work.plural.visit.one': '{n} візит',
  'work.plural.visit.few': '{n} візити',
  'work.plural.visit.many': '{n} візитів',
  'work.plural.visit.other': '{n} візита',
  'work.plural.lead.one': '{n} звернення',
  'work.plural.lead.few': '{n} звернення',
  'work.plural.lead.many': '{n} звернень',
  'work.plural.lead.other': '{n} звернення',
  'work.plural.waiting.one': '{n} заявка чекає на відповідь',
  'work.plural.waiting.few': '{n} заявки чекають на відповідь',
  'work.plural.waiting.many': '{n} заявок чекають на відповідь',
  'work.plural.waiting.other': '{n} заявки чекають на відповідь',
  'work.plural.newCaller.one': '{n} новий номер',
  'work.plural.newCaller.few': '{n} нові номери',
  'work.plural.newCaller.many': '{n} нових номерів',
  'work.plural.newCaller.other': '{n} нового номера',

  // ---------------------------------------------------------------------
  // Спільне для форм
  // ---------------------------------------------------------------------
  'work.form.today': 'Сьогодні',
  'work.form.save': 'Зберегти',
  'work.form.saving': 'Зберігаю…',
  'work.form.saved': 'Збережено.',
  'work.form.noServer': 'Не вдалося звʼязатися із сервером.',
  'work.form.checkingCalendar': 'Дивлюсь у календар…',
  'work.form.ownTime': 'Або свій час',

  // ---------------------------------------------------------------------
  // Календар
  // ---------------------------------------------------------------------
  'work.calendar.title': 'Календар',
  'work.calendar.nothingBooked': 'Нічого не заплановано',
  'work.calendar.view.month': 'Місяць',
  'work.calendar.view.week': 'Тиждень',
  'work.calendar.view.day': 'День',
  'work.calendar.today': 'Сьогодні',
  'work.calendar.stepBack': 'Назад',
  'work.calendar.stepForward': 'Вперед',
  'work.calendar.everyone': 'Усі',
  'work.calendar.notConnectedWhat': 'Роботи та заявки',
  'work.calendar.monthSubtitle': 'Просто з JobPocket — ті самі роботи, що й у застосунку',
  'work.calendar.laneSubtitle': 'Смуга — це людина, а порожній проміжок і є те, що ви шукаєте',
  'work.calendar.emptyHere':
    'Тут нічого не заплановано. Заявки, які чекають на відповідь, — на екрані «Заявки».',
  'work.calendar.bookTitle': 'Записати візит',
  'work.calendar.bookSubtitle': 'Хтось зателефонував — запишіть у графік',
  'work.calendar.noName': 'Без імені',
  'work.calendar.nobodyYet': 'Поки нікого',
  'work.calendar.shared': 'удвох',
  'work.calendar.more': 'ще {n}',
  'work.calendar.hint':
    'Це живий погляд у JobPocket, а не копія: прийміть заявку тут або в застосунку — за мить обидва покажуть ту саму роботу. Час — за годинником майстерні; скасовані роботи не показуються.',
  'work.calendar.hintOwn': ' Візити без бренду — це ваша власна робота.',

  // ---------------------------------------------------------------------
  // Одна робота
  // ---------------------------------------------------------------------
  'work.job.back': '← Календар',
  'work.job.untitled': 'Робота',
  'work.job.notScheduled': 'Не заплановано',
  'work.job.doneUnderBefore': 'Виконано під брендом ',
  'work.job.doneUnderAfter': ' — це робота від диспетчера, а не власна робота CoastPro.',
  'work.job.pricedFrom': 'З чого склалася ціна',
  'work.job.nothingItemised':
    'Позицій ще немає. Ціну складають на місці, тож у роботи, яка ще не відбулася, рядків немає.',
  'work.job.item': 'Позиція',
  'work.job.qty': 'К-сть',
  'work.job.each': 'За одиницю',
  'work.job.lineTotal': 'Сума',
  'work.job.subtotal': 'Проміжний підсумок',
  'work.job.tax': 'Податок ({rate}%)',
  'work.job.total': 'Разом',
  'work.job.photos': 'Фото',
  'work.job.photosSubtitle': '{n} із візиту',
  'work.job.noPhotos': 'На цій роботі фото немає.',
  'work.job.photoAlt': 'Фото з роботи',
  'work.job.photo.BEFORE': 'До',
  'work.job.photo.DURING': 'У процесі',
  'work.job.photo.AFTER': 'Після',
  'work.job.photo.ISSUE': 'Несправність',
  'work.job.photo.GENERAL': 'Інше',
  'work.job.whatHappened': 'Що сталося',
  'work.job.diagnosis': 'Діагноз',
  'work.job.resolution': 'Що зробили',
  'work.job.notes': 'Нотатки',
  'work.job.whoIsGoing': 'Хто їде',
  'work.job.whoIsGoingSubtitle': 'Щойно збережете — їм прийде сповіщення',
  'work.job.moveTitle': 'Перенести візит',
  'work.job.moveHint':
    'Статус, ціни й оплату міняють у застосунку. Завершення роботи закриває техніку облік часу і може запустити повідомлення клієнту, тож цьому місце там, де відбувається сама робота.',
  'work.job.documents': 'Кошториси та інвойси',
  'work.job.nothingBilled': 'За цією роботою ще нічого не виставляли.',
  'work.job.doc.invoice': 'Інвойс',
  'work.job.doc.estimate': 'Кошторис',
  'work.job.doc.voided': ' · анульовано',
  'work.job.doc.paid': ' · сплачено {when}',
  'work.job.doc.signed': ' · підписано {when}',
  'work.job.doc.sent': ' · надіслано {when}',
  'work.job.doc.notSent': ' · не надіслано',
  'work.job.scans': 'Скани',
  'work.job.scansSubtitle': 'Підписані папери з візиту',
  'work.job.scansHint':
    'Для внутрішнього користування. Це паперові документи, відскановані на роботі, а не те, що бачить клієнт.',
  'work.job.customer': 'Клієнт',
  'work.job.name': 'Імʼя',
  'work.job.phone': 'Телефон',
  'work.job.address': 'Адреса',
  'work.job.appliance': 'Техніка',
  'work.job.timeline': 'Хронологія',
  'work.job.created': 'Створено',
  'work.job.scheduled': 'Заплановано',
  'work.job.started': 'Почато',
  'work.job.completed': 'Завершено',
  'work.job.paid': 'Сплачено',
  'work.job.notPaidYet': 'Ще ні',
  'work.job.assignedTo': 'Призначено',
  'work.job.hint':
    'Читається наживо з JobPocket — це та сама робота, що й у застосунку, а не її копія. Скільки запчастина коштувала на закупівлі, сюди свідомо не переносять.',

  // ---------------------------------------------------------------------
  // Хто їде
  // ---------------------------------------------------------------------
  'work.assign.noTeam':
    'Команди ще немає. Додайте когось у застосунку — і він зʼявиться тут окремою смугою в календарі.',
  'work.assign.you': '(ви)',
  'work.assign.failed': 'Не вдалося змінити, хто їде.',
  'work.assign.told': 'Збережено. Їм повідомили.',
  'work.assign.clearedDone': 'Знято з усіх.',
  'work.assign.clear': 'Зняти з усіх',

  // ---------------------------------------------------------------------
  // Перенесення візиту
  // ---------------------------------------------------------------------
  'work.move.locked':
    'Ця робота завершена або скасована. Щоб її перенести, спершу відкрийте її знову в застосунку.',
  'work.move.pickSomething': 'Виберіть вікно або вкажіть час.',
  'work.move.failed': 'Не вдалося перенести цей візит.',
  'work.move.done': 'Перенесено. Техніку повідомили, і застосунок уже це бачить.',
  'work.move.clash': 'Увага: протягом години є ще один візит{what}. Усе одно перенесено.',
  'work.move.noWindows':
    'Того дня на сторінці запису вільних вікон немає. Вкажіть час вручну нижче.',
  'work.move.submit': 'Перенести візит',
  'work.move.submitting': 'Переношу…',

  // ---------------------------------------------------------------------
  // Запис візиту вручну
  // ---------------------------------------------------------------------
  'work.book.name': 'Імʼя',
  'work.book.namePlaceholder': 'Ann Wheeler',
  'work.book.phone': 'Телефон',
  'work.book.address': 'Адреса',
  'work.book.service': 'Послуга',
  'work.book.notSureYet': 'Поки не знаю',
  'work.book.problem': 'Що не так',
  'work.book.problemPlaceholder': 'Не зливає воду, скрегоче, код помилки F22…',
  'work.book.when': 'Коли',
  'work.book.noWindows':
    'Того дня на сторінці запису вільних вікон немає. Ви все одно можете вказати час нижче.',
  'work.book.notLimited':
    'Ваш графік не обмежений тим, що пропонує сторінка запису. Залиште обидва поля порожніми, щоб записати без часу й потім зателефонувати.',
  'work.book.submit': 'Записати візит',
  'work.book.submitting': 'Записую…',
  'work.book.failed': 'Не вдалося створити цю роботу.',
  'work.book.done': 'Записано. Візит уже в календарі та в застосунку.',

  // ---------------------------------------------------------------------
  // Заявки
  // ---------------------------------------------------------------------
  'work.bookings.title': 'Заявки',
  'work.bookings.nothingWaiting': 'Немає нічого, що чекає на відповідь',
  'work.bookings.filter.all': 'Усі',
  'work.bookings.filter.PENDING': 'Чекають',
  'work.bookings.filter.ACCEPTED': 'Прийняті',
  'work.bookings.filter.DECLINED': 'Відхилені',
  'work.bookings.requests': 'Заявки',
  'work.bookings.requestsSubtitle': 'Що надійшло і що це привело',
  'work.bookings.emptyNoKey': 'Показувати нічого, доки не підключено ключ.',
  'work.bookings.emptyFiltered': 'Заявок із таким статусом немає.',
  'work.bookings.empty':
    'Заявок поки немає. Вони зʼявляються тут щойно хтось записується на сайті.',
  'work.bookings.who': 'Хто',
  'work.bookings.what': 'Що',
  'work.bookings.askedFor': 'Просили на',
  'work.bookings.cameFrom': 'Звідки прийшли',
  'work.bookings.received': 'Надійшло',
  'work.bookings.until': 'до {time}',
  'work.bookings.disagreement': 'Розбіжність: {what}',
  'work.bookings.callToArrange': 'Домовитися телефоном',
  'work.bookings.notFromWebsite': 'Не з сайту',
  'work.bookings.older': 'Давніші →',
  'work.bookings.hint':
    'Заявки надходять наживо з JobPocket — на цей сайт нічого не копіюється, тож список не може розійтися із застосунком. «Звідки прийшли» знає лише ця консоль: це зіставлення зі зверненням, яке сайт зафіксував ще до того, як заявку було подано.',

  // ---------------------------------------------------------------------
  // Одна заявка
  // ---------------------------------------------------------------------
  'work.booking.back': '← Усі заявки',
  'work.booking.contact': 'Контакти',
  'work.booking.contactSubtitle': 'Показані тут і більше ніде в цій консолі',
  'work.booking.phone': 'Телефон',
  'work.booking.email': 'Пошта',
  'work.booking.address': 'Адреса',
  'work.booking.appliance': 'Техніка',
  'work.booking.notGiven': 'Не вказано',
  'work.booking.asked': 'Про що просили',
  'work.booking.service': 'Послуга',
  'work.booking.window': 'Вікно приїзду',
  'work.booking.noWindow': 'Не обрали — домовтеся телефоном',
  'work.booking.noDescription': 'Проблему не описали.',
  'work.booking.access': 'Як потрапити',
  'work.booking.origin': 'Звідки прийшли',
  'work.booking.originSubtitle': 'Відомо лише тут, у застосунку цього немає',
  'work.booking.source': 'Джерело',
  'work.booking.campaign': 'Кампанія',
  'work.booking.term': 'Пошуковий запит',
  'work.booking.recordedValue': 'Записана сума',
  'work.booking.fullEnquiry': 'Повне звернення →',
  'work.booking.noOrigin':
    'Відповідного звернення на цьому сайті немає. Ця заявка прийшла інакше — прямо зі сторінки запису або її внесли вручну, — тож реклама за неї не платить.',
  'work.booking.answer': 'Відповідь',
  'work.booking.becameJob': 'Робота, якою це стало',
  'work.booking.number': 'Номер',
  'work.booking.payment': 'Оплата',
  'work.booking.total': 'Разом',
  'work.booking.scheduled': 'Заплановано',
  'work.booking.notScheduled': 'Не заплановано',
  'work.booking.conflictTitle': 'Розбіжність',
  'work.booking.conflictBody':
    'JobPocket і результат, записаний на цьому сайті, не збігаються:',
  'work.booking.conflictHint':
    'Автоматично нічого не змінено. Статус, який поставила людина після розмови з клієнтом, важливіший за будь-який висновок синхронізації, тому розбіжність просто зафіксовано й залишено вам.',

  // Підписи до збережених кодів розбіжності. Сам код — це значення в базі,
  // його ніколи не перекладають; перекладається лише те, що показано.
  'work.conflict.accepted_after_lost': 'прийнято після позначки «втрачено»',
  'work.conflict.accepted_after_spam': 'прийнято після позначки «спам»',
  'work.conflict.working_after_lost': 'роботу почато після позначки «втрачено»',
  'work.conflict.working_after_spam': 'роботу почато після позначки «спам»',
  'work.conflict.invoiced_after_lost': 'виставлено інвойс після позначки «втрачено»',
  'work.conflict.invoiced_after_spam': 'виставлено інвойс після позначки «спам»',
  'work.conflict.paid_after_lost': 'сплачено після позначки «втрачено»',
  'work.conflict.paid_after_spam': 'сплачено після позначки «спам»',
  'work.conflict.declined_after_booked': 'відхилено вже після того, як записали',
  'work.conflict.cancelled_after_booked': 'скасовано вже після того, як записали',
  'work.conflict.refund_after_won': 'гроші повернули вже після зарахування як «виграно»',

  // ---------------------------------------------------------------------
  // Відповідь на заявку
  // ---------------------------------------------------------------------
  'work.answer.failed': 'Не пройшло.',
  'work.answer.declined': 'Відхилено.',
  'work.answer.already': 'Це вже робота — нічого нового не створено.',
  'work.answer.accepted': 'Прийнято. Уже в календарі.',
  'work.answer.wasAccepted': 'Прийнято — тепер це робота.',
  'work.answer.wasDeclined': 'Відхилено.',
  'work.answer.wasCancelled': 'Скасовано клієнтом.',
  'work.answer.whenToTurnUp': 'Коли приїхати',
  'work.answer.theirTime': 'Це те, що обрали вони. Змініть — і робота візьме новий час.',
  'work.answer.noTime':
    'Часу вони не обрали. Залиште порожнім, щоб прийняти без часу й зателефонувати їм.',
  'work.answer.accept': 'Прийняти',
  'work.answer.accepting': 'Приймаю…',
  'work.answer.decline': 'Відхилити',
  'work.answer.declining': 'Відхиляю…',
  'work.answer.note':
    'Прийняття створює роботу в JobPocket і ставить її в календар. Клієнту автоматично нічого не повідомляють — це відбувається тоді, коли ви йому телефонуєте.',

  // ---------------------------------------------------------------------
  // Звернення
  // ---------------------------------------------------------------------
  'work.leads.title': 'Звернення',
  'work.leads.search': 'Пошук',
  'work.leads.searchPlaceholder': 'Імʼя, телефон, пошта, місто',
  'work.leads.any': 'Будь-який',
  'work.leads.channel': 'Канал',
  'work.leads.clear': 'Скинути',
  'work.leads.empty': 'За цим фільтром звернень немає.',
  'work.leads.when': 'Коли',
  'work.leads.name': 'Імʼя',
  'work.leads.contact': 'Контакт',
  'work.leads.town': 'Місто',
  'work.leads.appliance': 'Техніка',
  'work.leads.form': 'Форма',
  'work.leads.decidedIn': 'Час на рішення',
  'work.leads.duplicate': 'дубль',
  'work.leads.showing': '{from}–{to} з {total}',
  'work.leads.newer': '← Новіші',
  'work.leads.older': 'Давніші →',
  'work.leads.hint':
    'Саме позначка «виграно» разом із сумою робить справжніми грошові цифри на інших екранах — і саме вона йде назад у Google та Meta, щоб їхні ставки оптимізувалися під оплачені роботи, а не під заповнені форми.',

  // Результати звернень. У базі та в адресному рядку лишається значення —
  // з мовою змінюється тільки підпис.
  'work.leadStatus.new': 'Нове',
  'work.leadStatus.contacted': 'Звʼязалися',
  'work.leadStatus.booked': 'Записано',
  'work.leadStatus.won': 'Виграно',
  'work.leadStatus.lost': 'Втрачено',
  'work.leadStatus.spam': 'Спам',

  // З якої форми прийшло.
  'work.sourceForm.contact': 'Форма звʼязку',
  'work.sourceForm.booking': 'Форма запису',
  'work.sourceForm.calendly': 'Calendly',
  'work.sourceForm.call': 'Дзвінок',
  'work.sourceForm.manual': 'Внесено вручну',

  // ---------------------------------------------------------------------
  // Одне звернення
  // ---------------------------------------------------------------------
  'work.lead.back': '← Усі звернення',
  'work.lead.unnamed': 'Звернення без імені',
  'work.lead.duplicate':
    'Схоже, це повтор попередньої заявки з того самого номера протягом тридцяти днів. Його не рахують у кількості звернень, щоб вартість звернення по каналу залишалася чесною.',
  'work.lead.contact': 'Контакти',
  'work.lead.phone': 'Телефон',
  'work.lead.email': 'Пошта',
  'work.lead.address': 'Адреса',
  'work.lead.appliance': 'Техніка',
  'work.lead.notificationEmail': 'Лист-сповіщення',
  'work.lead.emailNotAttempted': 'не надсилали',
  'work.lead.emailDelivered': 'доставлено',
  'work.lead.emailFailed': 'НЕ ДОСТАВЛЕНО — поштою ніхто не дізнався',
  'work.lead.decidedIn': 'Час на рішення',
  'work.lead.attribution': 'Атрибуція',
  'work.lead.attributionSubtitle': 'Зафіксовано в мить, коли до вас звернулися',
  'work.lead.firstTouch': 'Перший дотик',
  'work.lead.firstTouchNote': 'Що взагалі познайомило їх із бізнесом',
  'work.lead.lastTouch': 'Останній дотик',
  'work.lead.lastTouchNote': 'Що спрацювало в мить звернення',
  'work.lead.source': 'Джерело',
  'work.lead.medium': 'Тип трафіку',
  'work.lead.campaign': 'Кампанія',
  'work.lead.ad': 'Оголошення',
  'work.lead.keyword': 'Ключове слово',
  'work.lead.landedOn': 'Зайшли на',
  'work.lead.referrer': 'Звідки перейшли',
  'work.lead.clickIds': 'Ідентифікатори кліків',
  'work.lead.clickIdsHint':
    'Саме вони дають змогу відзвітувати рекламній платформі про виграну роботу і привʼязати її до того самого кліку, який її приніс.',
  'work.lead.behaviour': 'Що вони робили',
  'work.lead.behaviourSubtitle': 'Поведінка під час візиту, який завершився зверненням',
  'work.lead.noBehaviour':
    'Поведінки не записано — звернення прийшло без відстеженої сесії. Так буває, коли людина просто телефонує або записується через Calendly.',
  'work.lead.after': ' через {duration}',
  'work.lead.outcome': 'Результат',
  'work.lead.calls': 'Дзвінки',
  'work.lead.callsSubtitle': 'З цього номера',
  'work.lead.noCalls': 'Повʼязаних дзвінків немає.',
  'work.lead.missed': 'пропущений',
  'work.lead.earlierVisits': 'Попередні візити',
  'work.lead.earlierVisitsSubtitle': 'Усе, що цей браузер робив раніше',
  'work.lead.noVisits': 'Інших візитів немає.',
  'work.lead.when': 'Коли',
  'work.lead.channel': 'Канал',
  'work.lead.pages': 'Сторінок',
  'work.lead.exports': 'Відправлено назад у рекламні платформи',
  'work.lead.export.sent': 'надіслано',
  'work.lead.export.failed': 'помилка',
  'work.lead.export.pending': 'у черзі',

  // Що робив відвідувач на сайті. Назва події — це значення в базі,
  // тут лише слова, які показують замість неї.
  'work.event.pageview': 'Переглянув',
  'work.event.engagement': 'Читає',
  'work.event.scroll': 'Догортав до',
  'work.event.click_phone': 'Натиснув на номер телефону',
  'work.event.click_email': 'Натиснув на пошту',
  'work.event.click_cta': 'Клікнув',
  'work.event.outbound': 'Пішов на',
  'work.event.form_start': 'Почав заповнювати форму',
  'work.event.form_field': 'Заповнив',
  'work.event.form_step': 'Крок форми',
  'work.event.form_submit': 'Надіслав форму',
  'work.event.form_error': 'Форму не прийнято',
  'work.event.calendly_view': 'Дійшов до календаря',
  'work.event.calendly_booked': 'Записався на візит',
  'work.event.rage_click': 'Люто клікав на',
  'work.event.js_error': 'Наткнувся на помилку скрипта',
  'work.event.exit': 'Пішов із сайту',

  // ---------------------------------------------------------------------
  // Запис результату
  // ---------------------------------------------------------------------
  'work.editor.jobValue': 'Сума роботи',
  'work.editor.valueHint':
    'Скільки за роботу справді виставили. Порожнє поле означає «невідомо», і це не те саме, що нуль.',
  'work.editor.notes': 'Нотатки',
  'work.editor.notesPlaceholder': 'Що вийшло, коли ви зателефонували.',
  'work.editor.saveFailed': 'Не вдалося зберегти.',

  // ---------------------------------------------------------------------
  // Дзвінки
  // ---------------------------------------------------------------------
  'work.calls.title': 'Дзвінки',
  'work.calls.noNumbersBefore':
    'Номери для відстеження не налаштовані, тож дзвінки неможливо привʼязати до каналу. Додайте їх у розділі ',
  'work.calls.noNumbersAfter': ' — по одному номеру на канал, кожен із переадресацією на основну лінію.',
  'work.calls.count': 'Дзвінків',
  'work.calls.answered': 'Відповіли',
  'work.calls.ofCalls': '{pct} усіх дзвінків',
  'work.calls.missed': 'Пропущено',
  'work.calls.missedHint': 'кожен — це робота, яку дістав хтось інший',
  'work.calls.missedNone': 'жодного',
  'work.calls.talkTime': 'Час розмов',
  'work.calls.overSeconds': 'розмов довших за {seconds} с: {n}',
  'work.calls.log': 'Журнал дзвінків',
  'work.calls.empty':
    'Дзвінків не записано. Вони зʼявляться тут, щойно запрацюють номери для відстеження, а вебхук Telnyx буде спрямований на цей сайт.',
  'work.calls.when': 'Коли',
  'work.calls.from': 'Від кого',
  'work.calls.rang': 'Куди дзвонили',
  'work.calls.channel': 'Канал',
  'work.calls.town': 'Місто',
  'work.calls.wasReading': 'Що читав',
  'work.calls.length': 'Тривалість',
  'work.calls.result': 'Результат',
  'work.calls.new': 'новий',
  'work.calls.tooShort': 'Закороткий',
  'work.calls.wasAnswered': 'Відповіли',
  'work.calls.wasMissed': 'Пропущений',
  'work.calls.lead': 'звернення',
  'work.calls.hint':
    '«Що читав» — це сторінка, на яку зайшла відповідна сесія перегляду; саме так дзвінок звʼязується з рекламою. Це найкращий збіг за каналом і часом, тож сприймайте його як вагомий доказ, а не як беззаперечний факт.',
};
