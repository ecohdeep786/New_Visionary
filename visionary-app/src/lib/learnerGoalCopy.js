import {projectCopy} from './projectCopy.js';
const entries = [
 ['My learning goals','मेरे सीखने के लक्ष्य','আমার শেখার লক্ষ্য'],
 ['Save what you want to work toward. Private notes stay in your learner workspace.','अपना लक्ष्य सहेजें। निजी नोट आपके शिक्षार्थी कार्यक्षेत्र में रहते हैं।','আপনার লক্ষ্য সংরক্ষণ করুন। ব্যক্তিগত নোট আপনার শিক্ষার্থীর কর্মক্ষেত্রে থাকে।'],
 ['Add a goal','लक्ष्य जोड़ें','লক্ষ্য যোগ করুন'],['Edit','संपादित करें','সম্পাদনা করুন'],['Parent sharing','अभिभावक के साथ साझा करें','অভিভাবকের সঙ্গে ভাগ করুন'],
 ['Private notes saved','निजी नोट सहेजे गए','ব্যক্তিগত নোট সংরক্ষিত'],['No private notes','कोई निजी नोट नहीं','ব্যক্তিগত নোট নেই'],['A parent summary was approved','अभिभावक के लिए सारांश मंज़ूर है','অভিভাবকের সারাংশ অনুমোদিত'],['Not shared with a parent','अभिभावक के साथ साझा नहीं','অভিভাবকের সঙ্গে ভাগ করা হয়নি'],
 ['No goal saved yet. Start with one concrete outcome you can revisit.','अभी कोई लक्ष्य नहीं। ऐसा ठोस परिणाम चुनें जिसकी फिर समीक्षा कर सकें।','এখনও লক্ষ্য সংরক্ষিত নেই। পরে পর্যালোচনা করতে পারবেন এমন একটি নির্দিষ্ট ফল দিয়ে শুরু করুন।'],
 ['Edit learning goal','सीखने का लक्ष्य संपादित करें','শেখার লক্ষ্য সম্পাদনা করুন'],['Add a learning goal','सीखने का लक्ष्य जोड़ें','শেখার লক্ষ্য যোগ করুন'],
 ['The goal and notes are private. Sharing a short parent summary is a separate action after saving.','लक्ष्य और नोट निजी हैं। सहेजने के बाद अभिभावक के साथ छोटा सारांश अलग से साझा करें।','লক্ষ্য ও নোট ব্যক্তিগত। সংরক্ষণের পরে অভিভাবকের সঙ্গে ছোট সারাংশ ভাগ করা আলাদা কাজ।'],
 ['Goal title','लक्ष्य का नाम','লক্ষ্যের নাম'],['Private notes','निजी नोट','ব্যক্তিগত নোট'],['For example, explain how my bridge model works','जैसे, मेरे पुल का मॉडल कैसे काम करता है','যেমন, আমার সেতুর মডেল কীভাবে কাজ করে বোঝানো'],['What will you try next?','आप आगे क्या आज़माएँगे?','এরপর কী চেষ্টা করবেন?'],['Save goal','लक्ष्य सहेजें','লক্ষ্য সংরক্ষণ করুন'],
 ['Learning goal saved privately on this device.','सीखने का लक्ष्य इस उपकरण पर निजी रूप से सहेजा गया।','শেখার লক্ষ্য এই ডিভাইসে ব্যক্তিগতভাবে সংরক্ষিত।'],
 ['Share a learning goal with a parent','अभिभावक के साथ सीखने का लक्ष्य साझा करें','অভিভাবকের সঙ্গে শেখার লক্ষ্য ভাগ করুন'],
 ['Select one parent and approve the exact short summary. Your private notes, projects and conversations are excluded. Active progress permission is required.','एक अभिभावक चुनें और सही छोटा सारांश मंज़ूर करें। निजी नोट, प्रोजेक्ट और बातचीत शामिल नहीं हैं। प्रगति साझा करने की सक्रिय अनुमति चाहिए।','একজন অভিভাবক বেছে নির্দিষ্ট ছোট সারাংশ অনুমোদন করুন। ব্যক্তিগত নোট, প্রকল্প ও কথোপকথন বাদ থাকে। প্রগতি ভাগ করার সক্রিয় অনুমতি দরকার।'],
 ['What do you want this parent to support?','इस अभिभावक से किस सहायता की अपेक्षा है?','এই অভিভাবকের কাছে কী সাহায্য চান?'],['Exact goal preview','लक्ष्य का सटीक पूर्वावलोकन','লক্ষ্যের নির্দিষ্ট প্রাকদর্শন'],['Confirm goal sharing','लक्ष्य साझा करने की पुष्टि करें','লক্ষ্য ভাগ করা নিশ্চিত করুন'],
 ['Previously approved summaries','पहले मंज़ूर किए गए सारांश','আগে অনুমোদিত সারাংশ'],['Currently accessible','अभी उपलब्ध','এখন দেখা যায়'],
 ['Goal summary shared. Later edits remain private until you share again.','लक्ष्य का सारांश साझा हुआ। फिर साझा करने तक आगे के बदलाव निजी रहेंगे।','লক্ষ্যের সারাংশ ভাগ করা হয়েছে। আবার ভাগ না করা পর্যন্ত পরের সম্পাদনা ব্যক্তিগত থাকবে।'],
 ['Goal summary sharing stopped. Your goal and private notes remain saved.','लक्ष्य का सारांश साझा करना बंद हुआ। लक्ष्य और निजी नोट सहेजे हैं।','লক্ষ্যের সারাংশ ভাগ করা বন্ধ হয়েছে। লক্ষ্য ও ব্যক্তিগত নোট সংরক্ষিত আছে।'],
 ['Goal records are unavailable. Original records and current edits are retained.','लक्ष्य के रिकॉर्ड उपलब्ध नहीं। मूल रिकॉर्ड और वर्तमान संपादन सुरक्षित हैं।','লক্ষ্যের রেকর্ড পাওয়া যাচ্ছে না। মূল রেকর্ড ও বর্তমান সম্পাদনা রাখা আছে।'],
 ['Retry goals','लक्ष्य फिर पढ़ें','লক্ষ্য আবার পড়ুন'],['Summary history unavailable','सारांश का इतिहास उपलब्ध नहीं','সারাংশের ইতিহাস পাওয়া যাচ্ছে না'],
 ['Saved summaries are unavailable. Original records and current edits are retained.','सहेजे गए सारांश उपलब्ध नहीं। मूल रिकॉर्ड और वर्तमान संपादन सुरक्षित हैं।','সংরক্ষিত সারাংশ পাওয়া যাচ্ছে না। মূল রেকর্ড ও বর্তমান সম্পাদনা রাখা আছে।'],
 ['Retry sharing','साझा करने की जानकारी फिर पढ़ें','ভাগ করার তথ্য আবার পড়ুন'],['Unsaved goal edits recovered. Save to keep them.','अधूरे लक्ष्य संपादन वापस मिले। रखने के लिए सहेजें।','অসমাপ্ত লক্ষ্য সম্পাদনা ফিরে এসেছে। রাখতে সংরক্ষণ করুন।'],
 ['Export goal edits','लक्ष्य संपादन निर्यात करें','লক্ষ্যের সম্পাদনা রপ্তানি করুন'],['Load saved goal and discard edits','सहेजा लक्ष्य पढ़ें और संपादन हटाएँ','সংরক্ষিত লক্ষ্য পড়ুন ও সম্পাদনা বাতিল করুন'],
 ['A newer goal is saved. Your edits remain here. Export them before loading the saved goal.','नया लक्ष्य सहेजा गया है। आपके संपादन यहाँ हैं। सहेजा लक्ष्य पढ़ने से पहले निर्यात करें।','নতুন লক্ষ্য সংরক্ষিত আছে। আপনার সম্পাদনা এখানে রাখা আছে। সংরক্ষিত লক্ষ্য পড়ার আগে রপ্তানি করুন।'],
 ['The goal was saved; its unreadable editor backup was retained.','लक्ष्य सहेजा गया; अपठनीय संपादक बैकअप रखा गया है।','লক্ষ্য সংরক্ষিত হয়েছে; অপাঠ্য সম্পাদনার ব্যাকআপ রাখা আছে।'],
 ['Export summary edits','सारांश संपादन निर्यात करें','সারাংশের সম্পাদনা রপ্তানি করুন'],['Unsaved summary recovered. Review the exact preview before sharing.','अधूरा सारांश वापस मिला। साझा करने से पहले सटीक पूर्वावलोकन देखें।','অসমাপ্ত সারাংশ ফিরে এসেছে। ভাগ করার আগে নির্দিষ্ট প্রাকদর্শন দেখুন।'],
];
const dictionary=Object.fromEntries(entries.map(([en,hi,bn])=>[en,{en,hi,bn}]));
export const learnerGoalCopy=locale=>(value,params={})=>{
 let text=dictionary[value]?.[locale]||projectCopy(locale)(value,params);
 for(const [key,replacement] of Object.entries(params)) text=text.replaceAll(`{${key}}`,String(replacement));
 return text;
};
