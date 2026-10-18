// Interface copy is independent of the requested speech language. Native review remains required.
const entries = [
  ['Microphone idle. Text is always available.','माइक्रोफ़ोन बंद है। लिखकर बात करना हमेशा उपलब्ध है।','মাইক্রোফোন বন্ধ। লিখে কথা বলা সবসময় উপলব্ধ।'],
  ['Listening.','सुन रहे हैं।','শুনছি।'],
  ['Speaking.','बोल रहे हैं।','বলছি।'],
  ['Microphone access is blocked in the browser. Audio is unavailable until it is allowed.','ब्राउज़र में माइक्रोफ़ोन की अनुमति बंद है। अनुमति मिलने तक ऑडियो उपलब्ध नहीं है।','ব্রাউজারে মাইক্রোফোনের অনুমতি বন্ধ। অনুমতি না দেওয়া পর্যন্ত অডিও অনুপলব্ধ।'],
  ['This browser does not support audio interaction. Text works everywhere.','यह ब्राउज़र ऑडियो से बातचीत का समर्थन नहीं करता। लिखकर बात कर सकते हैं।','এই ব্রাউজারে অডিও কথোপকথন সমর্থিত নয়। লিখে কথা বলতে পারেন।'],
  ['Audio interaction is off. The animation is only an availability indicator; the microphone is not active.','ऑडियो से बातचीत बंद है। ऐनिमेशन केवल उपलब्धता का संकेत है; माइक्रोफ़ोन चालू नहीं है।','অডিও কথোপকথন বন্ধ। অ্যানিমেশন শুধু উপলব্ধতার নির্দেশক; মাইক্রোফোন চালু নয়।'],
  ['Audio off','ऑडियो बंद','অডিও বন্ধ'],['Listening','सुन रहे हैं','শুনছি'],['Speaking','बोल रहे हैं','বলছি'],['Microphone blocked','माइक्रोफ़ोन की अनुमति बंद','মাইক্রোফোনের অনুমতি বন্ধ'],['Ready for voice','बोलने के लिए तैयार','কথা বলার জন্য প্রস্তুত'],['Text available','लिखकर बात करें','লিখে কথা বলুন'],
  ['Open Visionary voice panel. {presence}. {status}.','Visionary का आवाज़ पैनल खोलें। {presence}। {status}।','Visionary ভয়েস প্যানেল খুলুন। {presence}। {status}।'],
  ['Guide','मार्गदर्शक','পথপ্রদর্শক'],['Your voice presence','आपकी आवाज़ का साथी','আপনার কণ্ঠের সঙ্গী'],['Close voice panel','आवाज़ पैनल बंद करें','ভয়েস প্যানেল বন্ধ করুন'],
  ['Vision Boy and Vision Girl are two visual styles for the same Guide. Your learning and conversations stay together.','Vision Boy और Vision Girl एक ही मार्गदर्शक के दो दृश्य रूप हैं। आपकी पढ़ाई और बातचीत साथ रहती हैं।','Vision Boy ও Vision Girl একই পথপ্রদর্শকের দুটি দৃশ্যরূপ। আপনার শেখা ও কথোপকথন একসঙ্গে থাকে।'],
  ['Voice input unavailable','आवाज़ से प्रश्न उपलब्ध नहीं','কথা বলে প্রশ্ন করা অনুপলব্ধ'],['Stop voice session','आवाज़ सत्र रोकें','ভয়েস সেশন থামান'],['Retry microphone','माइक्रोफ़ोन फिर आज़माएँ','মাইক্রোফোন আবার চেষ্টা করুন'],['Start listening','सुनना शुरू करें','শোনা শুরু করুন'],['Turn audio off','ऑडियो बंद करें','অডিও বন্ধ করুন'],['Turn audio on','ऑडियो चालू करें','অডিও চালু করুন'],['Use text instead','इसके बजाय लिखकर बात करें','এর বদলে লিখে কথা বলুন'],
  ['Preparing your reply. Stop the session to cancel.','आपका जवाब तैयार हो रहा है। रद्द करने के लिए सत्र रोकें।','আপনার উত্তর তৈরি হচ্ছে। বাতিল করতে সেশন থামান।'],['Hearing:','सुन रहे हैं:','শুনছি:'],
  ['Review spoken question','बोले गए प्रश्न की समीक्षा करें','বলা প্রশ্ন পর্যালোচনা করুন'],
  ['Review or edit your words before sending. Speech is not sent automatically.','भेजने से पहले अपने शब्दों की समीक्षा या संपादन करें। आवाज़ अपने आप नहीं भेजी जाती।','পাঠানোর আগে আপনার কথাগুলি পর্যালোচনা বা সম্পাদনা করুন। কথা নিজে থেকে পাঠানো হয় না।'],
  ['Editing stops listening. Start listening again to add more words.','संपादन करने पर सुनना रुक जाता है। और शब्द जोड़ने के लिए फिर सुनना शुरू करें।','সম্পাদনা করলে শোনা থেমে যায়। আরও কথা যোগ করতে আবার শোনা শুরু করুন।'],
  ['Preparing reply…','जवाब तैयार हो रहा है…','উত্তর তৈরি হচ্ছে…'],['Send spoken question','बोला गया प्रश्न भेजें','বলা প্রশ্ন পাঠান'],['Visual presence','दृश्य रूप','দৃশ্যরূপ'],
  ['Voice uses this browser. Teaching AI is not connected in the local preview.','आवाज़ इस ब्राउज़र का उपयोग करती है। स्थानीय पूर्वावलोकन में शिक्षण AI जुड़ा नहीं है।','ভয়েস এই ব্রাউজার ব্যবহার করে। স্থানীয় প্রিভিউতে শিক্ষাদানের AI সংযুক্ত নয়।'],
  ['The reply is saved in Ask. Spoken output is unavailable; you can read it by text.','जवाब Ask में सहेजा गया है। बोलकर सुनाना उपलब्ध नहीं है; आप उसे पढ़ सकते हैं।','উত্তর Ask-এ সংরক্ষিত। শোনানো অনুপলব্ধ; আপনি লিখিত উত্তর পড়তে পারেন।'],
  ['The spoken request could not be sent.','बोला गया प्रश्न भेजा नहीं जा सका।','বলা প্রশ্ন পাঠানো যায়নি।'],['Your words are saved in Ask.','आपके शब्द Ask में सहेजे गए हैं।','আপনার কথা Ask-এ সংরক্ষিত।'],['Keep or copy your words from the review field.','समीक्षा वाले क्षेत्र में अपने शब्द रखें या कॉपी करें।','পর্যালোচনার ঘরে আপনার কথা রাখুন বা কপি করুন।'],
  ['Microphone unavailable. You can keep using text.','माइक्रोफ़ोन उपलब्ध नहीं है। लिखकर बात कर सकते हैं।','মাইক্রোফোন অনুপলব্ধ। লিখে কথা বলতে পারেন।'],
  ['Visual presence updated. Your conversations and learning stay together.','दृश्य रूप बदला गया। आपकी बातचीत और पढ़ाई साथ रहती हैं।','দৃশ্যরূপ বদলেছে। আপনার কথোপকথন ও শেখা একসঙ্গে থাকে।'],['The visual preference could not be saved.','दृश्य रूप की पसंद सहेजी नहीं जा सकी।','দৃশ্যরূপের পছন্দ সংরক্ষণ করা যায়নি।'],
  ['Voice input could not resume. Retry the microphone or use text.','आवाज़ से प्रश्न फिर शुरू नहीं हो सका। माइक्रोफ़ोन फिर आज़माएँ या लिखकर बात करें।','কথা বলে প্রশ্ন করা আবার শুরু হয়নি। মাইক্রোফোন আবার চেষ্টা করুন বা লিখে কথা বলুন।'],
  ['Microphone access is blocked. Allow it in the browser and retry, or use text.','माइक्रोफ़ोन की अनुमति बंद है। ब्राउज़र में अनुमति देकर फिर आज़माएँ या लिखकर बात करें।','মাইক্রোফোনের অনুমতি বন্ধ। ব্রাউজারে অনুমতি দিয়ে আবার চেষ্টা করুন বা লিখে কথা বলুন।'],
  ['Voice input was interrupted. Retry the microphone or use text.','आवाज़ से प्रश्न बीच में रुक गया। माइक्रोफ़ोन फिर आज़माएँ या लिखकर बात करें।','কথা বলে প্রশ্ন করা থেমে গেছে। মাইক্রোফোন আবার চেষ্টা করুন বা লিখে কথা বলুন।'],
  ['This browser does not support voice input. You can keep using text.','यह ब्राउज़र आवाज़ से प्रश्न का समर्थन नहीं करता। लिखकर बात कर सकते हैं।','এই ব্রাউজারে কথা বলে প্রশ্ন করা সমর্থিত নয়। লিখে কথা বলতে পারেন।'],
  ['The microphone could not start. Retry voice input or use text.','माइक्रोफ़ोन चालू नहीं हो सका। आवाज़ फिर आज़माएँ या लिखकर बात करें।','মাইক্রোফোন চালু হয়নি। আবার চেষ্টা করুন বা লিখে কথা বলুন।'],
];
const map = Object.fromEntries(entries.map(([en, hi, bn]) => [en, { en, hi, bn }]));
export const voiceCopy = locale => (key, params = {}) => (map[key]?.[locale] || key).replace(/\{(\w+)\}/g, (match, name) => String(params[name] ?? match));
// Unknown runtime errors remain English and are tagged explicitly rather than relabeled.
export const voiceCopyLocale = (locale, key) => map[key]?.[locale] ? locale : 'en';
