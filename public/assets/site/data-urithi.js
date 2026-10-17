// Urithi system map and its two flows. Coordinates in a 1000 × 410 frame.
window.URITHI_MAP = {
  w: 1000, h: 410, track: 'mem',
  zones: [
    ['Guardian side', 8, 8, 404, 292],
    ['Exchange', 424, 8, 152, 292],
    ['Learner side', 588, 8, 404, 292],
    ['Library [B]', 8, 312, 984, 90],
  ],
  nodes: {
    guardian: [20, 34, 184, 50, 'Guardian', 'talks, shows, answers'],
    capture: [20, 100, 184, 50, 'Capture', 'voice, screen, documents'],
    evidence: [20, 166, 184, 50, 'Evidence [A]', 'verbatim and dated'],
    working: [20, 232, 184, 50, 'Working memory [C]', 'notes and proposals'],
    map: [216, 34, 184, 50, 'Knowledge map', 'saved steps and rules'],
    debrief: [216, 100, 184, 50, 'Debrief', 'cases built by code'],
    teachback: [216, 166, 184, 50, 'Teach-back', 'heard and confirmed'],
    publish: [216, 232, 184, 50, 'Publish', 'an access level per part'],
    exchange: [436, 130, 128, 60, 'Question box', 'no name'],
    learner: [600, 34, 184, 50, 'Learner', 'reads, listens, asks'],
    path: [600, 100, 184, 50, 'Path', 'ordered by prerequisites'],
    modes: [600, 166, 184, 50, 'Modes', 'read, listen, braille, practise'],
    guard: [600, 232, 184, 50, 'Guard', 'reads the question first'],
    tutor: [796, 34, 184, 50, 'Tutor', 'every sentence cites the guardian'],
    memory: [796, 100, 184, 50, 'Learner memory [D]', 'per knowledge, deletable'],
    reviews: [796, 166, 184, 50, 'Reviews and exam', 'FSRS, marked by code'],
    package: [796, 232, 184, 50, 'Offline package', 'signed with Ed25519'],
    library: [20, 340, 960, 50, 'Library in Neo4j', 'graph + vector index, access filter inside the search'],
  },
};

window.URITHI_TEACH = {
  steps: [
    { at: 'guardian', say: 'The guardian talks and shows their screen.', token: '“If fewer than ten register, I move the meetup.”' },
    { at: 'capture', say: 'Speech is transcribed with timings, the screen is read.', token: 'audio, 00:12:41' },
    { at: 'evidence', say: 'What was said is kept verbatim, with its date.', token: '[A] verbatim' },
    { at: 'working', say: 'Urithi proposes a rule in the guardian’s own words.', token: 'proposal' },
    { at: 'map', say: 'Only “save this” turns the proposal into knowledge.', token: 'rule: < 10 → move' },
    { at: 'debrief', say: 'The debrief builds the unclear case by code.', token: 'exactly 10?' },
    { at: 'guardian', say: 'The answer is kept verbatim, as precedent.', token: '“Ten is enough.”' },
    { at: 'teachback', say: 'Urithi reads the map back, case by case.', token: 'read back' },
    { at: 'publish', say: 'The guardian decides who may learn each part.', token: 'community' },
    { at: 'library', say: 'Published to the library. Only the guardian’s side writes here.', token: 'v3 published' },
  ],
};

window.URITHI_LEARN = {
  steps: [
    { at: 'learner', say: 'The learner opens the next part on their path.', token: 'part 3' },
    { at: 'path', say: 'Prerequisites are reminded, not enforced.', token: 'after part 2' },
    { at: 'modes', say: 'Read, listen, braille, or practise on the guardian’s cases.', token: 'braille' },
    { at: 'learner', say: 'They ask a question.', token: '“And if it rains?”' },
    { at: 'guard', say: 'A guard reads the question first.', token: 'on topic' },
    { at: 'library', say: 'The access filter runs inside the vector search.', token: 'public, community' },
    { at: 'tutor', say: 'No passage covers it: nothing is composed.', token: 'no citation', stop: true },
    { at: 'exchange', say: 'The question goes to the guardian, without the learner’s name.', token: 'ticket kept on device' },
    { at: 'guardian', say: 'The guardian answers the way they teach.', token: '“Rain changes nothing.”' },
    { at: 'library', say: 'Publishing closes the question against the new version.', token: 'v4' },
    { at: 'tutor', say: 'Now every sentence of the answer cites the guardian.', token: 'cited answer' },
    { at: 'memory', say: 'What Urithi keeps about them is readable and deletable.', token: 'source: their question' },
    { at: 'reviews', say: 'The part comes back for review when it is due.', token: 'due in 3 days' },
    { at: 'package', say: 'Kept for offline, signed, checked on any device.', token: 'Ed25519 ✓' },
  ],
};
