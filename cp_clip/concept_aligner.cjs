const fs = require('fs');
const path = require('path');

class ConceptAligner {
  constructor(lexiconPath) {
    this.lexiconPath = lexiconPath || path.join(__dirname, 'international_lexicon.json');
    this.initialized = false;
    this.concepts = [];
    this.modifiers = [];
    this.termIndex = new Map(); // normalized term -> { type: 'concept'|'modifier', target: obj, langs: Set<string> }
    this.sortedTerms = [];      // sorted by string length descending for greedy longest-match
    this.stopWordsByLang = new Map(); // lang -> Set<string>

    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(this.lexiconPath)) {
        console.warn(`[ConceptAligner] Lexicon file not found at ${this.lexiconPath}`);
        return;
      }
      const raw = fs.readFileSync(this.lexiconPath, 'utf8');
      const data = JSON.parse(raw);

      this.concepts = data.concepts || [];
      this.modifiers = data.modifiers || [];

      // Build stop words per language
      if (data.stop_words) {
        for (const lang of Object.keys(data.stop_words)) {
          const swSet = new Set();
          for (const sw of data.stop_words[lang]) {
            swSet.add(sw.toLowerCase().trim());
          }
          this.stopWordsByLang.set(lang, swSet);
        }
      }

      // Index all terms
      const termMap = new Map();

      const addTerm = (term, type, target, lang) => {
        const norm = term.toLowerCase().trim();
        if (!norm) return;
        let entry = termMap.get(norm);
        if (!entry) {
          entry = { type, target, langs: new Set() };
          termMap.set(norm, entry);
        }
        entry.langs.add(lang);
      };

      for (const concept of this.concepts) {
        if (!concept.terms) continue;
        for (const lang of Object.keys(concept.terms)) {
          for (const term of concept.terms[lang]) {
            addTerm(term, 'concept', concept, lang);
          }
        }
      }

      for (const mod of this.modifiers) {
        if (!mod.terms) continue;
        for (const lang of Object.keys(mod.terms)) {
          for (const term of mod.terms[lang]) {
            addTerm(term, 'modifier', mod, lang);
          }
        }
      }

      this.termIndex = termMap;
      // Sort terms by length descending for greedy matching
      this.sortedTerms = Array.from(termMap.keys()).sort((a, b) => b.length - a.length);
      this.initialized = true;
      console.log(`[ConceptAligner] Loaded ${this.concepts.length} concepts and ${this.modifiers.length} modifiers with ${this.sortedTerms.length} indexed terms across 20+ languages.`);
    } catch (err) {
      console.error('[ConceptAligner] Failed to initialize lexicon:', err);
    }
  }

  /**
   * Fast-path language detection:
   * Pure ASCII English is detected in < 0.0001 ms
   */
  isPureEnglish(text) {
    return /^[a-zA-Z0-9\s.,!?'"-_()]+$/.test(text);
  }

  detectScript(text) {
    if (/[\u4e00-\u9fa5]/.test(text)) return 'zh';
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
    if (/[\uac00-\ud7af]/.test(text)) return 'ko';
    if (/[\u0400-\u04ff]/.test(text)) return 'ru';
    if (/[\u0600-\u06ff]/.test(text)) return 'ar';
    if (this.isPureEnglish(text)) return 'en';
    return 'latin_other'; // Spanish, French, German, Portuguese, Italian, etc.
  }

  /**
   * Align user input query into standard, high-recall MobileCLIP Prompt
   * @param {string} queryText - user search query in any language
   * @returns {string} aligned standard English prompt
   */
  alignQueryToPrompt(queryText) {
    if (!queryText || typeof queryText !== 'string') {
      return 'a photo';
    }

    const trimmed = queryText.trim();
    if (trimmed.length === 0) return 'a photo';

    if (!this.initialized) {
      return trimmed;
    }

    const lowerQuery = trimmed.toLowerCase();
    let matchedConcepts = [];
    let matchedModifiers = [];
    let foreignOnlyMatched = false;
    let anyTermMatched = false;
    let remainingText = lowerQuery;

    // Greedy longest-string search across indexed terms
    for (const term of this.sortedTerms) {
      const isShortAscii = term.length <= 2 && /^[a-z]+$/.test(term);
      const isMatched = isShortAscii 
        ? new RegExp(`(^|\\s|\\b)${term}(\\s|\\b|$)`, 'i').test(remainingText)
        : remainingText.includes(term);

      if (isMatched) {
        anyTermMatched = true;
        const item = this.termIndex.get(term);

        // If this term does NOT exist in English, it's definitively foreign!
        if (!item.langs.has('en')) {
          foreignOnlyMatched = true;
        }

        if (item.type === 'concept') {
          if (!matchedConcepts.some(c => c.id === item.target.id)) {
            matchedConcepts.push(item.target);
          }
        } else if (item.type === 'modifier') {
          if (!matchedModifiers.some(m => m.id === item.target.id)) {
            matchedModifiers.push(item.target);
          }
        }
        remainingText = remainingText.replace(term, ' ');
      }
    }

    // Check for foreign stop-words in the query (e.g. "en", "la", "auf", "der", "dans", "le")
    const words = lowerQuery.split(/\s+/);
    for (const [lang, swSet] of this.stopWordsByLang.entries()) {
      if (lang !== 'en') {
        for (const w of words) {
          if (swSet.has(w)) {
            foreignOnlyMatched = true;
            break;
          }
        }
      }
      if (foreignOnlyMatched) break;
    }

    // Check non-ASCII script (Chinese, Japanese, Korean, Russian, Arabic, Accented Latin)
    const script = this.detectScript(trimmed);
    const hasNonAscii = script !== 'en';

    // 1. If foreign indicators exist (foreign-only words, foreign stop words, or non-ASCII script)
    if (foreignOnlyMatched || hasNonAscii) {
      if (matchedConcepts.length > 0 || matchedModifiers.length > 0) {
        return this.synthesizePrompt(matchedConcepts, matchedModifiers, trimmed);
      }
      return trimmed;
    }

    // 2. Pure English
    // If it's a multi-word English phrase (>= 2 words), e.g. "golden retriever on the grass", pass through directly
    if (words.length >= 2) {
      return trimmed;
    }

    // If single English word like "dog", enhance with prompt template
    if (matchedConcepts.length > 0) {
      return this.synthesizePrompt(matchedConcepts, matchedModifiers, trimmed);
    }

    return `a photo of a ${trimmed}`;
  }

  extractColorName(conceptId) {
    const map = {
      'color_red': 'red',
      'color_blue': 'blue',
      'color_green': 'green',
      'color_yellow': 'yellow',
      'color_white': 'white',
      'color_black': 'black',
      'color_pink': 'pink',
      'color_purple': 'purple',
      'color_orange': 'orange',
      'color_brown': 'brown',
      'color_gray': 'gray'
    };
    return map[conceptId] || null;
  }

  synthesizePrompt(matchedConcepts, matchedModifiers, fallbackText) {
    if (matchedConcepts.length === 0 && matchedModifiers.length === 0) {
      return fallbackText;
    }

    // Check if color concept is present
    const colorConcept = matchedConcepts.find(c => c.category === 'colors');
    const nonColorConcepts = matchedConcepts.filter(c => c.category !== 'colors');
    const colorName = colorConcept ? this.extractColorName(colorConcept.id) : null;

    // Case 1: Substantive concept + Color (e.g. "红车", "红衣服", "蓝古装")
    if (nonColorConcepts.length > 0 && colorName) {
      const primary = nonColorConcepts[0];
      const modPhrases = matchedModifiers.map(m => m.prompt_fragment).join(' ');

      if (primary.id === 'car_vehicle') {
        return `a photo of a ${colorName} car, automobile or vehicle${modPhrases ? ' ' + modPhrases : ' on the road'}`;
      }
      if (primary.id === 'clothes_outfit') {
        return `a photo of a person wearing ${colorName} clothes or ${colorName} outfit`;
      }
      if (primary.id === 'dress_skirt') {
        return `a photo of a woman wearing a ${colorName} dress or ${colorName} skirt`;
      }
      if (primary.id === 'hat_cap') {
        return `a photo of a person wearing a ${colorName} hat or cap`;
      }
      if (primary.id === 'suit_formal') {
        return `a photo of a person wearing a ${colorName} suit`;
      }
      if (primary.id === 'flowers_plants') {
        return `a photo of beautiful ${colorName} flowers blooming`;
      }
      if (primary.id === 'dog_pet') {
        return `a clear photo of a ${colorName} dog or puppy pet${modPhrases ? ' ' + modPhrases : ''}`;
      }
      if (primary.id === 'cat_pet') {
        return `a clear photo of a ${colorName} cat or kitten${modPhrases ? ' ' + modPhrases : ''}`;
      }
      if (primary.id === 'ancient_costume_hanfu') {
        return `a photo of a person wearing ${colorName} ancient traditional costume or hanfu`;
      }

      return `a photo of a ${colorName} ${primary.id.replace(/_/g, ' ')}${modPhrases ? ' ' + modPhrases : ''}`;
    }

    // Case 2: Only Color concept matched (e.g. "红", "red", "蓝", "blue")
    if (colorConcept && nonColorConcepts.length === 0) {
      const modPhrases = matchedModifiers.map(m => m.prompt_fragment).join(' ');
      return `${colorConcept.default_template}${modPhrases ? ' ' + modPhrases : ''}`;
    }

    // Case 3: Substantive concepts without color (e.g. "学士服", "戴帽子的男孩", "富士山")
    if (nonColorConcepts.length > 0) {
      const primary = nonColorConcepts[0];
      const secondary = nonColorConcepts.length > 1 ? nonColorConcepts[1] : null;
      const modPhrases = matchedModifiers.map(m => m.prompt_fragment).join(' ');

      if (primary.id === 'child_kid' && secondary && secondary.id === 'hat_cap') {
        return `a photo of a cute child wearing a hat or cap${modPhrases ? ' ' + modPhrases : ''}`;
      }
      if (primary.id === 'hat_cap' && secondary && secondary.id === 'child_kid') {
        return `a photo of a cute child wearing a hat or cap${modPhrases ? ' ' + modPhrases : ''}`;
      }

      if (modPhrases) {
        return `${primary.default_template} ${modPhrases}`;
      }
      return primary.default_template;
    }

    // Case 4: Only modifiers matched
    if (matchedModifiers.length > 0) {
      const mod = matchedModifiers[0];
      return `a beautiful photo ${mod.prompt_fragment}`;
    }

    return fallbackText;
  }
}

// Global Singleton
let globalConceptAligner = null;
function getGlobalConceptAligner(lexiconPath) {
  if (!globalConceptAligner) {
    globalConceptAligner = new ConceptAligner(lexiconPath);
  }
  return globalConceptAligner;
}

module.exports = {
  ConceptAligner,
  getGlobalConceptAligner
};
