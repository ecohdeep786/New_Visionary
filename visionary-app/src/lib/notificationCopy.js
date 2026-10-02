const translations = {
 hi: {
  'Notifications':'सूचनाएँ',
  'Updates saved in this workspace. No email, push or scheduled delivery is connected.':'इस कार्यक्षेत्र में सहेजे गए अपडेट। ईमेल, पुश या निर्धारित सूचना सेवा जुड़ी नहीं है।',
  'Summary preference':'सारांश की प्राथमिकता', 'Summary frequency':'सारांश की आवृत्ति',
  'Preference saved on this device. No delivery has been scheduled.':'प्राथमिकता इस उपकरण पर सहेजी गई। कोई सूचना भेजना निर्धारित नहीं किया गया है।',
  'Off':'बंद', 'Weekly':'साप्ताहिक', 'Daily':'दैनिक', 'Urgent only':'केवल आवश्यक',
  'Saved updates':'सहेजे गए अपडेट', 'Show updates':'अपडेट दिखाएँ', 'All updates':'सभी अपडेट', 'Unread only':'केवल अपठित',
  'Read':'पठित', 'Unread':'अपठित', 'Open update':'अपडेट खोलें', 'Mark read':'पठित चिह्नित करें',
  'Update marked read on this device.':'अपडेट इस उपकरण पर पठित चिह्नित किया गया।',
  'No unread updates':'कोई अपठित अपडेट नहीं', 'You’re up to date':'आप सभी अपडेट देख चुके हैं',
  'Your saved history remains available.':'आपका सहेजा गया इतिहास उपलब्ध है।', 'Relevant updates will appear here.':'संबंधित अपडेट यहाँ दिखाई देंगे।',
  'Show all updates':'सभी अपडेट दिखाएँ', 'Open Home':'होम खोलें',
 },
 bn: {
  'Notifications':'বিজ্ঞপ্তি',
  'Updates saved in this workspace. No email, push or scheduled delivery is connected.':'এই কর্মক্ষেত্রে সংরক্ষিত আপডেট। ইমেল, পুশ বা নির্ধারিত বিজ্ঞপ্তি পরিষেবা যুক্ত নেই।',
  'Summary preference':'সারাংশের পছন্দ', 'Summary frequency':'সারাংশের ব্যবধান',
  'Preference saved on this device. No delivery has been scheduled.':'পছন্দ এই ডিভাইসে সংরক্ষিত হয়েছে। কোনো বিজ্ঞপ্তি পাঠানোর সময় নির্ধারণ করা হয়নি।',
  'Off':'বন্ধ', 'Weekly':'সাপ্তাহিক', 'Daily':'দৈনিক', 'Urgent only':'শুধু জরুরি',
  'Saved updates':'সংরক্ষিত আপডেট', 'Show updates':'আপডেট দেখান', 'All updates':'সব আপডেট', 'Unread only':'শুধু অপঠিত',
  'Read':'পঠিত', 'Unread':'অপঠিত', 'Open update':'আপডেট খুলুন', 'Mark read':'পঠিত হিসেবে চিহ্নিত করুন',
  'Update marked read on this device.':'আপডেট এই ডিভাইসে পঠিত হিসেবে চিহ্নিত হয়েছে।',
  'No unread updates':'কোনো অপঠিত আপডেট নেই', 'You’re up to date':'আপনি সব আপডেট দেখেছেন',
  'Your saved history remains available.':'আপনার সংরক্ষিত ইতিহাস উপলব্ধ আছে।', 'Relevant updates will appear here.':'প্রাসঙ্গিক আপডেট এখানে দেখা যাবে।',
  'Show all updates':'সব আপডেট দেখান', 'Open Home':'হোম খুলুন',
 },
};
export const notificationCopy = locale => value => translations[locale]?.[value] || value;
