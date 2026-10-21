import type { GrammarPoint } from "./index";

/** HSK 1 grammar points from the HSK 2.0 syllabus. Example sentences are original and use HSK 1 words only. */
const points: GrammarPoint[] = [
  {
    id: "shi",
    title: { zh: "是字句", en: "Sentences with 是 (to be)", ru: "Предложения с 是 («быть, являться»)" },
    structure: "A + 是 + B　·　A + 不是 + B",
    explain: {
      en: "是 links two nouns: “A is B”. It is not used before adjectives. To negate it, put 不 before 是 (never 没).",
      ru: "是 связывает два существительных: «A есть B». Перед прилагательными не используется. Отрицание: 不是 (никогда не 没是).",
    },
    examples: [
      { zh: "我是学生。", py: "Wǒ shì xuésheng.", en: "I am a student.", ru: "Я студент." },
      { zh: "她不是老师，她是医生。", py: "Tā bú shì lǎoshī, tā shì yīshēng.", en: "She isn't a teacher, she's a doctor.", ru: "Она не учитель, она врач." },
    ],
    warning: {
      en: "“我是很高兴” is wrong. Adjectives take 很 without 是: 我很高兴.",
      ru: "«我是很高兴» — ошибка. С прилагательными 是 не нужен: 我很高兴.",
    },
  },
  {
    id: "ma",
    title: { zh: "吗字疑问句", en: "Yes/no questions with 吗", ru: "Общий вопрос с 吗" },
    structure: "Statement + 吗？",
    explain: {
      en: "Add 吗 to the end of a statement to make a yes/no question. Word order does not change. Answer by repeating the verb or adjective, with or without 不.",
      ru: "Чтобы задать общий вопрос, добавьте 吗 в конец утвердительного предложения. Порядок слов не меняется. Отвечают, повторяя глагол или прилагательное (с 不 или без).",
    },
    examples: [
      { zh: "你是中国人吗？", py: "Nǐ shì Zhōngguó rén ma?", en: "Are you Chinese?", ru: "Вы китаец?" },
      { zh: "你喜欢喝茶吗？——喜欢。", py: "Nǐ xǐhuan hē chá ma? — Xǐhuan.", en: "Do you like tea? — Yes.", ru: "Тебе нравится чай? — Да." },
    ],
    warning: {
      en: "Never use 吗 together with a question word: “你叫什么名字吗？” is wrong.",
      ru: "吗 не ставится вместе с вопросительным словом: «你叫什么名字吗？» — ошибка.",
    },
  },
  {
    id: "question-words",
    title: { zh: "疑问代词", en: "Question words", ru: "Вопросительные слова" },
    structure: "谁 · 什么 · 哪 · 哪儿 · 几 · 多少 · 怎么 · 怎么样",
    explain: {
      en: "A question word goes in the same place as the answer would. 谁 who, 什么 what, 哪 which, 哪儿 where, 几 how many (usually under 10, with a measure word), 多少 how many/much (any number), 怎么 how, 怎么样 how is it.",
      ru: "Вопросительное слово стоит на месте ожидаемого ответа. 谁 кто, 什么 что, 哪 который, 哪儿 где, 几 сколько (обычно до 10, со счётным словом), 多少 сколько (любое число), 怎么 как, 怎么样 как (оценка).",
    },
    examples: [
      { zh: "他是谁？", py: "Tā shì shéi?", en: "Who is he?", ru: "Кто он?" },
      { zh: "你家有几个人？", py: "Nǐ jiā yǒu jǐ gè rén?", en: "How many people are in your family?", ru: "Сколько человек в твоей семье?" },
      { zh: "这个杯子多少钱？", py: "Zhège bēizi duōshao qián?", en: "How much is this cup?", ru: "Сколько стоит эта чашка?" },
    ],
  },
  {
    id: "ne",
    title: { zh: "呢", en: "Follow-up questions with 呢", ru: "Встречный вопрос с 呢" },
    structure: "Noun + 呢？",
    explain: {
      en: "呢 after a noun or pronoun asks “and what about …?”, repeating the previous question for someone else. 呢 can also ask where someone or something is.",
      ru: "呢 после существительного или местоимения означает «а ...?» и повторяет предыдущий вопрос о другом. Также 呢 может спрашивать, где кто-то или что-то находится.",
    },
    examples: [
      { zh: "我很好，你呢？", py: "Wǒ hěn hǎo, nǐ ne?", en: "I'm fine, and you?", ru: "У меня всё хорошо, а у тебя?" },
      { zh: "我的书呢？", py: "Wǒ de shū ne?", en: "Where is my book?", ru: "А где моя книга?" },
    ],
  },
  {
    id: "de",
    title: { zh: "结构助词“的”", en: "Possession with 的", ru: "Принадлежность с 的" },
    structure: "Owner + 的 + thing",
    explain: {
      en: "的 links an owner or description to a noun, like English 's. With close family members and one's own country or school, 的 is usually dropped: 我妈妈, 我们学校.",
      ru: "的 связывает владельца или определение с существительным (как «чей»). С близкими родственниками и «своими» коллективами 的 обычно опускается: 我妈妈, 我们学校.",
    },
    examples: [
      { zh: "这是我的电脑。", py: "Zhè shì wǒ de diànnǎo.", en: "This is my computer.", ru: "Это мой компьютер." },
      { zh: "那是老师的书。", py: "Nà shì lǎoshī de shū.", en: "That is the teacher's book.", ru: "То книга учителя." },
    ],
  },
  {
    id: "hen-adj",
    title: { zh: "形容词谓语句", en: "Adjectives as predicates with 很", ru: "Прилагательное-сказуемое с 很" },
    structure: "Subject + 很 + adjective",
    explain: {
      en: "Chinese adjectives work like verbs, so no 是 is needed. A plain adjective sounds like a comparison, so 很 is added; here it is often unstressed and means little more than “is”.",
      ru: "Китайские прилагательные работают как глаголы, поэтому 是 не нужен. Прилагательное без наречия звучит как сравнение, поэтому добавляют 很; часто оно безударное и почти не значит «очень».",
    },
    examples: [
      { zh: "今天很冷。", py: "Jīntiān hěn lěng.", en: "It's cold today.", ru: "Сегодня холодно." },
      { zh: "这个苹果不大。", py: "Zhège píngguǒ bú dà.", en: "This apple isn't big.", ru: "Это яблоко небольшое." },
    ],
    warning: {
      en: "Negation uses 不 and drops 很: 不冷, not 很不冷 (which means “very not cold”).",
      ru: "Отрицание — 不 без 很: 不冷. «很不冷» значит «совсем не холодно».",
    },
  },
  {
    id: "bu-mei",
    title: { zh: "不和没", en: "Negation: 不 and 没", ru: "Отрицание: 不 и 没" },
    structure: "不 + verb/adjective　·　没(有) + verb　·　没有 + noun",
    explain: {
      en: "不 negates the present, the future, habits and wishes. 没 negates the past (something did not happen) and 有 (to have): always 没有, never 不有.",
      ru: "不 отрицает настоящее, будущее, привычки и желания. 没 отрицает прошлое (действие не произошло) и 有 («иметь»): всегда 没有, никогда 不有.",
    },
    examples: [
      { zh: "我明天不去。", py: "Wǒ míngtiān bú qù.", en: "I'm not going tomorrow.", ru: "Завтра я не пойду." },
      { zh: "昨天我没去学校。", py: "Zuótiān wǒ méi qù xuéxiào.", en: "I didn't go to school yesterday.", ru: "Вчера я не ходил в школу." },
      { zh: "我没有猫。", py: "Wǒ méiyǒu māo.", en: "I don't have a cat.", ru: "У меня нет кошки." },
    ],
    warning: {
      en: "不 changes to bú before a 4th tone: 不是 bú shì, 不去 bú qù.",
      ru: "Перед 4-м тоном 不 читается bú: 不是 bú shì, 不去 bú qù.",
    },
  },
  {
    id: "you-zai",
    title: { zh: "“有”和“在”", en: "Existence and location: 有 and 在", ru: "Наличие и местонахождение: 有 и 在" },
    structure: "Place + 有 + thing　·　Thing/person + 在 + place",
    explain: {
      en: "有 says what exists in a place (“there is”). 在 says where a known person or thing is. 在 + place can also come before a verb to say where an action happens.",
      ru: "有 сообщает, что находится в месте («есть»). 在 сообщает, где находится известный человек или предмет. 在 + место перед глаголом указывает, где происходит действие.",
    },
    examples: [
      { zh: "桌子上有一本书。", py: "Zhuōzi shang yǒu yì běn shū.", en: "There is a book on the table.", ru: "На столе лежит книга." },
      { zh: "妈妈在家。", py: "Māma zài jiā.", en: "Mum is at home.", ru: "Мама дома." },
      { zh: "我在医院工作。", py: "Wǒ zài yīyuàn gōngzuò.", en: "I work at a hospital.", ru: "Я работаю в больнице." },
    ],
  },
  {
    id: "measure",
    title: { zh: "数词和量词", en: "Numbers and measure words", ru: "Числительные и счётные слова" },
    structure: "Number + measure word + noun　·　这/那 + measure word + noun",
    explain: {
      en: "A number cannot go straight before a noun; a measure word comes in between. 个 is the general one. HSK 1 also uses 本 (books), 块 (yuan), 岁 (age), 些 (some). 二 becomes 两 before a measure word.",
      ru: "Между числом и существительным нужно счётное слово. Универсальное — 个. В HSK 1 также 本 (книги), 块 (юани), 岁 (возраст), 些 (несколько). Перед счётным словом 二 заменяется на 两.",
    },
    examples: [
      { zh: "我有两个女儿。", py: "Wǒ yǒu liǎng gè nǚ'ér.", en: "I have two daughters.", ru: "У меня две дочери." },
      { zh: "这本书三十块。", py: "Zhè běn shū sānshí kuài.", en: "This book is 30 yuan.", ru: "Эта книга стоит 30 юаней." },
    ],
    warning: {
      en: "“两个人”, not “二个人”. 二 is used in counting, in phone numbers and in numbers like 十二.",
      ru: "«两个人», а не «二个人». 二 используется при счёте, в телефонных номерах и в числах вроде 十二.",
    },
  },
  {
    id: "time",
    title: { zh: "时间的表达", en: "Dates and times", ru: "Даты и время" },
    structure: "年 → 月 → 日/号 → 星期 → 上午/下午 → 点 → 分",
    explain: {
      en: "Chinese goes from the largest unit to the smallest. Time words come before the verb, either before or after the subject, never at the end of the sentence.",
      ru: "В китайском время указывается от большего к меньшему. Слова времени стоят перед глаголом (до или после подлежащего), но не в конце предложения.",
    },
    examples: [
      { zh: "今天是九月八号，星期三。", py: "Jīntiān shì jiǔ yuè bā hào, xīngqīsān.", en: "Today is Wednesday, 8 September.", ru: "Сегодня среда, 8 сентября." },
      { zh: "我下午三点去商店。", py: "Wǒ xiàwǔ sān diǎn qù shāngdiàn.", en: "I'm going to the shop at 3 pm.", ru: "Я пойду в магазин в три часа дня." },
    ],
  },
  {
    id: "le",
    title: { zh: "“了”表示完成或变化", en: "了 for completed actions and change", ru: "了: завершённое действие и изменение" },
    structure: "Verb + 了 (+ object)　·　Sentence + 了",
    explain: {
      en: "了 after a verb marks an action as completed. 了 at the end of a sentence marks a new situation (“now”). The negative of a completed action is 没 + verb, without 了.",
      ru: "了 после глагола показывает, что действие завершено. 了 в конце предложения сообщает о новой ситуации («уже, теперь»). Отрицание завершённого действия: 没 + глагол, без 了.",
    },
    examples: [
      { zh: "我买了一个杯子。", py: "Wǒ mǎi le yí gè bēizi.", en: "I bought a cup.", ru: "Я купил чашку." },
      { zh: "下雨了。", py: "Xià yǔ le.", en: "It's started raining.", ru: "Пошёл дождь." },
    ],
    warning: {
      en: "“我没去了” is wrong. Say 我没去.",
      ru: "«我没去了» — ошибка. Правильно: 我没去.",
    },
  },
  {
    id: "modals",
    title: { zh: "能愿动词：会、能、想", en: "Modal verbs 会, 能, 想", ru: "Модальные глаголы 会, 能, 想" },
    structure: "Subject + 会/能/想 + verb",
    explain: {
      en: "会 is a learned skill or a likely future (“can, will”). 能 is ability or permission in a situation (“be able to, may”). 想 is a wish (“would like to”). All three are negated with 不.",
      ru: "会 — приобретённое умение или вероятное будущее («уметь, будет»). 能 — возможность или разрешение в ситуации («мочь»). 想 — желание («хотеть»). Все три отрицаются с 不.",
    },
    examples: [
      { zh: "我会说汉语。", py: "Wǒ huì shuō Hànyǔ.", en: "I can speak Chinese.", ru: "Я умею говорить по-китайски." },
      { zh: "明天你能来吗？", py: "Míngtiān nǐ néng lái ma?", en: "Can you come tomorrow?", ru: "Ты сможешь прийти завтра?" },
      { zh: "我想喝水。", py: "Wǒ xiǎng hē shuǐ.", en: "I'd like some water.", ru: "Я хочу пить." },
    ],
  },
  {
    id: "tai-le",
    title: { zh: "太……了", en: "太 … 了 (too, so)", ru: "太 … 了 («слишком, так»)" },
    structure: "太 + adjective + 了",
    explain: {
      en: "太…了 expresses a strong feeling: “too …” when something is excessive, or “so …!” as praise. 不太 + adjective softens a negative: “not very”.",
      ru: "太…了 выражает сильную оценку: «слишком ...» или «так ...!» как похвала. 不太 + прилагательное смягчает отрицание: «не очень».",
    },
    examples: [
      { zh: "太贵了！", py: "Tài guì le!", en: "That's too expensive!", ru: "Слишком дорого!" },
      { zh: "你的衣服太漂亮了。", py: "Nǐ de yīfu tài piàoliang le.", en: "Your clothes are so beautiful.", ru: "Твоя одежда очень красивая." },
    ],
  },
  {
    id: "he-dou",
    title: { zh: "“和”与“都”", en: "和 (and) and 都 (all, both)", ru: "和 («и») и 都 («все, оба»)" },
    structure: "Noun + 和 + noun　·　Subject + 都 + verb",
    explain: {
      en: "和 joins nouns and pronouns, not verbs or sentences. 都 is an adverb, so it goes after the subject and before the verb.",
      ru: "和 соединяет существительные и местоимения, но не глаголы и не предложения. 都 — наречие: стоит после подлежащего перед глаголом.",
    },
    examples: [
      { zh: "我和我朋友都是学生。", py: "Wǒ hé wǒ péngyou dōu shì xuésheng.", en: "My friend and I are both students.", ru: "Мы с другом оба студенты." },
    ],
    warning: {
      en: "“都我们是学生” is wrong: 都 never comes before the subject.",
      ru: "«都我们是学生» — ошибка: 都 не ставится перед подлежащим.",
    },
  },
];

export default points;
