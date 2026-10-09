const entries=[
 ['Try a multi-book sample','कई पुस्तकों वाला नमूना देखें','একাধিক বইয়ের নমুনা দেখুন'],
 ['Your subjects','आपके विषय','আপনার বিষয়'],['Your capabilities','आपकी क्षमताएँ','আপনার দক্ষতা'],['Your current learning context','आपका वर्तमान अध्ययन संदर्भ','আপনার বর্তমান শেখার প্রসঙ্গ'],
 ['Opening your subjects…','आपके विषय खोले जा रहे हैं…','আপনার বিষয় খোলা হচ্ছে…'],['Retry subjects','विषय फिर खोलें','বিষয় আবার খুলুন'],
 ['In your catalog','आपकी सूची में','আপনার তালিকায়'],['From your profile','आपकी प्रोफ़ाइल से','আপনার প্রোফাইল থেকে'],['Saved outline','सहेजी रूपरेखा','সংরক্ষিত রূপরেখা'],
 ['No subjects are listed for this context yet. Add a subject below or try an authored sample.','इस संदर्भ के विषय अभी सूचीबद्ध नहीं हैं। नीचे विषय जोड़ें या लिखित नमूना देखें।','এই প্রসঙ্গের বিষয় এখনও তালিকাভুক্ত নেই। নিচে বিষয় যোগ করুন বা লিখিত নমুনা দেখুন।'],
 ['Choose a book','पुस्तक चुनें','বই বেছে নিন'],['Books','पुस्तकें','বই'],['All books','सभी पुस्तकें','সব বই'],['Book chapters','पुस्तक के अध्याय','বইয়ের অধ্যায়'],['chapter','अध्याय','অধ্যায়'],['chapters','अध्याय','অধ্যায়'],
 ['No chapters in this book yet.','इस पुस्तक में अभी अध्याय नहीं हैं।','এই বইয়ে এখনও অধ্যায় নেই।'],['No books in this outline yet.','इस रूपरेखा में अभी पुस्तकें नहीं हैं।','এই রূপরেখায় এখনও বই নেই।']
];
export function learningCatalogueCopy(locale='en'){return text=>entries.find(row=>row[0]===text)?.[locale==='hi'?1:locale==='bn'?2:0]||text;}
