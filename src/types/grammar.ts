export type GrammarTopic = {
  id: string;
  title: string;
  category: string; // e.g., Tenses, Modals, Structure
  brief: string;
  points: Array<{
    rule: string;
    example: { en: string; vi: string };
  }>;
};
