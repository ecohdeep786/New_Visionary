const copy = {
 en: {
  observe: 'Observe', change: 'Change one thing', observeHint: 'Turn the cube to see its faces.',
  changeHint: 'Move the side-length slider and watch the volume change.',
  predict: 'Predict the next change', optional: 'Optional · no score',
  question: (side, next) => `The side is ${side} units. What volume do you expect if the side becomes ${next} units?`,
  choice: volume => `${volume} cubic units`, choices: 'Choose your prediction',
  reveal: 'Reveal the explanation', retry: 'Make another prediction', trySide: side => `Try a side length of ${side}`,
  predicted: volume => `Your prediction: ${volume} cubic units.`,
  explanation: side => `With a side of ${side} units, each layer has ${side} × ${side} squares and there are ${side} layers.`,
  comparison: (side, next) => `The side changes from ${side} to ${next} units. The volume changes from ${side ** 3} to ${next ** 3} cubic units.`,
 },
 hi: {
  observe: 'देखें', change: 'एक चीज़ बदलें', observeHint: 'घन को घुमाकर उसके फलक देखें।',
  changeHint: 'भुजा की लंबाई का स्लाइडर खिसकाएँ और आयतन में बदलाव देखें।',
  predict: 'अगले बदलाव का अनुमान लगाएँ', optional: 'वैकल्पिक · कोई अंक नहीं',
  question: (side, next) => `भुजा ${side} इकाई है। अगर भुजा ${next} इकाई हो जाए, तो आप कितने आयतन की अपेक्षा करते हैं?`,
  choice: volume => `${volume} घन इकाई`, choices: 'अपना अनुमान चुनें',
  reveal: 'व्याख्या देखें', retry: 'फिर अनुमान लगाएँ', trySide: side => `भुजा की लंबाई ${side} करके देखें`,
  predicted: volume => `आपका अनुमान: ${volume} घन इकाई।`,
  explanation: side => `${side} इकाई की भुजा के साथ, हर परत में ${side} × ${side} वर्ग होते हैं और कुल ${side} परतें होती हैं।`,
  comparison: (side, next) => `भुजा ${side} से ${next} इकाई हो जाती है। आयतन ${side ** 3} से ${next ** 3} घन इकाई हो जाता है।`,
 },
 bn: {
  observe: 'দেখুন', change: 'একটি জিনিস বদলান', observeHint: 'ঘনকটি ঘুরিয়ে তার তলগুলো দেখুন।',
  changeHint: 'বাহুর দৈর্ঘ্যের স্লাইডার সরিয়ে আয়তনের পরিবর্তন দেখুন।',
  predict: 'পরের পরিবর্তনটি অনুমান করুন', optional: 'ঐচ্ছিক · কোনো নম্বর নেই',
  question: (side, next) => `বাহু ${side} একক। বাহু ${next} একক হলে কত আয়তন হবে বলে মনে হয়?`,
  choice: volume => `${volume} ঘন একক`, choices: 'আপনার অনুমান বেছে নিন',
  reveal: 'ব্যাখ্যা দেখুন', retry: 'আবার অনুমান করুন', trySide: side => `বাহুর দৈর্ঘ্য ${side} করে দেখুন`,
  predicted: volume => `আপনার অনুমান: ${volume} ঘন একক।`,
  explanation: side => `${side} একক বাহুর জন্য, প্রতিটি স্তরে ${side} × ${side}টি বর্গ থাকে এবং মোট ${side}টি স্তর থাকে।`,
  comparison: (side, next) => `বাহু ${side} থেকে ${next} একক হয়। আয়তন ${side ** 3} থেকে ${next ** 3} ঘন একক হয়।`,
 },
};

export function representationEngagementCopy(locale) { return copy[locale] || copy.en; }
