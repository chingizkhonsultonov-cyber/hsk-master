/**
 * Questions in the style of the HSKK "answer the question" parts, written for this app.
 * Bands: 1 = HSK 1–2 (HSKK elementary), 3 = HSK 3–4 (intermediate), 5 = HSK 5–6 and 7 = HSK 7–9 (advanced).
 */
export interface HskkQuestion {
  zh: string;
  en: string;
  ru: string;
}

export const HSKK_QUESTIONS: Record<1 | 3 | 5 | 7, HskkQuestion[]> = {
  1: [
    { zh: "你叫什么名字？", en: "What is your name?", ru: "Как вас зовут?" },
    { zh: "你是哪国人？", en: "Which country are you from?", ru: "Из какой вы страны?" },
    { zh: "你家有几口人？", en: "How many people are in your family?", ru: "Сколько человек в вашей семье?" },
    { zh: "你今天几点起床？", en: "What time did you get up today?", ru: "Во сколько вы сегодня встали?" },
    { zh: "你喜欢吃什么？", en: "What do you like to eat?", ru: "Что вы любите есть?" },
    { zh: "你的生日是几月几号？", en: "When is your birthday?", ru: "Когда у вас день рождения?" },
    { zh: "你每天怎么去学校或者公司？", en: "How do you get to school or work every day?", ru: "Как вы каждый день добираетесь до учёбы или работы?" },
    { zh: "周末你常常做什么？", en: "What do you usually do at the weekend?", ru: "Что вы обычно делаете в выходные?" },
    { zh: "你为什么学习汉语？", en: "Why are you learning Chinese?", ru: "Почему вы изучаете китайский?" },
    { zh: "今天天气怎么样？", en: "What is the weather like today?", ru: "Какая сегодня погода?" },
    { zh: "你有没有中国朋友？", en: "Do you have any Chinese friends?", ru: "У вас есть китайские друзья?" },
    { zh: "你喜欢什么运动？", en: "What sport do you like?", ru: "Какой спорт вам нравится?" },
  ],
  3: [
    { zh: "请介绍一下你最好的朋友。", en: "Describe your best friend.", ru: "Расскажите о своём лучшем друге." },
    { zh: "你觉得学习汉语最难的是什么？为什么？", en: "What do you find hardest about learning Chinese, and why?", ru: "Что для вас самое трудное в изучении китайского и почему?" },
    { zh: "你最喜欢哪个季节？为什么？", en: "Which season do you like most, and why?", ru: "Какое время года вам нравится больше всего и почему?" },
    { zh: "说一说你上一次旅行的经历。", en: "Talk about your last trip.", ru: "Расскажите о своей последней поездке." },
    { zh: "你平时怎么放松自己？", en: "How do you usually relax?", ru: "Как вы обычно отдыхаете и расслабляетесь?" },
    { zh: "你觉得在网上买东西好不好？", en: "Is shopping online a good thing, in your opinion?", ru: "Как вы считаете, покупать в интернете — это хорошо?" },
    { zh: "如果你有一个月的假期，你打算做什么？", en: "If you had a month off, what would you do?", ru: "Если бы у вас был месяц отпуска, что бы вы делали?" },
    { zh: "你认为什么样的工作是好工作？", en: "What makes a job a good job?", ru: "Какую работу вы считаете хорошей?" },
    { zh: "介绍一下你住的城市。", en: "Describe the city you live in.", ru: "Расскажите о городе, в котором вы живёте." },
    { zh: "你觉得运动对身体有什么好处？", en: "How does exercise benefit your health?", ru: "Какую пользу спорт приносит здоровью?" },
    { zh: "你小时候最喜欢做什么？", en: "What did you like doing most as a child?", ru: "Что вы больше всего любили делать в детстве?" },
    { zh: "手机给我们的生活带来了哪些变化？", en: "How have mobile phones changed our lives?", ru: "Как мобильные телефоны изменили нашу жизнь?" },
  ],
  5: [
    { zh: "有人说“失败是成功之母”，你怎么看？", en: "Some say failure is the mother of success. What do you think?", ru: "Говорят, что неудача — мать успеха. Что вы думаете?" },
    { zh: "你认为年轻人应该先工作还是先读研究生？", en: "Should young people start work or do a master's degree first?", ru: "Молодым людям лучше сразу работать или сначала учиться в магистратуре?" },
    { zh: "城市生活和农村生活各有什么优点和缺点？", en: "What are the pros and cons of city and country life?", ru: "Каковы плюсы и минусы жизни в городе и в деревне?" },
    { zh: "你怎么看待网络对孩子的影响？", en: "How do you view the internet's influence on children?", ru: "Как вы оцениваете влияние интернета на детей?" },
    { zh: "谈谈你对环境保护的看法。", en: "Give your views on environmental protection.", ru: "Расскажите, что вы думаете об охране окружающей среды." },
    { zh: "一个人的成功主要靠努力还是机会？", en: "Does success depend more on effort or on opportunity?", ru: "Успех зависит больше от усилий или от возможностей?" },
    { zh: "你认为读书和旅行，哪个更能让人成长？", en: "Which helps people grow more: reading or travel?", ru: "Что больше помогает человеку расти: чтение или путешествия?" },
    { zh: "说说你遇到过的一次困难，以及你是怎么解决的。", en: "Describe a difficulty you faced and how you solved it.", ru: "Расскажите о трудности, с которой вы столкнулись, и как вы её решили." },
    { zh: "你觉得工作中最重要的能力是什么？", en: "What is the most important skill at work?", ru: "Какое умение важнее всего в работе?" },
    { zh: "很多人喜欢在网上分享生活，你怎么看？", en: "Many people share their lives online. What do you think of that?", ru: "Многие делятся своей жизнью в интернете. Как вы к этому относитесь?" },
  ],
  7: [
    { zh: "人工智能的发展会给就业带来哪些影响？请谈谈你的观点。", en: "How will AI affect employment? Give your view.", ru: "Как развитие искусственного интеллекта повлияет на занятость? Выскажите своё мнение." },
    { zh: "有人认为传统文化应该保持原样，也有人认为应该创新。你怎么看？", en: "Should traditional culture be preserved as it is or renewed?", ru: "Нужно ли сохранять традиционную культуру неизменной или обновлять её?" },
    { zh: "请比较一下线上教育和线下教育的利弊。", en: "Compare the pros and cons of online and in-person education.", ru: "Сравните плюсы и минусы онлайн- и очного обучения." },
    { zh: "城市化进程中，如何平衡经济发展和环境保护？", en: "How can urbanisation balance growth and environmental protection?", ru: "Как при урбанизации найти баланс между экономикой и охраной природы?" },
    { zh: "你如何看待“内卷”这一社会现象？", en: "What do you make of the social phenomenon of 'involution'?", ru: "Как вы оцениваете социальное явление «инволюции» (内卷)?" },
    { zh: "全球化对一个国家的语言和文化有什么影响？", en: "How does globalisation affect a country's language and culture?", ru: "Как глобализация влияет на язык и культуру страны?" },
    { zh: "请谈谈终身学习的必要性。", en: "Discuss why lifelong learning is necessary.", ru: "Расскажите, почему необходимо учиться всю жизнь." },
    { zh: "社交媒体是拉近了人与人之间的距离，还是让人更加孤独？", en: "Does social media bring people closer or make them lonelier?", ru: "Социальные сети сближают людей или делают их более одинокими?" },
  ],
};

export const hskkBand = (level: number): 1 | 3 | 5 | 7 => (level >= 7 ? 7 : level >= 5 ? 5 : level >= 3 ? 3 : 1);
