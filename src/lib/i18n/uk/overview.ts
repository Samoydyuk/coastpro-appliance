import type { overview as source } from '../en/overview';

/**
 * The overview screens, in Ukrainian.
 *
 * Typed against the English file, so a key added there and forgotten here is a
 * compile error rather than an English word on a Ukrainian screen.
 */
export const overview: Record<keyof typeof source, string> = {
  'overview.title': 'Огляд',
  // «у {days}» бере знахідний відмінок, тож форма підходить для будь-якого
  // числа: у 1 день, у 2 дні, у 30 днів.
  'overview.subtitle': '{range} · порівняно з попереднім періодом у {days}',

  'overview.paidNoSpend':
    '{channels} — звідти був трафік, але витрат за цей період не записано, тож ціну звернення нема з чого порахувати. Додайте їх у розділі',
  'overview.paidNoSpendLink': 'Витрати на рекламу',

  'overview.requests': 'Звернення',
  'overview.requestsHint': 'форми + прийняті дзвінки',
  'overview.costPerRequest': 'Ціна звернення',
  'overview.costPerRequestHint': 'при витратах {amount}',
  'overview.noSpend': 'витрат не записано',
  'overview.jobsWon': 'Виграні роботи',
  'overview.jobsWonHint': '{marked} позначено · {invoiced} виставлено',
  'overview.roas': 'Віддача від реклами',
  'overview.roasNeeds': 'потрібні витрати й оплачені роботи',
  'overview.roasHint': 'виставлено ÷ витрати на рекламу',

  'overview.visits': 'Візити',
  'overview.formLeads': 'Заявки з форм',
  'overview.allClean': 'усі чисті',
  'overview.calls': 'Дзвінки',
  'overview.callsHint': '{n} прийнято',
  'overview.visitToRequest': 'Візит → звернення',
  'overview.visitToRequestHint': 'частка візитів, які закінчились зверненням',

  'overview.pagesPerVisit': 'Сторінок за візит',
  'overview.pagesSeen': 'переглянуто {pages}',
  'overview.timeOnSite': 'Час на сайті',
  'overview.timeOnSiteHint': 'у середньому за візит',
  'overview.bounced': 'Відмови',
  'overview.bouncedHint': 'одна сторінка й вихід за 5 секунд',
  'overview.engagedVisits': 'Залучені візити',
  'overview.engagedVisitsHint': '15 секунд і більше або більш ніж одна сторінка',

  'overview.panel.visits': 'Візити',
  'overview.panel.visitsSub': 'Ботів не враховано',
  'overview.series.visits': 'Візити',
  'overview.panel.requests': 'Звернення',
  'overview.panel.requestsSub': 'Форми й дзвінки, день за днем',
  'overview.series.formLeads': 'Заявки з форм',
  'overview.series.calls': 'Дзвінки',
  'overview.twoChartsHint':
    'Візити й звернення намальовані окремо навмисно. На одному графіку їх довелося б звести до спільної шкали — а тоді лінії скажуть рівно те, заради чого цю шкалу підібрали.',
  'overview.panel.money': 'Гроші',
  'overview.panel.moneySub': 'Витрати на рекламу проти виручки з виграних робіт',
  'overview.series.spend': 'Витрати',
  'overview.series.invoiced': 'Виставлено',
  'overview.panel.sources': 'Звідки приходять звернення',
  'overview.panel.sourcesSub': 'Заявки й дзвінки по каналах',
  'overview.each': 'по {amount}',
  'overview.panel.funnel': 'Воронка',
  'overview.panel.funnelSub': 'Де люди зупиняються',

  'overview.panel.channels': 'Канали',
  'overview.panel.channelsSub': 'Усе, що дало трафік або коштувало грошей',
  'overview.noTraffic': 'За цей період трафіку ще не записано.',
  'overview.col.channel': 'Канал',
  'overview.col.visits': 'Візити',
  'overview.col.leads': 'Заявки',
  'overview.col.calls': 'Дзвінки',
  'overview.col.booked': 'Записано',
  'overview.col.won': 'Виграно',
  'overview.col.spend': 'Витрати',
  'overview.col.costPerRequest': 'Ціна звернення',
  'overview.col.roas': 'ROAS',
  'overview.col.revenue': 'Виручка',
  'overview.channelsHint':
    'Ціна звернення ділить витрати на заявки разом із прийнятими дзвінками, а не на самі заявки. Канал, який приносить переважно дзвінки, за одними формами виглядав би в кілька разів гіршим, ніж він є.',

  // Чотири форми там, де в англійській дві.
  'overview.person.one': '{n} людина',
  'overview.person.few': '{n} людини',
  'overview.person.many': '{n} людей',
  'overview.person.other': '{n} людини',
  // Знахідний відмінок — «переглянуто {n} сторінку / сторінки / сторінок».
  'overview.page.one': '{n} сторінку',
  'overview.page.few': '{n} сторінки',
  'overview.page.many': '{n} сторінок',
  'overview.page.other': '{n} сторінки',
  'overview.dupe.one': '{n} дубль/спам',
  'overview.dupe.few': '{n} дублі/спам',
  'overview.dupe.many': '{n} дублів/спаму',
  'overview.dupe.other': '{n} дублів/спаму',
};
