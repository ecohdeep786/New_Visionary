/* FHE-19: user-facing copy for the getting-started introduction dialog, en/hi/bn.
 * The dialog mounts in the connected production shell (ConnectedWorkspaceLayout)
 * and in the development preview home; both branch sets are translated so the
 * first-run experience is native in every shipped interface. Same pattern as
 * connectedSurfaceCopy: entries of [en, hi, bn], `{name}` interpolation,
 * English fallback (never a blank UI). */
const entries = [
	['Show getting started', 'परिचय देखें', 'পরিচিতি দেখুন'],
	['Getting started · {page} of 3', 'शुरुआत · {page} / 3', 'শুরু · {page} / ৩'],
	['Close introduction', 'परिचय बंद करें', 'পরিচিতি বন্ধ করুন'],
	// Screen 1
	['Welcome to Visionary', 'Visionary में आपका स्वागत है', 'Visionary-এ স্বাগতম'],
	['A place to learn, explore ideas and build what comes next. Here’s a quick look around.', 'सीखने, विचार तलाशने और आगे बनाने की जगह। आइए एक त्वरित नज़र डालें।', 'শেখা, ভাবনা খোঁজা আর সামনে তৈরি করার জায়গা। একটি দ্রুত দেখা নিন।'],
	// Screen 2
	['Find your next step', 'अपना अगला कदम खोजें', 'আপনার পরের ধাপ খুঁজুন'],
	['Home brings your next action together. Use the navigation to explore learning, tools and your saved activity.', 'होम आपका अगला काम एक जगह लाता है। नेविगेशन से सीखना, साधन और सहेजी गतिविधि देखें।', 'হোম আপনার পরের কাজ এক জায়গায় আনে। নেভিগেশন দিয়ে শেখা, সরঞ্জাম ও সংরক্ষিত কার্যকলাপ দেখুন।'],
	// Screen 3
	['You’re in control', 'नियंत्रण आपके हाथ में है', 'নিয়ন্ত্রণ আপনার হাতে'],
	['Your goals and your privacy belong to you. Review preferences and permissions whenever you need to.', 'आपके लक्ष्य और आपकी निजता आपकी हैं। जब चाहें, पसंद और अनुमतियाँ देखें।', 'আপনার লক্ষ্য ও গোপনীয়তা আপনার। দরকার হলে পছন্দ ও অনুমতি দেখুন।'],
	// Connected first step
	['Review your saved learning', 'अपनी सहेजी सीख देखें', 'সংরক্ষিত শেখা দেখুন'],
	['Check the learning sessions saved to your account.', 'अपने खाते में सहेजे सीख-सत्र देखें।', 'অ্যাকাউন্টে সংরক্ষিত শেখার সেশন দেখুন।'],
	['Open saved learning', 'सहेजी सीख खोलें', 'সংরক্ষিত শেখা খুলুন'],
	// Account card
	['Your Visionary account', 'आपका Visionary खाता', 'আপনার Visionary অ্যাকাউন্ট'],
	['Setup is saved to this account.', 'सेटअप इस खाते में सहेजा गया है।', 'সেটআপ এই অ্যাকাউন্টে সংরক্ষিত।'],
	// Screen 3 cards — connected branch
	['Make it yours', 'अपनी बनाएँ', 'নিজের মতো করুন'],
	['Review your account details.', 'अपने खाते का विवरण देखें।', 'আপনার অ্যাকাউন্টের বিবরণ দেখুন।'],
	['Review profile', 'प्रोफ़ाइल देखें', 'প্রোফাইল দেখুন'],
	['Keep sharing intentional', 'साझा करना जानबूझकर रखें', 'ভাগ করা ইচ্ছাধীন রাখুন'],
	['Private activity is never automatically shared.', 'निजी गतिविधि कभी स्वतः साझा नहीं होती।', 'ব্যক্তিগত কার্যকলাপ কখনো স্বয়ংক্রিয়ভাবে ভাগ হয় না।'],
	['Review account security', 'खाता सुरक्षा देखें', 'অ্যাকাউন্ট নিরাপত্তা দেখুন'],
	['Your account setup is saved online.', 'आपका खाता सेटअप ऑनलाइन सहेजा गया है।', 'আপনার অ্যাকাউন্ট সেটআপ অনলাইনে সংরক্ষিত।'],
	// Screen 3 cards — preview branch
	['Review learning preferences and languages.', 'सीखने की पसंद और भाषाएँ देखें।', 'শেখার পছন্দ ও ভাষা দেখুন।'],
	['Review preferences', 'पसंद देखें', 'পছন্দ দেখুন'],
	['Review privacy', 'निजता देखें', 'গোপনীয়তা দেখুন'],
	['This development workspace saves preview activity in this browser.', 'यह विकास कार्यक्षेत्र पूर्वावलोकन गतिविधि इस ब्राउज़र में सहेजता है।', 'এই ডেভেলপমেন্ট কর্মক্ষেত্র প্রিভিউ কার্যকলাপ এই ব্রাউজারে সংরক্ষণ করে।'],
	// Footer and flow
	['Skip introduction', 'परिचय छोड़ें', 'পরিচিতি এড়িয়ে যান'],
	['Back', 'पीछे', 'পিছনে'],
	['Start exploring', 'खोजना शुरू करें', 'অন্বেষণ শুরু করুন'],
	['Continue', 'जारी रखें', 'চালিয়ে যান'],
	['Saving…', 'सहेज रहे हैं…', 'সংরক্ষণ হচ্ছে…'],
	['We couldn’t save your introduction. Try again; your Visionary setup is safe.', 'आपका परिचय सहेजा नहीं जा सका। फिर प्रयास करें; आपका Visionary सेटअप सुरक्षित है।', 'আপনার পরিচিতি সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন; আপনার Visionary সেটআপ নিরাপদ।'],
	// Preview first steps (per role)
	['Start with something to learn', 'सीखने लायक कुछ से शुरू करें', 'শেখার কিছু দিয়ে শুরু করুন'],
	['Choose a subject or learning journey. Your own interests are a good starting point.', 'कोई विषय या सीखने की यात्रा चुनें। आपकी अपनी रुचियाँ अच्छी शुरुआत हैं।', 'একটি বিষয় বা শেখার যাত্রা বাছুন। নিজের আগ্রহই ভালো শুরু।'],
	['Explore learning', 'सीखना देखें', 'শেখা দেখুন'],
	['Turn an interest into a next step', 'रुचि को अगले कदम में बदलें', 'আগ্রহকে পরের ধাপে রূপ দিন'],
	['Explore a skill, a career goal or a project you want to build.', 'कोई कौशल, करियर लक्ष्य या बनाना चाहता प्रोजेक्ट देखें।', 'একটি দক্ষতা, কর্মজীবনের লক্ষ্য বা বানাতে চাওয়া প্রজেক্ট দেখুন।'],
	['Explore career goals', 'करियर लक्ष्य देखें', 'কর্মজীবনের লক্ষ্য দেখুন'],
	['Bring your next lesson to life', 'अपना अगला पाठ जीवंत बनाएँ', 'আপনার পরের পাঠ প্রাণবন্ত করুন'],
	['Prepare a lesson. Connect a class when you are ready to work with learners.', 'एक पाठ तैयार करें। विद्यार्थियों के साथ काम के लिए तैयार होने पर कक्षा जोड़ें।', 'একটি পাঠ প্রস্তুত করুন। শিক্ষার্থীদের সঙ্গে কাজের জন্য প্রস্তুত হলে ক্লাস যোগ করুন।'],
	['Open lesson preparation', 'पाठ तैयारी खोलें', 'পাঠ প্রস্তুতি খুলুন'],
	['Begin with a family connection', 'परिवार संबंध से शुरू करें', 'পারিবারিক সংযোগ দিয়ে শুরু করুন'],
	['An approved connection determines which child learning summaries you can see.', 'स्वीकृत संबंध तय करता है कि आप किस बच्चे के सीख-सार देख सकते हैं।', 'অনুমোদিত সংযোগ ঠিক করে কোন শিশুর শেখার সারাংশ আপনি দেখতে পাবেন।'],
	['Review family connections', 'परिवार संबंध देखें', 'পারিবারিক সংযোগ দেখুন'],
	['Get your organization ready', 'अपना संगठन तैयार करें', 'আপনার প্রতিষ্ঠান প্রস্তুত করুন'],
	['Review your organization details. People and access are configured separately.', 'अपने संगठन का विवरण देखें। सदस्य और पहुँच अलग से तय होते हैं।', 'আপনার প্রতিষ্ঠানের বিবরণ দেখুন। সদস্য ও প্রবেশাধিকার আলাদাভাবে কনফিগার হয়।'],
	['Open organization setup', 'संगठन सेटअप खोलें', 'প্রতিষ্ঠান সেটআপ খুলুন'],
];
const translations = Object.fromEntries(entries.map(([en, hi, bn]) => [en, { en, hi, bn }]));
export const gettingStartedCopy = locale => (value, params = {}) => (translations[value]?.[locale] || value).replace(/\{(\w+)\}/g, (token, key) => Object.hasOwn(params, key) ? String(params[key]) : token);
