// Skills — named prompt templates that expand into the composer.
//
// V0 ships a fixed set of defaults. Custom skills + persistence + an editor
// in Settings arrive in the next slice. The trigger interaction surfaces
// from a button in the composer; @-mention autocomplete (Dia-style) is V0.2
// polish.

export type Skill = {
  readonly id: string;
  /** Display name in the picker. */
  readonly label: string;
  /** One-line hint shown under the label. */
  readonly description: string;
  /** Replaces the composer text on pick. The user fills in any
   *  bracketed placeholders before sending. */
  readonly template: string;
};

export const DEFAULT_SKILLS: readonly Skill[] = [
  {
    id: 'summarize',
    label: 'Summarize',
    description: '3-bullet summary + a one-line takeaway',
    template:
      'Summarize the following in 3 short bullet points, then end with one sentence stating the most important takeaway.\n\n',
  },
  {
    id: 'compare',
    label: 'Compare',
    description: 'Find agreement / disagreement across tabs',
    template:
      'Compare the sources I have provided as context. Structure your reply as:\n' +
      '\n' +
      '1. **Agreement** — points where the sources align\n' +
      '2. **Disagreement** — points where they diverge\n' +
      '3. **Most important differences** — what actually matters\n' +
      '\n' +
      'Cite specifics; avoid generalities.\n\n',
  },
  {
    id: 'explain',
    label: 'Explain',
    description: 'Explain a concept clearly',
    template:
      'Explain this concept assuming I have a technical background but no domain expertise. Be precise and concrete; avoid hedging language. Use a brief example if it helps.\n\n',
  },
  {
    id: 'rewrite',
    label: 'Rewrite',
    description: 'Rewrite in a different tone or length',
    template:
      'Rewrite the following text. Target style: [more concise / more formal / more casual / more technical — pick one or specify]. Preserve the meaning.\n\n',
  },
  {
    id: 'critique',
    label: 'Critique',
    description: 'Honest critique of a draft or argument',
    template:
      'Critique this draft. Be specific and honest. Cover:\n' +
      '\n' +
      '- The strongest claim or section\n' +
      '- The weakest claim or section\n' +
      '- Two concrete improvements\n' +
      '\n' +
      'Avoid generic praise.\n\n',
  },
  {
    id: 'translate',
    label: 'Translate',
    description: 'Translate text to another language',
    template:
      'Translate the following to [target language — e.g. English, Spanish, Japanese]. Preserve nuance over literal word-for-word.\n\n',
  },
];
