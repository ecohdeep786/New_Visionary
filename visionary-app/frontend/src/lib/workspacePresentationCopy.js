const labels = {
  en: {
    about: 'About this workspace', guidance: 'How it works', more: 'More options',
    teacher: 'Classroom overview', parent: 'Family overview',
    professional: 'Career overview', organization: 'Organization overview',
    learn: 'Learning options', projects: 'Ways to start', profile: 'Profile details',
    support: 'Browse help topics', preferences: 'Summary preference',
    local: 'Local learning preview',
  },
  hi: {
    about: 'इस कार्यक्षेत्र के बारे में', guidance: 'यह कैसे काम करता है', more: 'अन्य विकल्प',
    teacher: 'कक्षा का अवलोकन', parent: 'परिवार का अवलोकन',
    professional: 'करियर का अवलोकन', organization: 'संगठन का अवलोकन',
    learn: 'अध्ययन के विकल्प', projects: 'शुरू करने के तरीके', profile: 'प्रोफ़ाइल का विवरण',
    support: 'सहायता के विषय देखें', preferences: 'सारांश की प्राथमिकता',
    local: 'स्थानीय अध्ययन पूर्वावलोकन',
  },
  bn: {
    about: 'এই কর্মক্ষেত্র সম্পর্কে', guidance: 'যেভাবে কাজ করে', more: 'আরও বিকল্প',
    teacher: 'শ্রেণিকক্ষের সারাংশ', parent: 'পরিবারের সারাংশ',
    professional: 'কর্মজীবনের সারাংশ', organization: 'প্রতিষ্ঠানের সারাংশ',
    learn: 'শেখার বিকল্প', projects: 'শুরু করার উপায়', profile: 'প্রোফাইলের বিবরণ',
    support: 'সাহায্যের বিষয় দেখুন', preferences: 'সারাংশের পছন্দ',
    local: 'স্থানীয় শেখার প্রিভিউ',
  },
};
export function workspacePresentationCopy(locale = 'en') {
  const copy = labels[locale] || labels.en;
  return key => copy[key] || labels.en[key] || key;
}
