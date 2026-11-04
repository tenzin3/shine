const TEXTS = /*__DATA__*/[];
const IMG = /*__IMG__*/{};
const AUDIO = /*__AUDIO__*/{};
/* "What's on your mind?": free matching in the browser. The person's words (plus related words
   from the Datamuse API) are scored against hand-written keywords for each lesson and collection. */
const MATCH_DATA = /*__MATCH_DATA__*/{};
const CRISIS_LIST = /*__CRISIS__*/[];
const CRISIS_RE = CRISIS_LIST.length ? new RegExp(CRISIS_LIST.join('|'),'i') : null;
