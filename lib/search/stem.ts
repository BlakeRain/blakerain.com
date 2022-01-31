// https://tartarus.org/martin/PorterStemmer/

export const STEM_WORDS = [
  "that",
  "been",
  "him",
  "us",
  "would",
  "own",
  "or",
  "yourselves",
  "new",
  "no",
  "such",
  "below",
  "did",
  "if",
  "myself",
  "against",
  "do",
  "because",
  "am",
  "back",
  "his",
  "to",
  "what",
  "people",
  "make",
  "who",
  "but",
  "on",
  "there",
  "between",
  "way",
  "other",
  "than",
  "which",
  "while",
  "see",
  "all",
  "I",
  "was",
  "them",
  "of",
  "just",
  "good",
  "she",
  "whom",
  "day",
  "only",
  "two",
  "first",
  "know",
  "ourselves",
  "come",
  "he",
  "from",
  "why",
  "few",
  "for",
  "their",
  "one",
  "the",
  "this",
  "any",
  "down",
  "more",
  "ours",
  "we",
  "think",
  "will",
  "about",
  "above",
  "were",
  "be",
  "our",
  "themselves",
  "having",
  "they",
  "time",
  "say",
  "under",
  "once",
  "doing",
  "further",
  "yours",
  "look",
  "with",
  "want",
  "in",
  "how",
  "like",
  "has",
  "had",
  "give",
  "by",
  "it",
  "during",
  "nor",
  "t",
  "a",
  "could",
  "very",
  "some",
  "well",
  "have",
  "your",
  "is",
  "so",
  "you",
  "i",
  "after",
  "yourself",
  "even",
  "should",
  "when",
  "himself",
  "at",
  "its",
  "and",
  "too",
  "same",
  "until",
  "hers",
  "as",
  "don",
  "most",
  "also",
  "herself",
  "take",
  "again",
  "before",
  "these",
  "through",
  "both",
  "theirs",
  "use",
  "her",
  "those",
  "where",
  "year",
  "being",
  "does",
  "off",
  "are",
  "s",
  "over",
  "here",
  "me",
  "go",
  "into",
  "each",
  "work",
  "up",
  "an",
  "itself",
  "my",
  "get",
  "out",
  "can",
  "then",
  "not",
  "now",
];

const STEP2_LIST: { [key: string]: string } = {
  ational: "ate",
  tional: "tion",
  enci: "ence",
  anci: "ance",
  izer: "ize",
  bli: "ble",
  alli: "al",
  entli: "ent",
  eli: "e",
  ousli: "ous",
  ization: "ize",
  ation: "ate",
  ator: "ate",
  alism: "al",
  iveness: "ive",
  fulness: "ful",
  ousness: "ous",
  aliti: "al",
  iviti: "ive",
  biliti: "ble",
  logi: "log",
};

const STEP3_LIST: { [key: string]: string } = {
  icate: "ic",
  ative: "",
  alize: "al",
  iciti: "ic",
  ical: "ic",
  ful: "",
  ness: "",
};

// Consonant-vowel sequences
const CONSONANT = "[^aeiou]";
const VOWEL = "[aeiouy]";
const CONSONANTS = `(${CONSONANT}[^aeiouy]*)`;
const VOWELS = `(${VOWEL}[aeiou]*)`;

const GT0 = new RegExp(`^${CONSONANTS}?${VOWELS}${CONSONANTS}`);
const EQ1 = new RegExp(`^${CONSONANTS}?${VOWELS}${CONSONANTS}${VOWELS}?$`);
const GT1 = new RegExp(`^${CONSONANTS}?(${VOWELS}${CONSONANTS}){2,}`);
const VOWEL_IN_STEM = new RegExp(`^${CONSONANTS}?${VOWEL}`);
const CONSONANT_LIKE = new RegExp(`^${CONSONANTS}${VOWEL}[^aeiouwxy]$`);

// Exception expression
const SFX_LL = /ll$/;
const SFX_E = /^(.+?)e$/;
const SFX_Y = /^(.+?)y$/;
const SFX_ION = /^(.+?(s|t))(ion)$/;
const SFX_ED_OR_ING = /^(.+?)(ed|ing)$/;
const SFX_AT_OR_BL_OR_IZ = /(at|bl|iz)$/;
const SFX_EED = /^(.+?)eed$/;
const SFX_S = /^.+?[^s]s$/;
const SFX_SSES_OR_IES = /^.+?(ss|i)es$/;
const SFX_MULTI_CONSONANT_LIKE = /([^aeiouylsz])\1$/;

const STEP2 =
  /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
const STEP3 = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
const STEP4 =
  /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;

export function stemmer(word: string): string {
  // Word might be an identifier
  if (word.indexOf("_") !== -1 || word.indexOf("-") !== -1) {
    return word;
  }

  word = word.toLowerCase();
  if (word.length < 3) {
    return word;
  }

  var first_char_was_lower_y: boolean = false;
  var match: RegExpMatchArray | null = null;

  if (word.charCodeAt(0) === 121) {
    first_char_was_lower_y = true;
    word = "Y" + word.slice(1);
  }

  // Step 1a
  if (SFX_SSES_OR_IES.test(word)) {
    // Remove last two characters
    word = word.slice(0, -2);
  } else if (SFX_S.test(word)) {
    // Remove last character
    word = word.slice(0, -1);
  }

  // Step 1b
  if ((match = SFX_EED.exec(word))) {
    if (GT0.test(match[1])) {
      // Remove the last character
      word = word.slice(0, -1);
    }
  } else if (
    (match = SFX_ED_OR_ING.exec(word)) &&
    VOWEL_IN_STEM.test(match[1])
  ) {
    word = match[1];

    if (SFX_AT_OR_BL_OR_IZ.test(word)) {
      // Append 'e'
      word += "e";
    } else if (SFX_MULTI_CONSONANT_LIKE.test(word)) {
      // Remove last character
      word = word.slice(0, -1);
    } else if (CONSONANT_LIKE.test(word)) {
      // Append 'e'
      word += "e";
    }
  }

  // Step 1c
  if ((match = SFX_Y.exec(word)) && VOWEL_IN_STEM.test(match[1])) {
    // Remove suffixing 'y' and append 'i'
    word = match[1] + "i";
  }

  // Step 2
  if ((match = STEP2.exec(word)) && GT0.test(match[1])) {
    word = match[1] + STEP2_LIST[match[2]];
  }

  // Step 3
  if ((match = STEP3.exec(word)) && GT0.test(match[1])) {
    word = match[1] + STEP3_LIST[match[2]];
  }

  // Step 4
  if ((match = STEP4.exec(word))) {
    if (GT1.test(match[1])) {
      word = match[1];
    }
  } else if ((match = SFX_ION.exec(word)) && GT1.test(match[1])) {
    word = match[1];
  }

  // Step 5
  if (
    (match = SFX_E.exec(word)) &&
    (GT1.test(match[1]) ||
      (EQ1.test(match[1]) && !CONSONANT_LIKE.test(match[1])))
  ) {
    word = match[1];
  }

  if (SFX_LL.test(word) && GT1.test(word)) {
    word = word.slice(0, -1);
  }

  // Turn initial 'y' back to 'y'
  if (first_char_was_lower_y) {
    word = "y" + word.slice(1);
  }

  return word;
}
