const entries = [
 ['Understanding check recorded', 'समझ की जाँच दर्ज हुई', 'বোঝাপড়ার যাচাই নথিভুক্ত হয়েছে'],
 ['Practice step recorded', 'अभ्यास का चरण दर्ज हुआ', 'অনুশীলনের ধাপ নথিভুক্ত হয়েছে'],
 ['Your attempt is saved', 'आपका प्रयास सहेजा गया', 'আপনার চেষ্টা সংরক্ষিত হয়েছে'],
 ['You answered this check correctly. Next, try the idea in guided practice.', 'आपने इस जाँच का सही उत्तर दिया। अब निर्देशित अभ्यास में इस विचार को आज़माएँ।', 'আপনি এই যাচাইয়ের সঠিক উত্তর দিয়েছেন। এবার নির্দেশিত অনুশীলনে ধারণাটি ব্যবহার করুন।'],
 ['You answered this practice step correctly. Use the idea in a project when you are ready.', 'आपने अभ्यास के इस चरण का सही उत्तर दिया। तैयार होने पर इस विचार को प्रोजेक्ट में इस्तेमाल करें।', 'আপনি অনুশীলনের এই ধাপের সঠিক উত্তর দিয়েছেন। প্রস্তুত হলে একটি প্রকল্পে ধারণাটি ব্যবহার করুন।'],
 ['This answer needs another look. Review the explanation or try a smaller step; your earlier recorded work is kept.', 'इस उत्तर पर फिर विचार करें। व्याख्या देखें या छोटा चरण आज़माएँ; आपका पहले दर्ज किया गया काम सुरक्षित है।', 'এই উত্তরটি আবার দেখুন। ব্যাখ্যা পড়ুন বা ছোট একটি ধাপ চেষ্টা করুন; আপনার আগের নথিভুক্ত কাজ রাখা হয়েছে।'],
 ['Your application is recorded', 'आपका अनुप्रयोग दर्ज है', 'আপনার প্রয়োগ নথিভুক্ত হয়েছে'],
 ['Put the idea to work', 'विचार को काम में लगाएँ', 'ধারণাটি কাজে লাগান'],
 ['Application details unavailable', 'अनुप्रयोग का विवरण उपलब्ध नहीं है', 'প্রয়োগের বিবরণ অনুপলব্ধ'],
 ['You saved a completed project for this concept. Revisit what you made and reflect on what you would improve.', 'आपने इस अवधारणा का पूरा प्रोजेक्ट सहेजा है। अपना बनाया काम देखें और सोचें कि उसमें क्या बेहतर कर सकते हैं।', 'আপনি এই ধারণার একটি সম্পূর্ণ প্রকল্প সংরক্ষণ করেছেন। নিজের তৈরি কাজ দেখুন এবং কী উন্নত করতে পারেন তা ভাবুন।'],
 ['Open your project to create something with this idea. Save your work and reflect on what you learned.', 'इस विचार से कुछ बनाने के लिए अपना प्रोजेक्ट खोलें। काम सहेजें और सोचें कि आपने क्या सीखा।', 'এই ধারণা দিয়ে কিছু তৈরি করতে নিজের প্রকল্প খুলুন। কাজ সংরক্ষণ করুন এবং কী শিখলেন তা নিয়ে ভাবুন।'],
 ['This saved activity has no project link. Return to your learning outline to choose your next step.', 'इस सहेजी गतिविधि में प्रोजेक्ट लिंक नहीं है। अगला चरण चुनने के लिए अपनी अध्ययन रूपरेखा पर लौटें।', 'এই সংরক্ষিত কার্যকলাপে প্রকল্পের লিঙ্ক নেই। পরের ধাপ বাছতে নিজের শেখার রূপরেখায় ফিরুন।'],
 ['Recorded steps', 'दर्ज चरण', 'নথিভুক্ত ধাপ'],
 ['Understanding checked', 'समझ जाँची गई', 'বোঝাপড়া যাচাই হয়েছে'],
 ['Practice checked', 'अभ्यास जाँचा गया', 'অনুশীলন যাচাই হয়েছে'],
 ['Application recorded', 'अनुप्रयोग दर्ज हुआ', 'প্রয়োগ নথিভুক্ত হয়েছে'],
 ['Next: create your project', 'अगला चरण: अपना प्रोजेक्ट बनाएँ', 'পরের ধাপ: নিজের প্রকল্প তৈরি করুন'],
 ['A saved application records your work; it is not an assessment of mastery.', 'सहेजा अनुप्रयोग आपके काम को दर्ज करता है; यह दक्षता का आकलन नहीं है।', 'সংরক্ষিত প্রয়োগ আপনার কাজ নথিভুক্ত করে; এটি দক্ষতার মূল্যায়ন নয়।'],
 ['Define an outcome, create an artifact, and reflect on the evidence.', 'एक परिणाम तय करें, अपनी रचना बनाएँ और उसके प्रमाण पर विचार करें।', 'একটি ফল ঠিক করুন, নিজের সৃষ্টি তৈরি করুন এবং প্রমাণ নিয়ে ভাবুন।']
];

export function learningMilestoneCopy(locale = 'en') {
 return text => entries.find(row => row[0] === text)?.[locale === 'hi' ? 1 : locale === 'bn' ? 2 : 0] || text;
}
