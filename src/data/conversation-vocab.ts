import rawVocabData from './user-conversation-vocab.json'

export interface ConversationExample {
  ja: string
  reading: string
  en: string
}

export interface ConversationWord {
  id: string
  word: string
  reading: string
  meaning: string
  pos: string
  tag: 'standard' | 'slang' | string
  example: ConversationExample
  scenarioId?: string
  scenarioTitle?: string
}

export interface ConversationScenario {
  id: string
  scenario: string
  situation: string
  word_count: number
  words: ConversationWord[]
}

export interface ConversationVocabData {
  language: string
  focus: string
  note: string
  scenario_count: number
  word_count: number
  scenarios: ConversationScenario[]
}

export const SCENARIO_ICONS: Record<string, string> = {
  s01: '🗓️', // Making plans to hang out
  s02: '📱', // Texting and social media
  s03: '🍜', // Eating out with friends
  s04: '🏪', // Convenience store, groceries and cooking
  s05: '🚃', // Commuting and getting around
  s06: '💼', // Part-time job and work complaints
  s07: '🎓', // University and school life
  s08: '🛍️', // Money, shopping and sales
  s09: '💘', // Crushes, dating and relationships
  s10: '💭', // Feelings, venting and encouraging each other
  s11: '🛌', // Health, sleep and hangovers
  s12: '🎮', // Games, anime, music and hobbies
  s13: '🔥', // Casual slang and everyday reactions
  s14: '☀️', // Weather and seasons small talk
  s15: '✈️', // Travel and trips with friends
  s16: '🏠', // Home life, roommates and chores
  s17: '👗', // Fashion, looks and compliments
  s18: '📶', // Phone, wifi and tech problems
  s19: '👥', // Describing people and friend gossip
  s20: '🙏', // Asking favors, apologizing and thanking
}

export const CONVERSATION_DATA: ConversationVocabData =
  rawVocabData as ConversationVocabData

export const CONVERSATION_SCENARIOS: ConversationScenario[] =
  CONVERSATION_DATA.scenarios

export const ALL_CONVERSATION_WORDS: ConversationWord[] =
  CONVERSATION_SCENARIOS.flatMap((scenario) =>
    scenario.words.map((w) => ({
      ...w,
      scenarioId: scenario.id,
      scenarioTitle: scenario.scenario,
    }))
  )
