-- Insert some basic vocabulary
INSERT INTO public.vocabulary (id, word, reading, meaning, part_of_speech, jlpt_level, example_sentence, example_translation)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '食べる', 'たべる', 'to eat', 'Verb', 'N5', '私はりんごを食べる。', 'I eat an apple.'),
  ('22222222-2222-2222-2222-222222222222', '飲む', 'のむ', 'to drink', 'Verb', 'N5', '彼は水を飲む。', 'He drinks water.'),
  ('33333333-3333-3333-3333-333333333333', '見る', 'みる', 'to see, to watch', 'Verb', 'N5', '映画を見る。', 'I watch a movie.'),
  ('44444444-4444-4444-4444-444444444444', '行く', 'いく', 'to go', 'Verb', 'N5', '学校に行く。', 'I go to school.'),
  ('55555555-5555-5555-5555-555555555555', '来る', 'くる', 'to come', 'Verb', 'N5', '友達が来る。', 'A friend comes.');

-- Insert some lessons
INSERT INTO public.lessons (id, title, jlpt_level, category, content)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Introduction to Hiragana', 'Beginner', 'hiragana', '{"explanation": "Hiragana is the basic Japanese phonetic script.", "characters": ["あ", "い", "う", "え", "お"]}'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Katakana Basics', 'Beginner', 'katakana', '{"explanation": "Katakana is used for foreign loan words.", "characters": ["ア", "イ", "ウ", "エ", "オ"]}'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'は vs が', 'N5', 'grammar', '{"meaning": "Topic vs Subject marker", "explanation": "は marks the topic of the sentence, while が marks the grammatical subject."}');
