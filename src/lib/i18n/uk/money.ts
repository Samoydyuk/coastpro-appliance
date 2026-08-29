import type { money as source } from '../en/money';

/**
 * The money screens, in Ukrainian.
 *
 * Typed against the English file, so a key added there and forgotten here is a
 * compile error rather than an English word on a Ukrainian screen.
 *
 * Терміни тримаються за core.ts: Прибуток, Несплачене, Диспетчери, Техніки,
 * Платежі, Виставлено, Лишилось, Робота, Клієнт.
 */
export const money: Record<keyof typeof source, string> = {
  'profile.title': 'Картина техніка',
  'profile.noWork': 'За цей період завершених робіт немає.',
  'profile.partsRate': 'Запчастини записано',
  'profile.againstBooks': 'по книгах {pct}%',
  'profile.serviceCalls': 'Лише сервіс-кол',
  'profile.serviceCallsHint': 'виїзд був, продажу не було',
  'profile.time': 'Фактичний візит',
  'profile.booked': 'заплановано {n} хв',
  'profile.worth': 'приблизно {amount} за період',
  'profile.byAppliance': 'За технікою',
  'profile.byMake': 'За брендом',
  'profile.makeUnrecorded': 'Не записано',
  'profile.byDispatcher': 'За диспетчером, лишилось',
  'profile.hint': 'Кожна знахідка порахована з цих книг за цей період і несе свої числа — жодних середніх по ринку звідкись іззовні. Менш ніж на восьми візитах не каже нічого, бо дві роботи це не закономірність. Собівартість запчастин у розрізі людини не показується: на тонкому зрізі виручка поруч із маржею її видає.',

  'ihord.unpaidHere': 'Не отримано',

  'ihord.hasPhotos': 'фото: {n}',
  'ihord.noPhotos': 'Фото немає',
  'ihord.hasScan': 'сканів: {n}',
  'ihord.noScan': 'Скана немає',

  'ihord.title': 'Звірка з диспетчером',
  'ihord.subtitle': 'Книги Esquire поруч із нашими',
  'ihord.period.thisMonth': 'Цей місяць',
  'ihord.period.lastMonth': 'Минулий місяць',
  'ihord.period.all': 'Увесь час',
  'ihord.notConnected': 'Сервіс синхронізації поки не відповів.',
  'ihord.earned': 'Зароблено',
  'ihord.notSettled': 'Не підтверджено',
  'ihord.paid': 'Виплачено',
  'ihord.stillOwed': 'Ще винні',
  'ihord.overpaid': 'заплатили наперед',
  'ihord.parseGap': 'Сторінка виплат показує {claimed} візитів, прочитати вдалося {parsed}. Суми вгорі — їхні власні, тож вони точні, але в таблицях нижче бракує цієї різниці.',
  'ihord.notSettledTitle': 'Зроблено, ще не підтверджено',
  'ihord.notSettledSubtitle': 'Здана робота, яку вони ще не позначили як звірену',
  'ihord.allSettled': 'Усе здане підтверджено.',
  'ihord.notSettledHint': 'Reconciled — це їхнє слово для «ми згодні, цю закрито». Поки візит його не має, гроші за нього ще не в дорозі.',
  'ihord.missingHere': 'Є в них, немає в нас',
  'ihord.missingThere': 'Є в нас, немає в них',
  'ihord.bothAgree': 'Обидві сторони мають ту саму роботу.',
  'ihord.missingHereHint': 'На довгому періоді більшість із них просто старші за синхронізацію, а не втрачені. На місяці — варті питання.',
  'ihord.missingThereHint': 'Робота, яка є в нас і не дійшла до їхніх нарахувань — за неї ніхто не просив грошей.',
  'ihord.payouts': 'Отримані виплати',
  'ihord.noPayouts': 'За цей період виплат не записано.',
  'ihord.payoutsHint': 'Те, що вони записали як виплачене. Порівняно з {count} роботами з нашого боку.',
  'ihord.sold': 'Продано',
  'ihord.parts': 'Запчастини',
  'ihord.toYou': 'До виплати',
  'ihord.visit.one': '{n} візит',
  'ihord.visit.few': '{n} візити',
  'ihord.visit.many': '{n} візитів',
  'ihord.visit.other': '{n} візиту',
  'ihord.payout.one': '{n} виплата',
  'ihord.payout.few': '{n} виплати',
  'ihord.payout.many': '{n} виплат',
  'ihord.payout.other': '{n} виплати',

  'money.entry.one': '{n} запис',
  'money.entry.few': '{n} записи',
  'money.entry.many': '{n} записів',
  'money.entry.other': '{n} запису',

  // Спільне для всіх грошових екранів
  'money.notConnected': 'Роботи й платежі',
  'money.noAnswer': 'JobPocket не відповів.',
  'money.noFinishedWork': 'За цей період завершених робіт немає.',
  'money.afterDispatchersShare': 'після частки диспетчерів',
  'money.avgTicketShort': 'Сер. чек',
  'money.revenue': 'Виручка',
  'money.technician': 'Технік',

  // Прибуток — плитки
  'money.ofWhatWasBilled': '{pct} від виставленого',

  // Прибуток — шлях від виставленого до того, що лишилось
  'money.dispatchersShareNote': 'скільки залишають собі компанії, які дають вам роботу',
  'money.fuelNote': 'з журналу пробігу',
  'money.writtenOffNote': 'борги, які за цей період вирішили не стягувати',
  'money.overheadNote': 'постійні витрати, рознесені на вибрані дні',
  'money.nothingOnThisLine': 'За цим рядком нічого не записано.',
  'money.waterfallHint':
    'Це те, що заробив бізнес, а не те, що лишається після виплати собі: власна зарплата — це ' +
    'частина результату, а не витрата проти нього. Усі числа рахує JobPocket; консоль лише ' +
    'показує їх і нічого не обчислює сама, тож ця сторінка й застосунок не можуть розійтися. ' +
    'Підкреслені рядки відкривають роботи, з яких вони складаються.',

  // Прибуток — чого числам не сказали
  'money.missingCategories':
    'У категоріях {categories} немає жодного запису. Маржа, порахована на кількох категоріях з ' +
    'одинадцяти, виглядає чудово, але такою не є.',
  'money.unsplitWarning':
    '{companies} {verb} записаного розподілу, тож увесь чек рахується як ваш. Якщо вони беруть ' +
    'свою частку, цей прибуток завищений.',
  'money.unsplitVerb.one': 'не має',
  'money.unsplitVerb.few': 'не мають',
  'money.unsplitVerb.many': 'не мають',
  'money.unsplitVerb.other': 'не мають',

  // Прибуток — динаміка
  'money.pickLongerWindow': 'Виберіть довший період, щоб побачити картину.',
  'money.trendHint':
    'Прибутку тут навмисно немає третьою лінією. Накладні витрати й ваша власна оплата ' +
    'розподіляються на весь вибраний період, тож якби їх різали по днях, вийшов би прибуток, ' +
    'який не збігається з тим, що в таблиці вище.',

  // Три числа виручки
  'money.basis.title': 'Три числа виручки — три різні питання',
  'money.basis.figure': 'Число',
  'money.basis.answers': 'На що відповідає',
  'money.basis.invoiced': 'Виставлено в JobPocket',
  'money.basis.invoicedAnswer': 'Уся робота, звідки б вона не прийшла.',
  'money.basis.traceable': 'Простежується до звернення',
  'money.basis.traceableAnswer':
    'Роботи, які почалися з форми на сайті або дзвінка на відстежуваний номер.',
  'money.basis.reported': 'Передано в Google Ads',
  'money.basis.reportedAnswer': 'Зафіксовано, коли роботу позначили виграною. Ніколи не змінюється.',
  'money.basis.note':
    'Ці три числа не сходяться — і не мають сходитися. Перше — це весь бізнес. Друге — та його ' +
    'частина, за якою можна судити про рекламу: роботи від диспетчерів, дзвінки на власний номер ' +
    'майстерні та клієнти, які й так вас знали, приходять без жодної позначки, тож виручка по ' +
    'каналах ніколи не дорівнюватиме загальній. Третє — число, яке тримає Google Ads: його ' +
    'передали до кліку в той день, коли роботу позначили виграною, і звідси його змінити не ' +
    'можна, тож воно лишається як є, а суму з інвойса показано поруч, а не поверх нього.',
  'money.basis.wholePicture': 'Уся картина — у розділі «Гроші».',
  'money.basis.line':
    'Виручка тут — це справжні гроші з інвойсів, і вона охоплює лише ті роботи, що почалися зі ' +
    'звернення чи дзвінка на відстежуваний номер, — {attributed}. Усе, що прийшло від ' +
    'диспетчера, на власний номер майстерні або від клієнта, який і так нас знав, приписати нема ' +
    'до чого. Число, яке тримає Google Ads, знову інше — {reported} — бо його зафіксували тоді, ' +
    'коли роботу позначили виграною.',
  'money.basis.businessTotal': 'Загальна сума по бізнесу — у розділі «Гроші».',

  // Несплачене
  'money.ofWhatIsOwed': '{pct} від усього боргу',
  'money.measuredToToday': 'Рахується до сьогодні, а не до кінця періоду',
  'money.ageUnder30': 'До 30 днів',
  'money.age30to60': 'Від 31 до 60 днів',
  'money.age60to90': 'Від 61 до 90 днів',
  'money.ageOver90': 'Понад 90 днів',
  'money.nothingOutstandingLong': 'Боргів немає. За все завершене вже заплатили.',
  'money.unpaidNoWindowHint':
    'На цій сторінці навмисно немає вибору періоду. Борг не зникає від того, що звіт звузили до ' +
    'минулого тижня, а рішення потребують саме найдавніші.',
  'money.oldestFirst': 'Найдавніші першими — кому дзвонити, вирішує вік боргу, а не сума',
  'money.writeOffHint':
    'Борг, який вирішили не стягувати, більше не вважається непогашеним і сюди не потрапляє: ' +
    'списання в застосунку прибирає його зі списку й записує збиток у тому періоді, коли ухвалили ' +
    'рішення.',

  // Зависло
  'money.nothingScanned': 'завершені, нічого не відскановано',
  'money.sameListApp': 'той самий список, за яким стежить застосунок',
  'money.everyJobWhereItShouldBe':
    'Кожна робота там, де має бути: інвойс виставлено, скан є, закрито й призначено.',
  'money.stuckHint':
    'Цей список не консольний. Він приходить із перевірок, які JobPocket і так виконує, тож ' +
    'застосунок і ця сторінка не можуть по-різному вирішити, що вважати незісканованим чи ' +
    'невиставленим, — а нова перевірка, додана там, сама зʼявляється тут.',

  // Диспетчери
  'money.dispatchedShareOfWork':
    '{pct} робіт прийшло від диспетчерів — під вашим власним іменем {own} з {total}.',
  'money.centsOnDollar': '{cents}¢ з долара',
  'money.whatCustomersCharged': 'скільки заплатили клієнти',
  'money.rankedOnSurvives': 'Рейтинг за тим, що лишається вам, а не за тим, скільки вони дають',
  'money.keptOfBilled': '{pct} з {billed}',
  'money.keptRankHint':
    'Рейтинг за тим, скільки лишається вам, а не за виставленим: за виставленим видно, хто дає ' +
    'найбільше робіт, а за залишком — хто вартий найбільше, і лише друге щось змінює у ваших ' +
    'рішеннях.',
  'money.whatDealReturns': 'Що насправді дає ця домовленість',
  'money.partsBack': ', запчастини повертають',
  'money.keptPctHint':
    '«Лишається %» — це частка від усього чека, а не той відсоток, що записаний в умовах: ' +
    'диспетчер, який відшкодовує запчастини, повертає ці гроші повністю, тож забирає він менше, ' +
    'ніж здається з його числа.',

  // Техніки
  'money.afterTheSplit': 'Скільки кожен приніс після розподілу',
  'money.avgEach': 'у середньому {amount}',
  'money.openTheWeek': 'Відкрийте тиждень, щоб побачити, що саме вони робили',
  'money.minutes': '{n} хв',
  'money.jobsLink': 'роботи',
  'money.techRevenueOnlyHint':
    'Тут навмисно лише виручка. Собівартість робіт не розписана по людях: на короткому періоді в ' +
    'техніка часто одна робота, і виручка поруч із маржею видала б, скільки коштували запчастини ' +
    'саме на ній. Заплановані години відповідають на те саме питання без цього.',

  // Платежі
  'money.ofWhatWasTaken': '{pct} від усього отриманого',
  'money.excludedWarning':
    '{amount} є в журналі нижче, але не входить у підсумок вище: {list}. Частково повернений ' +
    'платіж не рахується в жодному підсумку системи — це варто знати, перш ніж звіряти це число ' +
    'з банківською випискою.',
  'money.showingOnly': 'Показано лише {method}',
  'money.onlyWentThrough': 'Лише платежі, які пройшли',
  'money.nothingTaken': 'За цей період нічого не отримано.',
  'money.methodAll': 'Усі',
  'money.deposit': 'завдаток',
  'money.paymentsHint':
    'Дата — це коли надійшли гроші, а не коли виставили інвойс. Анульований платіж зберігає тут ' +
    'свою суму, щоб його можна було звести, і перекреслений, бо не входить у жодний підсумок.',

  // Роботи за числом
  'money.jobsPageTitle': 'Роботи',
  'money.everyJobBehind': 'Усі роботи за цим числом',
  'money.noJobsMatch': 'Завершених робіт за цими умовами немає.',
  'money.jobsHint':
    '«Виставлено» — це те, що заплатив клієнт; «Лишилось» — те, що залишається після частки ' +
    'диспетчера. На спільних роботах це різні числа, і саме заради цієї різниці існує цей розділ.',

  // Як надійшли гроші
  'money.method.STRIPE': 'Stripe',
  'money.method.CASH': 'Готівка',
  'money.method.CHECK': 'Чек',
  'money.method.BANK_TRANSFER': 'Банківський переказ',
  'money.method.ZELLE': 'Zelle',
  'money.method.VENMO': 'Venmo',
  'money.method.OTHER': 'Інше',

  // Що сталося з платежем
  'money.status.pending': 'очікується',
  'money.status.processing': 'обробляється',
  'money.status.failed': 'не пройшов',
  'money.status.canceled': 'скасовано',
  'money.status.voided': 'анульовано',
  'money.status.refunded': 'повернуто',
  'money.status.partially_refunded': 'частково повернуто',

  // Категорії витрат
  'money.category.MATERIALS': 'Матеріали',
  'money.category.TOOLS': 'Інструменти',
  'money.category.FUEL': 'Пальне',
  'money.category.VEHICLE': 'Автомобіль',
  'money.category.INSURANCE': 'Страхування',
  'money.category.LICENSE': 'Ліцензії',
  'money.category.MARKETING': 'Реклама',
  'money.category.OFFICE': 'Офіс',
  'money.category.UTILITIES': 'Комунальні',
  'money.category.LABOR': 'Оплата праці',
  'money.category.OTHER': 'Інше',

  // Як часто настає постійна витрата. Читається після суми: «$400 щомісяця».
  'money.cadence.WEEKLY': 'щотижня',
  'money.cadence.MONTHLY': 'щомісяця',
  'money.cadence.QUARTERLY': 'щокварталу',
  'money.cadence.YEARLY': 'щороку',

  // Форми множини — чотири, не дві
  'money.partsJob.one': 'у {n} роботі були запчастини',
  'money.partsJob.few': 'у {n} роботах були запчастини',
  'money.partsJob.many': 'у {n} роботах були запчастини',
  'money.partsJob.other': 'у {n} роботи були запчастини',
  'money.finishedJob.one': '{n} завершена робота',
  'money.finishedJob.few': '{n} завершені роботи',
  'money.finishedJob.many': '{n} завершених робіт',
  'money.finishedJob.other': '{n} завершеної роботи',
  'money.acrossKinds.one': 'у {n} виді',
  'money.acrossKinds.few': 'у {n} видах',
  'money.acrossKinds.many': 'у {n} видах',
  'money.acrossKinds.other': 'у {n} виду',
  'money.voided.one': '{n} анульований',
  'money.voided.few': '{n} анульовані',
  'money.voided.many': '{n} анульованих',
  'money.voided.other': '{n} анульованого',
  'money.refunded.one': '{n} повернений',
  'money.refunded.few': '{n} повернені',
  'money.refunded.many': '{n} повернених',
  'money.refunded.other': '{n} поверненого',
  'money.partlyRefunded.one': '{n} частково повернений',
  'money.partlyRefunded.few': '{n} частково повернені',
  'money.partlyRefunded.many': '{n} частково повернених',
  'money.partlyRefunded.other': '{n} частково поверненого',
  'money.stillPending.one': '{n} ще очікується',
  'money.stillPending.few': '{n} ще очікуються',
  'money.stillPending.many': '{n} ще очікуються',
  'money.stillPending.other': '{n} ще очікується',
};
