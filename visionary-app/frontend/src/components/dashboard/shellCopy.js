const copy = {
  en: {
    skip: 'Skip to main content',
    offline: 'You’re offline. Saved records on this device are still available. External links need a connection.',
    online: 'Connection restored.',
    results: count => `${count} destinations shown.`,
    permissionDenied: 'Your current permission does not include this page. Choose another destination or ask the organization owner to review your access.',
  },
  hi: {
    skip: 'मुख्य सामग्री पर जाएँ',
    offline: 'आप ऑफ़लाइन हैं। इस डिवाइस पर सहेजे गए रिकॉर्ड उपलब्ध हैं। बाहरी लिंक के लिए इंटरनेट चाहिए।',
    online: 'इंटरनेट कनेक्शन वापस आ गया है।',
    results: count => `${count} परिणाम दिखाए गए हैं।`,
    permissionDenied: 'आपकी मौजूदा अनुमति में यह पृष्ठ शामिल नहीं है। दूसरा पृष्ठ चुनें या संगठन के मालिक से अपनी अनुमति की समीक्षा करने को कहें।',
  },
  bn: {
    skip: 'মূল বিষয়বস্তুতে যান',
    offline: 'আপনি অফলাইনে আছেন। এই ডিভাইসে সংরক্ষিত রেকর্ড পাওয়া যাবে। বাইরের লিঙ্কের জন্য ইন্টারনেট দরকার।',
    online: 'ইন্টারনেট সংযোগ ফিরে এসেছে।',
    results: count => `${count}টি ফলাফল দেখানো হয়েছে।`,
    permissionDenied: 'আপনার বর্তমান অনুমতিতে এই পৃষ্ঠা অন্তর্ভুক্ত নয়। অন্য একটি পৃষ্ঠা বেছে নিন বা প্রতিষ্ঠানের মালিককে আপনার অনুমতি পর্যালোচনা করতে বলুন।',
  },
};

export function shellCopy(locale) {
  return copy[locale] || copy.en;
}
