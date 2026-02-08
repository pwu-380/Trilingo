# Summary

I want to make a language learning app just for me because I'm getting annoyed with Duolingo. This app will teach me Mandarin Chinese (simplified). Ideally if it's hosted on a local webserver, I could also play it on my phone browser if I turn it on on my computer. I am thinking this app will consist of 3 interconnected learning components (think of them as tabs). They are listed as follows in order of priority. 

## The chatbot
This will be the primary interface of the app, where I converse with an AI in chinese. The purpose will be to practice conversational Chinese. I want to use Gemini Flash 2 to power this chat.

### Primary Features
- The dialogue will be in Chinese. User input will be plain Chinese but computer generated text (simplified characters) will be displayed with pinyin annotations.
- Computer generated Chinese dialogue will also be accompanied by an English translation of the same dialogue, but this will be obscured as a spoiler underneath the Chinese text. (The user will have to choose to reveal it).
- The computer will not only respond to user input with conversational Chinese, but separately in non-dialogue, also with notes and criticisms about the user's grammar and voice, with tips to improve their Chinese usage (in English). This can be displayed side-by-side or underneath the dialogue component.
- Any Chinese words in this panel would be able to highlight-selected by the player and automatically added to the flash card component.

## Flash cards
This would be the corpus of words the user is actively trying to learn. Each word would be associated with a "flash card". The assets for each flash card should be saved locally so that we don't need to regenerate them all the time.

### Primary Features
- A "card" is made of two parts: a Chinese component associated with an English component. At minimum, the Chinese component consists of a Chinese word and its pinyin. At minimum the English component will consist of the Chinese word translated in English.
- The primary use of these cards would be flash quizes, the player is shown a random card with either the English component obscured or the Chinese component obscured, and the player has to pick the correct component in a multiple choice game.
- Cards which are learned can be moved to a deactivated area and they would no longer be in the game pool. They can be reactivated later.

### Stretch Goals
- Dynamic difficulty: cards which have been answered incorrectly get replayed more often, cards which have been answered correctly get replayed less often.
- The Chinese component will also have (English) tips/notes about usage if appropriate. These should be brief and no more than 140 characters long.
- Each card should also be generated with an audio file of the word being spoken in Mandarin Chinese. This is would be playable by clicking a discreet button on the card.
- Each card should be generated with a sprite image of the subject (this would be considered part of the "English component").

## Other Games
This should be language games using the assets of the flash card corpus in the style of Duolingo's games. Again, if assets associated with these games need to be generated, the generated artifacts should be saved locally and reused.