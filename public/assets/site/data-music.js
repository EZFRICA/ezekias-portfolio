// Kiassob studio pipeline, drawn as a die. Coordinates in a 1000 × 330 frame.
window.MUSIC_MAP = {
  w: 1000, h: 330,
  zones: [
    ['Write', 8, 8, 320, 314],
    ['Compose', 340, 8, 320, 314],
    ['Check and release', 672, 8, 320, 314],
  ],
  nodes: {
    story: [20, 34, 296, 56, 'Story', 'one day in one country, fictional characters'],
    lyrics: [20, 102, 296, 56, 'Lyrics', 'local language, French and English, with an LLM'],
    phonetic: [20, 170, 296, 56, 'Phonetic version', 'spelled the way it must be sung'],
    midi: [352, 34, 296, 56, 'MIDI seed', 'played and voiced in GarageBand'],
    instr: [352, 102, 296, 56, 'Instrumental', 'ElevenLabs Music API'],
    suno: [352, 170, 296, 56, 'Final song', 'assembled in Suno'],
    check: [684, 34, 296, 56, 'Sung-lyrics check', 'Scribe and Gemini transcription'],
    video: [684, 102, 296, 56, 'Lyric video', 'HyperFrames, written in code'],
    cover: [684, 170, 296, 56, 'Cover', 'Claude Design, 3000 × 3000'],
    release: [684, 238, 296, 56, 'Release', 'DistroKid, AI declared'],
  },
};

window.MUSIC_FLOW = {
  steps: [
    { at: 'story', say: 'A fisherman in Saint-Louis comes back with empty nets.', token: 'Góor-góorlu' },
    { at: 'lyrics', say: 'The lyrics are written in Wolof, with French and English beside them.', token: 'Wolof, French, English' },
    { at: 'phonetic', say: 'A phonetic version tells the model how to sing each word.', token: 'spelled to be sung' },
    { at: 'midi', say: 'A MIDI seed voiced in GarageBand gives the song its own chords instead of a generic prompt.', token: 'GarageBand' },
    { at: 'instr', say: 'The instrumental is generated from a prompt with no artist names.', token: 'mbalax, 118 BPM' },
    { at: 'suno', say: 'Suno assembles the final song.', token: 'final mix' },
    { at: 'check', say: 'Speech-to-text listens back and flags lines sung wrong.', token: 'line-by-line risks', stop: true },
    { at: 'video', say: 'The lyric video is code: words timed to the audio, in three languages.', token: '3 languages' },
    { at: 'cover', say: 'The cover is designed for every platform size.', token: '3000 × 3000' },
    { at: 'release', say: 'Released everywhere, declared as made with AI.', token: '1 November 2026' },
  ],
};
