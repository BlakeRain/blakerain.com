// https://tartarus.org/martin/PorterStemmer/

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

// Consonant-vowel sequences.
const CONSONANT = "[^aeiou]";
const VOWEL = "[aeiouy]";
const CONSONANTS = "(" + CONSONANT + "[^aeiouy]*)";
const VOWELS = "(" + VOWEL + "[aeiou]*)";

const GT0 = new RegExp("^" + CONSONANTS + "?" + VOWELS + CONSONANTS);
const EQ1 = new RegExp(
  "^" + CONSONANTS + "?" + VOWELS + CONSONANTS + VOWELS + "?$"
);
const GT1 = new RegExp("^" + CONSONANTS + "?(" + VOWELS + CONSONANTS + "){2,}");
const VOWEL_IN_STEM = new RegExp("^" + CONSONANTS + "?" + VOWEL);
const CONSONANT_LIKE = new RegExp("^" + CONSONANTS + VOWEL + "[^aeiouwxy]$");

// Exception expressions.
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

export default function stemmer(value: string): string {
  // Exit early.
  if (value.length < 3) {
    return value;
  }

  let firstCharacterWasLowerCaseY = false;

  // Detect initial `y`, make sure it never matches.
  if (
    value.codePointAt(0) === 121 // Lowercase Y
  ) {
    firstCharacterWasLowerCaseY = true;
    value = "Y" + value.slice(1);
  }

  // Step 1a.
  if (SFX_SSES_OR_IES.test(value)) {
    // Remove last two characters.
    value = value.slice(0, -2);
  } else if (SFX_S.test(value)) {
    // Remove last character.
    value = value.slice(0, -1);
  }

  let match: RegExpMatchArray | null;

  // Step 1b.
  if ((match = SFX_EED.exec(value))) {
    if (GT0.test(match[1])) {
      // Remove last character.
      value = value.slice(0, -1);
    }
  } else if (
    (match = SFX_ED_OR_ING.exec(value)) &&
    VOWEL_IN_STEM.test(match[1])
  ) {
    value = match[1];

    if (SFX_AT_OR_BL_OR_IZ.test(value)) {
      // Append `e`.
      value += "e";
    } else if (SFX_MULTI_CONSONANT_LIKE.test(value)) {
      // Remove last character.
      value = value.slice(0, -1);
    } else if (CONSONANT_LIKE.test(value)) {
      // Append `e`.
      value += "e";
    }
  }

  // Step 1c.
  if ((match = SFX_Y.exec(value)) && VOWEL_IN_STEM.test(match[1])) {
    // Remove suffixing `y` and append `i`.
    value = match[1] + "i";
  }

  // Step 2.
  if ((match = STEP2.exec(value)) && GT0.test(match[1])) {
    value = match[1] + STEP2_LIST[match[2]];
  }

  // Step 3.
  if ((match = STEP3.exec(value)) && GT0.test(match[1])) {
    value = match[1] + STEP3_LIST[match[2]];
  }

  // Step 4.
  if ((match = STEP4.exec(value))) {
    if (GT1.test(match[1])) {
      value = match[1];
    }
  } else if ((match = SFX_ION.exec(value)) && GT1.test(match[1])) {
    value = match[1];
  }

  // Step 5.
  if (
    (match = SFX_E.exec(value)) &&
    (GT1.test(match[1]) ||
      (EQ1.test(match[1]) && !CONSONANT_LIKE.test(match[1])))
  ) {
    value = match[1];
  }

  if (SFX_LL.test(value) && GT1.test(value)) {
    value = value.slice(0, -1);
  }

  // Turn initial `Y` back to `y`.
  if (firstCharacterWasLowerCaseY) {
    value = "y" + value.slice(1);
  }

  return value;
}
