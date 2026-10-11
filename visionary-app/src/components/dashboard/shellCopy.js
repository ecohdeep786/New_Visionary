const copy = {
  en: {
    skip: 'Skip to main content',
    offline: 'You’re offline. Saved records on this device are still available. External links need a connection.',
    online: 'Connection restored.',
    results: count => `${count} destinations shown.`,
  },
  hi: {
    skip: 'मुख्य सामग्री पर जाएँ',
    offline: 'आप ऑफ़लाइन हैं। इस डिवाइस पर सहेजे गए रिकॉर्ड उपलब्ध हैं। बाहरी लिंक के लिए इंटरनेट चाहिए।',
    online: 'इंटरनेट कनेक्शन वापस आ गया है।',
    results: count => `${count} परिणाम दिखाए गए हैं।`,
  },
  bn: {
    skip: 'মূল বিষয়বস্তুতে যান',
    offline: 'আপনি অফলাইনে আছেন। এই ডিভাইসে সংরক্ষিত রেকর্ড পাওয়া যাবে। বাইরের লিঙ্কের জন্য ইন্টারনেট দরকার।',
    online: 'ইন্টারনেট সংযোগ ফিরে এসেছে।',
    results: count => `${count}টি ফলাফল দেখানো হয়েছে।`,
  },
};

export function shellCopy(locale) {
  return copy[locale] || copy.en;
}
