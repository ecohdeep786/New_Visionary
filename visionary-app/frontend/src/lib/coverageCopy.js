const rows = [
  ['Learning coverage', 'अध्ययन सामग्री की उपलब्धता', 'শেখার বিষয়বস্তুর উপলব্ধতা'],
  ['Checking learning coverage…', 'अध्ययन सामग्री की उपलब्धता जाँची जा रही है…', 'শেখার বিষয়বস্তুর উপলব্ধতা যাচাই করা হচ্ছে…'],
  ['Learning coverage is unavailable. Your selections are unchanged.', 'अध्ययन सामग्री की उपलब्धता की पुष्टि नहीं हो सकी। आपके विकल्प सुरक्षित हैं।', 'শেখার বিষয়বস্তুর উপলব্ধতা যাচাই করা যায়নি। আপনার নির্বাচন অপরিবর্তিত আছে।'],
  ['Retry coverage', 'उपलब्धता फिर जाँचें', 'আবার উপলব্ধতা যাচাই করুন'],
  ['See all learning categories', 'अध्ययन की सभी श्रेणियाँ देखें', 'শেখার সব বিভাগ দেখুন'],
  ['No qualified sources published', 'अभी कोई सत्यापित स्रोत प्रकाशित नहीं है', 'এখনও কোনো যাচাইকৃত উৎস প্রকাশিত হয়নি'],
  ['Exact source check required', 'सटीक स्रोत की जाँच आवश्यक है', 'নির্দিষ্ট উৎস যাচাই করা প্রয়োজন'],
  ['Primary', 'प्राथमिक', 'প্রাথমিক'], ['Secondary', 'माध्यमिक', 'মাধ্যমিক'], ['Higher secondary', 'उच्च माध्यमिक', 'উচ্চমাধ্যমিক'],
  ['Competitive exams', 'प्रतियोगी परीक्षाएँ', 'প্রতিযোগিতামূলক পরীক্ষা'], ['Vocational', 'व्यावसायिक प्रशिक्षण', 'বৃত্তিমূলক প্রশিক্ষণ'],
  ['Higher education', 'उच्च शिक्षा', 'উচ্চশিক্ষা'], ['Independent adult learning', 'वयस्कों का स्वतंत्र अध्ययन', 'প্রাপ্তবয়স্কদের স্বাধীন শিক্ষা'],
  ['Professional', 'पेशेवर अध्ययन', 'পেশাগত শিক্ষা'], ['Employer sponsored', 'नियोक्ता द्वारा प्रायोजित', 'নিয়োগকর্তার সহায়তায় শিক্ষা'],
  ['This account needs setup before learning coverage can be checked.', 'अध्ययन सामग्री की उपलब्धता जाँचने से पहले खाता सेटअप पूरा करें।', 'শেখার বিষয়বস্তুর উপলব্ধতা যাচাইয়ের আগে অ্যাকাউন্ট সেটআপ সম্পূর্ণ করুন।'],
  ['Verified guardian admission is required. Choosing an age or role does not activate access.', 'सत्यापित अभिभावक प्रवेश आवश्यक है। आयु या भूमिका चुनने से पहुँच सक्रिय नहीं होती।', 'যাচাইকৃত অভিভাবক অনুমোদন প্রয়োজন। বয়স বা ভূমিকা বেছে নিলে প্রবেশাধিকার সক্রিয় হয় না।'],
  ['Shared learning needs a verified connection. Your personal account does not grant access to another person’s learning.', 'साझा अध्ययन के लिए सत्यापित संबंध आवश्यक है। आपका व्यक्तिगत खाता किसी दूसरे व्यक्ति के अध्ययन तक पहुँच नहीं देता।', 'ভাগ করা শিক্ষার জন্য যাচাইকৃত সংযোগ প্রয়োজন। আপনার ব্যক্তিগত অ্যাকাউন্ট অন্য কারও শিক্ষায় প্রবেশাধিকার দেয় না।'],
  ['Learning sources have not been released for this context yet. Saved work and account features remain available.', 'इस संदर्भ के लिए अध्ययन स्रोत अभी जारी नहीं किए गए हैं। सहेजा काम और खाते की सुविधाएँ उपलब्ध हैं।', 'এই প্রসঙ্গের জন্য শেখার উৎস এখনও প্রকাশিত হয়নি। সংরক্ষিত কাজ ও অ্যাকাউন্টের সুবিধা উপলব্ধ আছে।'],
  ['Each source, edition, language and delivery mode needs its own coverage check. A listed category is not a support promise.', 'हर स्रोत, संस्करण, भाषा और माध्यम की उपलब्धता अलग से जाँची जाती है। सूची में श्रेणी होना समर्थन का वादा नहीं है।', 'প্রতিটি উৎস, সংস্করণ, ভাষা ও মাধ্যমের উপলব্ধতা আলাদাভাবে যাচাই করতে হয়। তালিকায় কোনো বিভাগ থাকলেই সহায়তার প্রতিশ্রুতি বোঝায় না।'],
];
export function coverageCopy(locale = 'en') { return text => rows.find(row => row[0] === text)?.[locale === 'hi' ? 1 : locale === 'bn' ? 2 : 0] || text; }

export const coverageCategoryLabels = { primary: 'Primary', secondary: 'Secondary', 'higher-secondary': 'Higher secondary', competitive: 'Competitive exams', vocational: 'Vocational', 'higher-education': 'Higher education', 'independent-adult': 'Independent adult learning', professional: 'Professional', 'employer-sponsored': 'Employer sponsored' };
