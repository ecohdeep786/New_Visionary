import {teacherCopy} from './teacherCopy.js';
const entries=[["Chapters and objectives","अध्याय और उद्देश्य","অধ্যায় ও উদ্দেশ্য"],["Add curriculum structure","पाठ्यक्रम संरचना जोड़ें","পাঠ্যক্রমের গঠন যোগ করুন"],["Curriculum board or framework","पाठ्यक्रम बोर्ड या ढाँचा","পাঠ্যক্রমের বোর্ড বা কাঠামো"],["Curriculum class or level","पाठ्यक्रम कक्षा या स्तर","পাঠ্যক্রমের ক্লাস বা স্তর"],["Curriculum subject","पाठ्यक्रम विषय","পাঠ্যক্রমের বিষয়"],["Curriculum source provider","पाठ्यक्रम स्रोत प्रदाता","পাঠ্যক্রমের উৎস প্রদানকারী"],["Curriculum source identifier","पाठ्यक्रम स्रोत पहचान","পাঠ্যক্রমের উৎসের পরিচয়"],["Curriculum source version","पाठ्यक्रम स्रोत संस्करण","পাঠ্যক্রমের উৎসের সংস্করণ"],["Chapter {number}","अध्याय {number}","অধ্যায় {number}"],["Objective {number}","उद्देश्य {number}","উদ্দেশ্য {number}"],["Objective {number} in chapter {chapter}","अध्याय {chapter} का उद्देश्य {number}","অধ্যায় {chapter}-এর উদ্দেশ্য {number}"],["Chapter title","अध्याय शीर्षक","অধ্যায়ের শিরোনাম"],["Source section or pages","स्रोत खंड या पृष्ठ","উৎসের অংশ বা পৃষ্ঠা"],["Objective title","उद्देश्य शीर्षक","উদ্দেশ্যের শিরোনাম"],["Authored teaching explanation","लिखी शिक्षण व्याख्या","লিখিত শিক্ষাদানের ব্যাখ্যা"],["Prerequisite objectives","पूर्वापेक्षा उद्देश्य","পূর্বশর্তের উদ্দেশ্য"],["Untitled objective","शीर्षक रहित उद्देश्य","শিরোনামহীন উদ্দেশ্য"],["No other objectives yet.","अभी कोई अन्य उद्देश्य नहीं है।","এখনও অন্য উদ্দেশ্য নেই।"],["Authored representations","लिखे प्रस्तुतीकरण","লিখিত উপস্থাপনা"],["Representation type","प्रस्तुतीकरण प्रकार","উপস্থাপনার ধরন"],["Text alternative","पाठ विकल्प","পাঠ্যের বিকল্প"],["Interactive cube","इंटरैक्टिव घन","ইন্টার‌্যাকটিভ ঘনক"],["Interactive number line","इंटरैक्टिव संख्या रेखा","ইন্টার‌্যাকটিভ সংখ্যারেখা"],["Representation text alternative","प्रस्तुतीकरण का पाठ विकल्प","উপস্থাপনার পাঠ্যের বিকল্প"],["Number-line minimum","संख्या रेखा न्यूनतम","সংখ্যারেখার সর্বনিম্ন"],["Number-line maximum","संख्या रेखा अधिकतम","সংখ্যারেখার সর্বোচ্চ"],["Number-line divisions","संख्या रेखा विभाजन","সংখ্যারেখার বিভাজন"],["Initial division","प्रारंभिक विभाजन","শুরুর বিভাজন"],["Remove representation","प्रस्तुतीकरण हटाएँ","উপস্থাপনা সরান"],["Add representation","प्रस्तुतीकरण जोड़ें","উপস্থাপনা যোগ করুন"],["Objective review criteria","उद्देश्य समीक्षा मानदंड","উদ্দেশ্যের পর্যালোচনার মানদণ্ড"],["Criterion label","मानदंड का नाम","মানদণ্ডের নাম"],["Criterion review prompt","मानदंड समीक्षा प्रश्न","মানদণ্ডের পর্যালোচনার প্রশ্ন"],["Remove criterion","मानदंड हटाएँ","মানদণ্ড সরান"],["Add review criterion","समीक्षा मानदंड जोड़ें","পর্যালোচনার মানদণ্ড যোগ করুন"],["Remove objective","उद्देश्य हटाएँ","উদ্দেশ্য সরান"],["Add objective","उद्देश्य जोड़ें","উদ্দেশ্য যোগ করুন"],["Remove chapter","अध्याय हटाएँ","অধ্যায় সরান"],["Add chapter","अध्याय जोड़ें","অধ্যায় যোগ করুন"],["Structured curriculum preview","संरचित पाठ्यक्रम पूर्वावलोकन","গঠিত পাঠ্যক্রমের প্রিভিউ"],["Source section:","स्रोत खंड:","উৎসের অংশ:"],["Prerequisite objectives:","पूर्वापेक्षा उद्देश्य:","পূর্বশর্তের উদ্দেশ্য:"],[". Review this sequence before assigning; it is not a claim of learner readiness.","। सौंपने से पहले क्रम की समीक्षा करें; यह शिक्षार्थी की तैयारी का दावा नहीं है।","। দেওয়ার আগে ক্রম পর্যালোচনা করুন; এটি শিক্ষার্থী প্রস্তুত থাকার দাবি নয়।"],["Another objective depends on this item. Review and remove that prerequisite before deleting it.","अन्य उद्देश्य इस वस्तु पर निर्भर है। हटाने से पहले पूर्वापेक्षा की समीक्षा करें और हटाएँ।","অন্য উদ্দেশ্য এই বিষয়ে নির্ভরশীল। মুছতে হলে আগে পূর্বশর্ত পর্যালোচনা করে সরান।"],["The recovered curriculum structure cannot be edited safely. Export the current edits before restoring a valid saved copy.","पुनर्प्राप्त संरचना सुरक्षित रूप से नहीं बदल सकते। मान्य प्रति लौटाने से पहले वर्तमान बदलाव निर्यात करें।","পুনরুদ্ধার করা গঠন নিরাপদে সম্পাদনা করা যায় না। বৈধ কপি ফেরানোর আগে বর্তমান সম্পাদনা রপ্তানি করুন।"],["Add structured source references, teaching and review criteria for objective-by-objective teacher preparation. Earlier narrative templates remain usable.","हर उद्देश्य की शिक्षक तैयारी के लिए संरचित स्रोत, शिक्षण और समीक्षा मानदंड जोड़ें। पुराने वर्णनात्मक नमूने उपयोग योग्य हैं।","প্রতি উদ্দেশ্যের শিক্ষক প্রস্তুতির জন্য গঠিত উৎস, শিক্ষাদান ও পর্যালোচনার মানদণ্ড যোগ করুন। পুরোনো বর্ণনামূলক নমুনা ব্যবহারযোগ্য।"],["Author only reviewed source content. Saving preserves unfinished structure; submission requires source metadata, chapter references, complete teaching and at least one criterion per objective. No book conversion or new 3D asset is generated.","केवल समीक्षित स्रोत सामग्री लिखें। सहेजना अधूरी संरचना रखता है; प्रस्तुत करने के लिए स्रोत विवरण, अध्याय संदर्भ, पूर्ण शिक्षण और हर उद्देश्य का मानदंड चाहिए। पुस्तक रूपांतरण या नया 3D संसाधन नहीं बनता।","শুধু পর্যালোচিত উৎসের বিষয়বস্তু লিখুন। সংরক্ষণ অসম্পূর্ণ গঠন রাখে; জমা দিতে উৎসের বিবরণ, অধ্যায়ের তথ্য, সম্পূর্ণ শিক্ষাদান ও প্রতি উদ্দেশ্যের মানদণ্ড চাই। বই রূপান্তর বা নতুন 3D উপকরণ তৈরি হয় না।"],["Cube and number-line views use existing interactive components. Their explanation and text alternative must match this objective.","घन और संख्या रेखा मौजूदा इंटरैक्टिव घटक हैं। व्याख्या और पाठ विकल्प उद्देश्य से मेल खाने चाहिए।","ঘনক ও সংখ্যারেখা বর্তমান ইন্টার‌্যাকটিভ উপাদান ব্যবহার করে। ব্যাখ্যা ও পাঠ্যের বিকল্প উদ্দেশ্যের সঙ্গে মিলতে হবে।"],["Authored private practice","लिखा निजी अभ्यास","লিখিত ব্যক্তিগত অনুশীলন"],["Practice question {number}","अभ्यास प्रश्न {number}","অনুশীলনের প্রশ্ন {number}"],["Practice prompt","अभ्यास प्रश्न","অনুশীলনের প্রশ্ন"],["Answer option {number}","उत्तर विकल्प {number}","উত্তরের বিকল্প {number}"],["Reviewed correct option","समीक्षित सही विकल्प","পর্যালোচিত সঠিক বিকল্প"],["Choose the reviewed correct option","समीक्षित सही विकल्प चुनें","পর্যালোচিত সঠিক বিকল্প বাছুন"],["Option {number}: {text}","विकल्प {number}: {text}","বিকল্প {number}: {text}"],["Complete the option text","विकल्प का पाठ पूरा करें","বিকল্পের পাঠ্য পূর্ণ করুন"],["Add answer option","उत्तर विकल्प जोड़ें","উত্তরের বিকল্প যোগ করুন"],["Remove last option","अंतिम विकल्प हटाएँ","শেষ বিকল্প সরান"],["Remove practice question","अभ्यास प्रश्न हटाएँ","অনুশীলনের প্রশ্ন সরান"],["Add practice question","अभ्यास प्रश्न जोड़ें","অনুশীলনের প্রশ্ন যোগ করুন"],["Practice-bank review · author/teacher view","अभ्यास बैंक समीक्षा · लेखक/शिक्षक दृश्य","অনুশীলন ব্যাঙ্কের পর্যালোচনা · লেখক/শিক্ষকের দৃশ্য"],["Check each key before approval or assignment. Learner question views omit these keys.","अनुमोदन या सौंपने से पहले उत्तर जाँचें। शिक्षार्थी के प्रश्नों में उत्तर नहीं दिखते।","অনুমোদন বা দেওয়ার আগে উত্তর যাচাই করুন। শিক্ষার্থীর প্রশ্নে এই উত্তর দেখানো হয় না।"],[" · authored correct answer"," · लिखा सही उत्तर"," · লিখিত সঠিক উত্তর"],["No authored exercises yet. Learners retain their assigned explanation and response flow.","अभी लिखे अभ्यास नहीं हैं। शिक्षार्थियों की सौंपी व्याख्या और उत्तर प्रक्रिया सुरक्षित है।","এখনও লিখিত অনুশীলন নেই। শিক্ষার্থীদের নির্ধারিত ব্যাখ্যা ও উত্তরের প্রক্রিয়া রাখা হয়েছে।"],["The recovered practice bank cannot be edited safely. Export it before restoring a valid copy.","पुनर्प्राप्त अभ्यास बैंक सुरक्षित रूप से नहीं बदल सकते। मान्य प्रति लौटाने से पहले निर्यात करें।","পুনরুদ্ধার করা অনুশীলন ব্যাঙ্ক নিরাপদে সম্পাদনা করা যায় না। বৈধ কপি ফেরানোর আগে রপ্তানি করুন।"],["Optional exercises with reviewed answer keys. Rehearsal stays private, does not set class grades or mastery, and uses this fixed delivered revision. Questions are written here, not generated from a book.","समीक्षित उत्तरों वाले वैकल्पिक अभ्यास। अभ्यास निजी है, कक्षा के अंक या दक्षता तय नहीं करता और स्थिर संशोधन उपयोग करता है। प्रश्न यहाँ लिखे जाते हैं, पुस्तक से नहीं बनते।","পর্যালোচিত উত্তরসহ ঐচ্ছিক অনুশীলন। অনুশীলন ব্যক্তিগত, ক্লাসের নম্বর বা দক্ষতা নির্ধারণ করে না ও স্থির সংস্করণ ব্যবহার করে। প্রশ্ন এখানে লেখা হয়, বই থেকে তৈরি হয় না।"],["all","सभी स्थितियाँ","সব অবস্থা"],["submitted","प्रस्तुत","জমা দেওয়া"],["changes","बदलाव चाहिए","পরিবর্তন চাই"],["approved","अनुमोदित","অনুমোদিত"],
 [
  "Reviewed curriculum templates",
  "समीक्षित पाठ्यक्रम नमूने",
  "পর্যালোচিত পাঠ্যক্রমের নমুনা"
 ],
 [
  "Organization content",
  "संगठन की सामग्री",
  "প্রতিষ্ঠানের বিষয়বস্তু"
 ],
 [
  "Author, review and retain source versions before use.",
  "उपयोग से पहले लिखें, समीक्षा करें और स्रोत संस्करण सुरक्षित रखें।",
  "ব্যবহারের আগে লিখুন, পর্যালোচনা করুন ও উৎসের সংস্করণ রাখুন।"
 ],
 [
  "New curriculum template",
  "नया पाठ्यक्रम नमूना",
  "নতুন পাঠ্যক্রমের নমুনা"
 ],
 [
  "New content draft",
  "सामग्री का नया ड्राफ़्ट",
  "বিষয়বস্তুর নতুন খসড়া"
 ],
 [
  "Search content",
  "सामग्री खोजें",
  "বিষয়বস্তু খুঁজুন"
 ],
 [
  "Content state",
  "सामग्री की स्थिति",
  "বিষয়বস্তুর অবস্থা"
 ],
 [
  "Content versions",
  "सामग्री के संस्करण",
  "বিষয়বস্তুর সংস্করণ"
 ],
 [
  "Earlier resource · review history unavailable",
  "पुराना संसाधन · समीक्षा इतिहास अनुपलब्ध",
  "পুরোনো উপকরণ · পর্যালোচনার ইতিহাস অনুপলব্ধ"
 ],
 [
  "No matching content.",
  "कोई मिलती सामग्री नहीं।",
  "কোনো মিলে যাওয়া বিষয়বস্তু নেই।"
 ],
 [
  "Start with one sourced content draft.",
  "स्रोत वाली सामग्री का पहला ड्राफ़्ट बनाएँ।",
  "উৎসসহ বিষয়বস্তুর প্রথম খসড়া তৈরি করুন।"
 ],
 [
  "Clear filters",
  "फ़िल्टर हटाएँ",
  "ফিল্টার সরান"
 ],
 [
  "Review content version",
  "सामग्री संस्करण की समीक्षा करें",
  "বিষয়বস্তুর সংস্করণ পর্যালোচনা করুন"
 ],
 [
  "Create content draft",
  "सामग्री का ड्राफ़्ट बनाएँ",
  "বিষয়বস্তুর খসড়া তৈরি করুন"
 ],
 [
  "Content title",
  "सामग्री का शीर्षक",
  "বিষয়বস্তুর শিরোনাম"
 ],
 [
  "Content and learning objective",
  "सामग्री और अध्ययन उद्देश्य",
  "বিষয়বস্তু ও শেখার উদ্দেশ্য"
 ],
 [
  "Source and exact version",
  "स्रोत और सटीक संस्करण",
  "উৎস ও সঠিক সংস্করণ"
 ],
 [
  "Source language",
  "स्रोत की भाषा",
  "উৎসের ভাষা"
 ],
 [
  "Export current content edits",
  "वर्तमान सामग्री बदलाव निर्यात करें",
  "বর্তমান বিষয়বস্তুর সম্পাদনা রপ্তানি করুন"
 ],
 [
  "Save content draft",
  "सामग्री का ड्राफ़्ट सहेजें",
  "বিষয়বস্তুর খসড়া সংরক্ষণ করুন"
 ],
 [
  "Review saved revision",
  "सहेजे संशोधन की समीक्षा करें",
  "সংরক্ষিত সংস্করণ পর্যালোচনা করুন"
 ],
 [
  "Review note",
  "समीक्षा टिप्पणी",
  "পর্যালোচনার নোট"
 ],
 [
  "Source and version checked",
  "स्रोत और संस्करण जाँचे",
  "উৎস ও সংস্করণ যাচাই হয়েছে"
 ],
 [
  "Accuracy and objective checked",
  "सटीकता और उद्देश्य जाँचे",
  "নির্ভুলতা ও উদ্দেশ্য যাচাই হয়েছে"
 ],
 [
  "Language and accessibility checked",
  "भाषा और सुगम्यता जाँची",
  "ভাষা ও প্রবেশগম্যতা যাচাই হয়েছে"
 ],
 [
  "Submit saved revision",
  "सहेजा संशोधन प्रस्तुत करें",
  "সংরক্ষিত সংস্করণ জমা দিন"
 ],
 [
  "Approve saved revision",
  "सहेजा संशोधन अनुमोदित करें",
  "সংরক্ষিত সংস্করণ অনুমোদন করুন"
 ],
 [
  "Request changes",
  "बदलाव माँगें",
  "পরিবর্তন চাইুন"
 ],
 [
  "Open new draft revision",
  "नया ड्राफ़्ट संशोधन खोलें",
  "নতুন খসড়া সংস্করণ খুলুন"
 ],
 [
  "Archive saved content",
  "सहेजी सामग्री संग्रह में रखें",
  "সংরক্ষিত বিষয়বস্তু আর্কাইভ করুন"
 ],
 [
  "Restore as draft",
  "ड्राफ़्ट में वापस लाएँ",
  "খসড়ায় ফেরান"
 ],
 [
  "Review history and earlier versions",
  "समीक्षा इतिहास और पुराने संस्करण",
  "পর্যালোচনার ইতিহাস ও পুরোনো সংস্করণ"
 ],
 [
  "Discard unsaved edits and close",
  "अनसहेजे बदलाव छोड़कर बंद करें",
  "অসংরক্ষিত সম্পাদনা বাদ দিয়ে বন্ধ করুন"
 ],
 [
  "Discard edits and load latest saved version",
  "बदलाव छोड़कर नवीनतम सहेजा संस्करण पढ़ें",
  "সম্পাদনা বাদ দিয়ে সর্বশেষ সংরক্ষিত সংস্করণ পড়ুন"
 ],
 [
  "Discard recovered edits and load latest",
  "पुनर्प्राप्त बदलाव छोड़कर नवीनतम पढ़ें",
  "পুনরুদ্ধার করা সম্পাদনা বাদ দিয়ে সর্বশেষ পড়ুন"
 ],
 [
  "Waiting for a different academic administrator to review.",
  "दूसरे शैक्षणिक प्रशासक की समीक्षा की प्रतीक्षा है।",
  "অন্য শিক্ষা প্রশাসকের পর্যালোচনার অপেক্ষায়।"
 ],
 [
  "Edits stay here if saving fails. A different academic administrator reviews each authored revision.",
  "सहेजना विफल होने पर बदलाव यहाँ रहते हैं। हर लिखे संशोधन की समीक्षा दूसरा शैक्षणिक प्रशासक करता है।",
  "সংরক্ষণ ব্যর্থ হলে সম্পাদনা এখানে থাকে। প্রতি লেখা সংস্করণ অন্য শিক্ষা প্রশাসক পর্যালোচনা করেন।"
 ],
 [
  "Actions apply to the saved revision. Save edits before submission. Review notes do not become learner evidence.",
  "कार्रवाई सहेजे संशोधन पर होती है। प्रस्तुत करने से पहले बदलाव सहेजें। समीक्षा टिप्पणियाँ शिक्षार्थी का रिकॉर्ड नहीं बनतीं।",
  "কাজ সংরক্ষিত সংস্করণে প্রযোজ্য। জমা দেওয়ার আগে সম্পাদনা সংরক্ষণ করুন। পর্যালোচনার নোট শিক্ষার্থীর প্রমাণ হয় না।"
 ],
 [
  "Local draft",
  "स्थानीय ड्राफ़्ट",
  "স্থানীয় খসড়া"
 ],
 [
  "Organization audience",
  "संगठन के लिए",
  "প্রতিষ্ঠানের জন্য"
 ],
 [
  "Revision {revision} · {state}",
  "संशोधन {revision} · {state}",
  "সংস্করণ {revision} · {state}"
 ],
 [
  "Revision {revision}: {title}",
  "संशोधन {revision}: {title}",
  "সংস্করণ {revision}: {title}"
 ],
 [
  "Revision {revision}",
  "संशोधन {revision}",
  "সংস্করণ {revision}"
 ],
 [
  "Current edits exported; this does not save, approve or share content.",
  "वर्तमान बदलाव निर्यात किए; इससे सामग्री सहेजी, अनुमोदित या साझा नहीं होती।",
  "বর্তমান সম্পাদনা রপ্তানি হয়েছে; এতে বিষয়বস্তু সংরক্ষণ, অনুমোদন বা ভাগ হয় না।"
 ],
 [
  "Draft saved. Submit the saved revision when it is ready.",
  "ड्राफ़्ट सहेजा गया। तैयार होने पर सहेजा संशोधन प्रस्तुत करें।",
  "খসড়া সংরক্ষিত। প্রস্তুত হলে সংরক্ষিত সংস্করণ জমা দিন।"
 ],
 [
  "Save your draft or choose Discard unsaved edits before closing.",
  "बंद करने से पहले ड्राफ़्ट सहेजें या अनसहेजे बदलाव छोड़ें।",
  "বন্ধ করার আগে খসড়া সংরক্ষণ করুন বা অসংরক্ষিত সম্পাদনা বাদ দিন।"
 ],
 [
  "Unsaved organization content and review edits recovered from this device. Review the saved version before taking an approval action.",
  "इस डिवाइस से अनसहेजी सामग्री और समीक्षा बदलाव मिले। अनुमोदन से पहले सहेजा संस्करण देखें।",
  "এই ডিভাইস থেকে অসংরক্ষিত বিষয়বস্তু ও পর্যালোচনার সম্পাদনা পাওয়া গেছে। অনুমোদনের আগে সংরক্ষিত সংস্করণ দেখুন।"
 ],
 [
  "This earlier resource has no recorded source or review history. Create a new sourced draft to enter this workflow; the earlier resource is retained.",
  "पुराने संसाधन का स्रोत या समीक्षा इतिहास दर्ज नहीं है। नए स्रोतयुक्त ड्राफ़्ट से शुरू करें; पुराना संसाधन सुरक्षित है।",
  "পুরোনো উপকরণের উৎস বা পর্যালোচনার ইতিহাস নেই। উৎসসহ নতুন খসড়া তৈরি করুন; পুরোনো উপকরণ রাখা হয়েছে।"
 ],
 [
  "Map the intended learner group, source sections, objectives and prerequisite sequence in each template. Approved fixed copies reach only chosen accepted teachers; teachers review their own preparation and classroom assignment. ",
  "हर नमूने में शिक्षार्थी समूह, स्रोत खंड, उद्देश्य और पूर्वापेक्षा क्रम दें। अनुमोदित स्थिर प्रतियाँ चुने स्वीकार किए शिक्षकों को मिलती हैं; शिक्षक तैयारी और कक्षा कार्य की समीक्षा करते हैं। ",
  "প্রতি নমুনায় শিক্ষার্থী দল, উৎসের অংশ, উদ্দেশ্য ও পূর্বশর্তের ক্রম দিন। অনুমোদিত স্থির কপি নির্বাচিত গৃহীত শিক্ষকদের কাছে পৌঁছায়; শিক্ষক প্রস্তুতি ও ক্লাসের কাজ পর্যালোচনা করেন। "
 ],
 [
  "Approval records an editorial review on this device. It does not publish a learner curriculum, generate learning activities or verify source rights. Teachers control classroom assignments.",
  "अनुमोदन इस डिवाइस पर संपादकीय समीक्षा दर्ज करता है। इससे शिक्षार्थी पाठ्यक्रम, गतिविधि या स्रोत अधिकार सत्यापन नहीं होता। कक्षा कार्य शिक्षक तय करते हैं।",
  "অনুমোদন এই ডিভাইসে সম্পাদকীয় পর্যালোচনা নথিভুক্ত করে। এতে শিক্ষার্থীর পাঠ্যক্রম প্রকাশ, কার্যকলাপ তৈরি বা উৎসের অধিকার যাচাই হয় না। ক্লাসের কাজ শিক্ষক ঠিক করেন।"
 ],
 [
  "Draft saved",
  "ड्राफ़्ट सहेजा गया",
  "খসড়া সংরক্ষিত"
 ],
 [
  "Submitted",
  "प्रस्तुत किया गया",
  "জমা দেওয়া"
 ],
 [
  "Approved locally",
  "स्थानीय अनुमोदन",
  "স্থানীয়ভাবে অনুমোদিত"
 ],
 [
  "Changes requested",
  "बदलाव माँगे गए",
  "পরিবর্তন চাওয়া হয়েছে"
 ],
 [
  "New draft opened",
  "नया ड्राफ़्ट खुला",
  "নতুন খসড়া খোলা হয়েছে"
 ],
 [
  "Archived",
  "संग्रह में",
  "আর্কাইভ করা"
 ],
 [
  "Restored as draft",
  "ड्राफ़्ट में वापस",
  "খসড়ায় ফেরানো"
 ],
 [
  "{action}. Saved on this device.",
  "{action}। इस डिवाइस पर सहेजा गया।",
  "{action}। এই ডিভাইসে সংরক্ষিত।"
 ],
 [
  " The old editor backup could not be removed; it may appear again.",
  " पुराने संपादक बैकअप को हटा नहीं सके; वह फिर दिख सकता है।",
  " পুরোনো সম্পাদকের ব্যাকআপ সরানো যায়নি; আবার দেখা যেতে পারে।"
 ],
 [
  "Share approved copy with a teacher",
  "शिक्षक से अनुमोदित प्रति साझा करें",
  "শিক্ষকের সঙ্গে অনুমোদিত কপি ভাগ করুন"
 ],
 [
  "Only this saved revision is delivered. Later edits and review notes stay here. The teacher receives a draft to review before assigning.",
  "केवल सहेजा संशोधन भेजा जाता है। बाद के बदलाव और समीक्षा टिप्पणियाँ यहाँ रहती हैं। सौंपने से पहले समीक्षा के लिए शिक्षक को ड्राफ़्ट मिलता है।",
  "শুধু এই সংরক্ষিত সংস্করণ পাঠানো হয়। পরের সম্পাদনা ও পর্যালোচনার নোট এখানে থাকে। দেওয়ার আগে পর্যালোচনার জন্য শিক্ষক খসড়া পান।"
 ],
 [
  "Accepted teacher",
  "स्वीकार किया शिक्षक",
  "গৃহীত শিক্ষক"
 ],
 [
  "Choose a teacher",
  "शिक्षक चुनें",
  "শিক্ষক বাছুন"
 ],
 [
  "Confirm approved copy delivery",
  "अनुमोदित प्रति भेजने की पुष्टि करें",
  "অনুমোদিত কপি পাঠানো নিশ্চিত করুন"
 ],
 [
  "An accepted teacher membership is required. Invite a teacher in People before sharing.",
  "स्वीकार की शिक्षक सदस्यता चाहिए। साझा करने से पहले लोग में शिक्षक को आमंत्रित करें।",
  "গৃহীত শিক্ষক সদস্যপদ চাই। ভাগ করার আগে সদস্য পাতায় শিক্ষককে আমন্ত্রণ জানান।"
 ],
 [
  "New teacher deliveries are paused by the organization owner. Existing copies and assignments remain available.",
  "संगठन मालिक ने नई शिक्षक प्रतियाँ रोक दी हैं। मौजूदा प्रतियाँ और कार्य उपलब्ध हैं।",
  "প্রতিষ্ঠানের মালিক নতুন শিক্ষক কপি পাঠানো বন্ধ রেখেছেন। বর্তমান কপি ও কাজ উপলব্ধ আছে।"
 ],
 [
  "Approved copy is available in this teacher’s Work preparation inbox on this browser. No email sent.",
  "इस ब्राउज़र में शिक्षक के कार्य तैयारी इनबॉक्स में अनुमोदित प्रति उपलब्ध है। ईमेल नहीं भेजा गया।",
  "এই ব্রাউজারে শিক্ষকের কাজের প্রস্তুতির ইনবক্সে অনুমোদিত কপি উপলব্ধ। ইমেল পাঠানো হয়নি।"
 ],
 [
  "{count} saved delivery copies across revisions. Revoked memberships cannot open their inbox copies.",
  "संशोधनों में {count} भेजी प्रतियाँ सहेजी हैं। निरस्त सदस्यता अपनी इनबॉक्स प्रतियाँ नहीं खोल सकती।",
  "সংস্করণ জুড়ে {count}টি পাঠানো কপি সংরক্ষিত। বাতিল সদস্যপদ ইনবক্সের কপি খুলতে পারে না।"
 ],
 [
  "Reading curriculum templates…",
  "पाठ्यक्रम नमूने पढ़ रहे हैं…",
  "পাঠ্যক্রমের নমুনা পড়া হচ্ছে…"
 ],
 [
  "Earlier subject drafts · unreviewed",
  "पुराने विषय ड्राफ़्ट · असमीक्षित",
  "পুরোনো বিষয়ের খসড়া · অপর্যালোচিত"
 ],
 [
  "Reading earlier subject drafts…",
  "पुराने विषय ड्राफ़्ट पढ़ रहे हैं…",
  "পুরোনো বিষয়ের খসড়া পড়া হচ্ছে…"
 ],
 [
  "Retry earlier drafts",
  "पुराने ड्राफ़्ट फिर पढ़ें",
  "পুরোনো খসড়া আবার পড়ুন"
 ],
 [
  "Prepare sourced template",
  "स्रोतयुक्त नमूना तैयार करें",
  "উৎসসহ নমুনা তৈরি করুন"
 ],
 [
  "No earlier subject drafts on this device.",
  "इस डिवाइस पर पुराने विषय ड्राफ़्ट नहीं हैं।",
  "এই ডিভাইসে পুরোনো বিষয়ের খসড়া নেই।"
 ],
 [
  "No objective notes recorded.",
  "उद्देश्य की टिप्पणियाँ दर्ज नहीं हैं।",
  "উদ্দেশ্যের নোট নথিভুক্ত নেই।"
 ],
 [
  "Your organization permission does not allow curriculum review.",
  "आपकी अनुमति पाठ्यक्रम समीक्षा की अनुमति नहीं देती।",
  "আপনার অনুমতি পাঠ্যক্রমের পর্যালোচনা করতে দেয় না।"
 ],
 [
  "These original scope notes are retained. They have no recorded source/version review and cannot be distributed as approved curriculum. Copy reviewed objectives into a new sourced template above to enter the versioned workflow.",
  "मूल टिप्पणियाँ सुरक्षित हैं। इनकी स्रोत/संस्करण समीक्षा दर्ज नहीं है; अनुमोदित पाठ्यक्रम के रूप में नहीं भेज सकते। ऊपर नए स्रोतयुक्त नमूने में समीक्षित उद्देश्य जोड़ें।",
  "মূল নোট রাখা হয়েছে। উৎস/সংস্করণ পর্যালোচনা নেই; অনুমোদিত পাঠ্যক্রম হিসেবে পাঠানো যাবে না। উপরে উৎসসহ নতুন নমুনায় পর্যালোচিত উদ্দেশ্য যোগ করুন।"
 ]
];
entries.push(['Saved organization content unavailable','सहेजी संगठन सामग्री उपलब्ध नहीं है','সংরক্ষিত প্রতিষ্ঠানের বিষয়বস্তু অনুপলব্ধ'],['Original source records and your editor backup remain on this device. No review or delivery was recorded.','मूल स्रोत रिकॉर्ड और आपका संपादक बैकअप इस डिवाइस पर हैं। कोई समीक्षा या वितरण दर्ज नहीं हुआ।','মূল উৎসের রেকর্ড ও সম্পাদকের ব্যাকআপ এই ডিভাইসে আছে। পর্যালোচনা বা বিতরণ নথিভুক্ত হয়নি।'],['Retry saved content','सहेजी सामग्री फिर खोलें','সংরক্ষিত বিষয়বস্তু আবার খুলুন']);
entries.push(['Open','खोलें','খুলুন'],['Version','संस्करण','সংস্করণ'],['Retained representation','मूल प्रस्तुति बरकरार','মূল উপস্থাপনা রাখা হয়েছে']);
const map=Object.fromEntries(entries.map(([en,hi,bn])=>[en,{en,hi,bn}]));
export const organizationAuthorCopy=locale=>(key,params={})=>(map[key]?.[locale]||teacherCopy(locale)(key)).replace(/\{(\w+)\}/g,(match,name)=>String(params[name]??match));
