import {organizationCopy} from './organizationCopy.js';
const entries=[
 ['Roster unavailable','सदस्य सूची उपलब्ध नहीं','সদস্য তালিকা অনুপলব্ধ'],
 ['Cohorts','समूह','দল'],['Create cohort','समूह बनाएँ','দল তৈরি করুন'],['Edit cohort','समूह बदलें','দল সম্পাদনা করুন'],['Opening organization…','संगठन खोल रहे हैं…','প্রতিষ্ঠান খোলা হচ্ছে…'],
 ['Give a connected group a shared purpose, without merging their personal work.','जुड़े हुए समूह को साझा उद्देश्य दें, निजी काम अलग रखें।','সংযুক্ত দলকে একটি যৌথ উদ্দেশ্য দিন, ব্যক্তিগত কাজ আলাদা রাখুন।'],
 ['Cohort saved. Membership does not grant access to personal learning.','समूह सहेजा गया। सदस्यता से निजी अध्ययन तक पहुँच नहीं मिलती।','দল সংরক্ষিত হয়েছে। সদস্যপদ ব্যক্তিগত শিক্ষায় প্রবেশাধিকার দেয় না।'],
 ['Loading accepted members and linked classes…','स्वीकृत सदस्य और जुड़ी कक्षाएँ पढ़ रहे हैं…','গৃহীত সদস্য ও সংযুক্ত ক্লাস পড়া হচ্ছে…'],
 ['{members} accepted members · {classes} explicitly linked classes.','{members} स्वीकृत सदस्य · {classes} स्पष्ट रूप से जुड़ी कक्षाएँ।','{members} গৃহীত সদস্য · {classes} স্পষ্টভাবে সংযুক্ত ক্লাস।'],
 ['{status} · {members} connected members · {classes} linked classes','{status} · {members} जुड़े सदस्य · {classes} जुड़ी कक्षाएँ','{status} · {members} সংযুক্ত সদস্য · {classes} সংযুক্ত ক্লাস'],
 ['Manage people','लोगों को व्यवस्थित करें','সদস্য পরিচালনা করুন'],['Refresh roster','सदस्य सूची फिर से पढ़ें','সদস্য তালিকা আবার পড়ুন'],['Search cohorts','समूह खोजें','দল খুঁজুন'],['Restore','वापस लाएँ','ফিরিয়ে আনুন'],['Archive','संग्रह में रखें','আর্কাইভ করুন'],
 ['No matching cohorts','कोई मिलते समूह नहीं','কোনো মিলে যাওয়া দল নেই'],['Start with one learning group','एक अध्ययन समूह से शुरू करें','একটি শেখার দল দিয়ে শুরু করুন'],['Connect people, choose a clear purpose, and link the classes that support it.','लोगों को जोड़ें, स्पष्ट उद्देश्य चुनें और सहायक कक्षाएँ जोड़ें।','সদস্যদের সংযুক্ত করুন, স্পষ্ট উদ্দেশ্য বাছুন ও সহায়ক ক্লাস যুক্ত করুন।'],
 ['Only accepted members and explicitly organization-linked classes are available. No private notes or conversations are included.','केवल स्वीकृत सदस्य और संगठन से स्पष्ट रूप से जुड़ी कक्षाएँ उपलब्ध हैं। निजी नोट्स और बातचीत शामिल नहीं हैं।','শুধু গৃহীত সদস্য ও প্রতিষ্ঠানের সঙ্গে স্পষ্টভাবে যুক্ত ক্লাস উপলব্ধ। ব্যক্তিগত নোট বা কথোপকথন নেই।'],
 ['Name','नाम','নাম'],['Purpose and curriculum objectives','उद्देश्य और पाठ्यक्रम के लक्ष्य','উদ্দেশ্য ও পাঠ্যক্রমের লক্ষ্য'],['Connected people','जुड़े लोग','সংযুক্ত সদস্য'],['Linked classes','जुड़ी कक्षाएँ','সংযুক্ত ক্লাস'],
 ['Invite people and wait for acceptance in People.','लोग अनुभाग में निमंत्रण दें और स्वीकृति की प्रतीक्षा करें।','সদস্য বিভাগে আমন্ত্রণ দিন ও গ্রহণের অপেক্ষা করুন।'],
 ['no longer connected — remove to save','अब जुड़ा नहीं है — सहेजने के लिए हटाएँ','আর সংযুক্ত নয় — সংরক্ষণ করতে সরান'],
 ['An accepted teacher can link a class when creating it.','स्वीकृत शिक्षक कक्षा बनाते समय उसे जोड़ सकता है।','গৃহীত শিক্ষক ক্লাস তৈরির সময় সংযুক্ত করতে পারেন।'],
 ['Previously linked class · no longer available — remove to save','पहले जुड़ी कक्षा · अब उपलब्ध नहीं — सहेजने के लिए हटाएँ','আগে সংযুক্ত ক্লাস · আর উপলব্ধ নয় — সংরক্ষণ করতে সরান'],
 ['Saving…','सहेज रहे हैं…','সংরক্ষণ হচ্ছে…'],['Save cohort','समूह सहेजें','দল সংরক্ষণ করুন'],['draft','ड्राफ़्ट','খসড়া'],['archived','संग्रह में','আর্কাইভ করা'],
 ['Unsaved cohort edits recovered. Review the current roster before saving.','समूह के असहेजे बदलाव वापस मिले। सहेजने से पहले वर्तमान सदस्य सूची देखें।','দলের অসংরক্ষিত পরিবর্তন উদ্ধার হয়েছে। সংরক্ষণের আগে বর্তমান সদস্য তালিকা দেখুন।'],
 ['This cohort changed in another tab. Your edits remain available to export.','दूसरे टैब में यह समूह बदला गया। आपके बदलाव निर्यात किए जा सकते हैं।','অন্য ট্যাবে এই দল পরিবর্তিত হয়েছে। আপনার পরিবর্তন রপ্তানি করা যাবে।'],
 ['Export cohort edits','समूह के बदलाव निर्यात करें','দলের পরিবর্তন রপ্তানি করুন'],['Load latest cohort and discard edits','नवीनतम समूह पढ़ें और बदलाव हटाएँ','সর্বশেষ দল পড়ুন ও পরিবর্তন বাতিল করুন'],
 ['Latest cohort loaded; this tab’s edits discarded.','नवीनतम समूह पढ़ा गया; इस टैब के बदलाव हटाए गए।','সর্বশেষ দল পড়া হয়েছে; এই ট্যাবের পরিবর্তন বাতিল হয়েছে।'],
 ['Current cohort edits exported. This does not save or share them.','वर्तमान समूह के बदलाव निर्यात किए गए। इससे वे सहेजे या साझा नहीं होते।','বর্তমান দলের পরিবর্তন রপ্তানি হয়েছে। এতে সেগুলি সংরক্ষিত বা ভাগ হয় না।'],
];
export const cohortCopy=locale=>(key,params={})=>{
 const row=entries.find(entry=>entry[0]===key);
 const value=row?row[locale==='hi'?1:locale==='bn'?2:0]:organizationCopy(locale,key);
 return value.replace(/\{(\w+)\}/g,(match,name)=>String(params[name]??match));
};
