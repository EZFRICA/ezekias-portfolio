// Agent Processor Unit as a die, and one query travelling through it. Coordinates in a 680 × 286 frame.
window.APU_MAP = {
  w: 680, h: 286,
  zones: [
    ['Interface', 8, 8, 200, 270],
    ['Control and execution', 232, 8, 216, 270],
    ['Memory hierarchy', 472, 8, 200, 270],
  ],
  nodes: {
    user: [18, 34, 180, 44, 'User', 'a question arrives'],
    window: [18, 94, 180, 44, 'Working context', 'what the model sees'],
    override: [18, 154, 180, 44, 'Force Override', 'a human interrupt'],
    reply: [18, 214, 180, 44, 'Reply', 'read right away'],
    bmj: [242, 34, 196, 44, 'BMJ router', 'the TLB: DLL first'],
    teu: [242, 94, 196, 44, 'Tool unit', 'results cached 15 min'],
    llm: [242, 154, 196, 44, 'LLM', 'the ALU'],
    scheduler: [242, 214, 196, 44, 'Scheduler', 'reply first, sync later'],
    l1: [482, 34, 180, 44, 'L1 cache', 'RAM, 78% of hits'],
    dll: [482, 94, 180, 44, 'DLL', 'page table, 12 blocks'],
    l3: [482, 154, 180, 44, 'L3 Weaviate', 'paged-out blocks'],
    l4: [482, 214, 180, 44, 'L4 Letta', 'cold archive'],
  },
};

window.APU_FLOW = {
  steps: [
    { at: 'user', say: 'A question comes in.', token: '“A peanut-free hotel near the station?”' },
    { at: 'bmj', say: 'BMJ checks working memory first, like a TLB.', token: 'certainty 0.86' },
    { at: 'l1', say: 'Hot blocks answer from RAM. 78% of queries stop here.', token: 'hit' },
    { at: 'dll', say: 'One block it needs was paged out.', token: 'miss' },
    { at: 'l3', say: 'Page fault: the block comes back from L3.', token: 'page in' },
    { at: 'dll', say: 'The least recently used block makes room.', token: 'page out' },
    { at: 'window', say: 'The working context is assembled, twelve blocks at most.', token: '12 blocks' },
    { at: 'override', say: 'A human can inspect it and interrupt before the model sees it.', token: 'inspect' },
    { at: 'teu', say: 'A tool result comes from the cache.', token: '< 1 ms' },
    { at: 'llm', say: 'The model answers at priority zero.', token: 'P0' },
    { at: 'reply', say: 'The user reads the reply now.', token: '“Yes, two of them.”' },
    { at: 'scheduler', say: 'The memory write is queued in the background.', token: 'P2 sync' },
    { at: 'l4', say: 'The archive is updated later, retried up to three times.', token: 'synced' },
  ],
};
