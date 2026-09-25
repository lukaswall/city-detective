// CASE: Thailand - Bangkok - "The Emerald Deva"
// Data-only file: the engine reads this structure, so new cases need no code changes.
// v2 additions: hotspot coordinates (x/y as % of the scene image), flavor details,
// map coordinates, clue relations (case-board strings) and the convicting evidence set.
window.CASE_THAILAND = {
  id: 'thailand',
  country: 'Thailand',
  city: 'Bangkok',
  title: 'The Emerald Deva',
  cover: 'cover.png',
  caseNo: 'Case file 01 / BKK',
  intro: "Bangkok. The Riverlight Gallery's one-night exhibition 'Gems of Siam' ended in scandal: the Emerald Deva, a priceless golden amulet on loan from a private collection in Chiang Mai, vanished from a sealed glass case between 21:40 and 21:55. Four people had motive and opportunity. You have one night, an open city, and a notebook. Find the amulet. Find the thief.",
  howTo: "Work the city. Each location hides evidence in the scene itself - sweep the picture and open every marker. Question the people you meet. Everything you find is filed to your case board. When the board tells one story, name the thief and prove it with your own evidence.",

  suspects: [
    {
      id: 'niran',
      name: 'Niran Chaiyaporn',
      role: 'Gallery curator',
      image: 'sus-niran.png',
      bio: "The exhibition was her career-defining night, and its ruin. One of two people with the case code - and the gallery's insurance doubles if a piece is stolen while on foreign loan."
    },
    {
      id: 'viktor',
      name: 'Viktor Hale',
      role: 'Collector',
      image: 'sus-viktor.png',
      bio: "Offered to buy the Emerald Deva three times and was refused three times. He told the owner: 'Everything in Bangkok is for sale. Some things just change hands quietly.'"
    },
    {
      id: 'malee',
      name: 'Malee Srisuwan',
      role: 'Art restorer',
      image: 'sus-malee.png',
      bio: "Prepared the amulet's mount and handled it for two days before the exhibition. Quiet, precise - and, according to gallery gossip, deeply in debt."
    },
    {
      id: 'tuk',
      name: 'Arthit "Tuk" Boonmee',
      role: 'Tuk-tuk driver',
      image: 'sus-tuk.png',
      bio: "The gallery's regular driver on exhibition night. He saw everyone come and go - and says nothing, unless you ask him the right way."
    }
  ],

  locations: [
    {
      id: 'gallery',
      name: 'Riverlight Gallery',
      time: '21:55',
      image: 'loc-gallery.png',
      blurb: 'The crime scene. The empty case is still under its spotlight.',
      description: "The hall has been cleared of guests. The display case stands open, glass unbroken, silk banners stirring in the air conditioning. A uniformed officer nods you through.",
      map: { x: 62, y: 22 },
      searches: [
        {
          id: 'clue-code', x: 50, y: 66,
          title: 'The keypad',
          text: "The case was opened with its own keypad code - no forced entry. Only two people ever had it: curator Niran Chaiyaporn, and restorer Malee Srisuwan, who punched it in on installation day under supervision."
        },
        {
          id: 'clue-wax', x: 46, y: 40,
          title: 'A green smear',
          text: "A faint smear of green mounting wax on the case's inner rim. Restorers use it to seat gems in their mounts. It is not on the exhibition's materials inventory - it should never have been in that case."
        },
        {
          id: 'clue-cctv', x: 88, y: 9,
          title: 'The camera gap',
          text: "The corridor camera replayed a 15-minute loop between 21:40 and 21:55. Looping the feed needs a key that hangs in the curator's office - the same room where the installation crew left their bags for two days."
        },
        {
          id: 'clue-photo', x: 84, y: 82,
          title: "A guest's photograph",
          text: "A guest's phone photo, timestamped 21:52, shows Niran in the front lobby mid-argument with the caterer - on the far side of the building from the corridor, three minutes before the camera loop ended."
        }
      ],
      flavor: [
        { id: 'fl-gallery-banners', x: 22, y: 42, title: 'Silk banners', text: "Gold lotus on teal silk, on loan from the Chiang Mai pavilion along with the Deva. They are the only things in the room not insured." },
        { id: 'fl-gallery-bench', x: 94, y: 58, title: 'The viewing bench', text: "Two hundred guests stood here three hours ago. Nobody remembers the case being opened. Nobody ever looks at the thing until it is gone." }
      ],
      person: {
        suspectId: 'niran',
        intro: "Niran stands by the empty case, answering the same police question for the third time. She waves you over, grateful for a new face.",
        questions: [
          {
            q: "Who could open that case?",
            a: "'Me. And Malee used the code on installation day while I watched her. I changed nothing after. If the insurance doubled when things were stolen, detective, half my job would be planning thefts. Check the lobby cameras - I was fighting a caterer all evening.'"
          },
          {
            q: "Who wanted the amulet gone?",
            a: "'Viktor Hale, obviously. He has tried to buy it for years. But Viktor buys things. It is his whole religion - he believes ownership purifies theft. Taking it from a case would bore him.'"
          },
          {
            q: "Anything unusual about the setup?",
            a: "'The mount. Malee re-seated the Deva twice. She said the wax was not holding in the humidity. At the time I thought she was a perfectionist.'",
            clueId: 'clue-mount-remark'
          }
        ]
      }
    },
    {
      id: 'pier',
      name: 'Chao Phraya Pier',
      time: '22:05',
      image: 'loc-pier.png',
      blurb: 'Ferries cross the river all night. Someone crossed in a hurry.',
      description: "Longtail boats knock against the pontoon. The ticket seller remembers the night well: rain, festival crowds, and one passenger who did not want to be remembered.",
      map: { x: 52, y: 44 },
      searches: [
        {
          id: 'clue-ferry', x: 64, y: 56,
          title: 'The 22:05 crossing',
          text: "The ticket seller remembers a woman boarding the 22:05 cross-river ferry - hood up against the rain, a Riverlight Gallery tote over her shoulder, carrying a small flat case 'like a chocolate box'. Staff totes were handed out to the whole installation crew."
        },
        {
          id: 'clue-pier-timeline', x: 40, y: 72,
          title: 'The timeline',
          text: "From the gallery's service door to this pier is eleven minutes on foot, six by tuk-tuk. Whoever looped the camera at 21:55 could have made the 22:05 ferry - but only just, and only with a driver waiting."
        }
      ],
      flavor: [
        { id: 'fl-pier-kiosk', x: 16, y: 48, title: 'The ticket kiosk', text: "The seller's ledger is a school notebook. Every crossing of the night is in it, in pencil, in order. The 22:05 line has a fingerprint in ticket ink." },
        { id: 'fl-pier-temple', x: 80, y: 18, title: 'Wat Arun across the river', text: "The temple of dawn, lit for the festival. From the far bank the gallery is a ten-minute walk. Whoever crossed was going somewhere quiet." }
      ]
    },
    {
      id: 'studio',
      name: 'Restoration Studio',
      time: '23:10',
      image: 'loc-studio.png',
      blurb: "Malee's workshop off Charoen Krung. The lamp is still warm.",
      description: "A shophouse workshop that smells of solvent and wax. The magnifying lamp over the workbench is still warm. Malee is not here - and has not been, the neighbor says, since yesterday afternoon.",
      map: { x: 38, y: 28 },
      searches: [
        {
          id: 'clue-wax-match', x: 52, y: 74,
          title: 'The workbench',
          text: "Sticks of green mounting wax in an unusual jade tint - a conservator's blend made for humid climates. The same tint as the smear inside the display case."
        },
        {
          id: 'clue-replica', x: 80, y: 64,
          title: 'The drawer',
          text: "A workbench drawer holds sketches and clay studies of the Emerald Deva, measurements to the half-millimeter - everything needed to build a convincing replica. The replica itself is gone from its cradle."
        },
        {
          id: 'clue-strongbox', x: 9, y: 86,
          title: 'The bin',
          text: "In the bin: a receipt from a riverside deposit company, dated yesterday morning, for a small locked strongbox - rented for one week, paid in cash."
        },
        {
          id: 'clue-debt', x: 24, y: 68,
          title: 'The ledger',
          text: "Her household ledger, open on the desk. Three months of loan repayments circled in red, and one line underlined twice: 'Deva insurance valuation - 40 million baht.'"
        }
      ],
      flavor: [
        { id: 'fl-studio-head', x: 34, y: 54, title: 'The Buddha head', text: "A nineteenth-century fragment she was stabilizing for a temple, unpaid. 'Temple work is merit,' the neighbor shrugs. 'Merit does not pay loans.'" },
        { id: 'fl-studio-lamp', x: 27, y: 28, title: 'The magnifying lamp', text: "Still warm. Whoever worked here left in a hurry and did not expect company." }
      ]
    },
    {
      id: 'market',
      name: 'Chatuchak Night Market',
      time: '23:00',
      image: 'loc-market.png',
      blurb: 'Someone tried to sell a temple piece here at 23:00.',
      description: "Lanterns, steam, a hundred stalls. The antiques dealer recognizes the photograph of the amulet before you finish the question - and laughs.",
      map: { x: 24, y: 58 },
      searches: [
        {
          id: 'clue-market-offer', x: 14, y: 62,
          title: 'The offer',
          text: "At 23:00 a nervous young man offered the dealer 'a temple piece, emerald, real gold' for an absurdly low price. The dealer refused - no papers. But he handles real amulets daily, and his description is precise: the piece was the wrong weight, the emerald glass. A replica."
        },
        {
          id: 'clue-market-seller', x: 56, y: 44,
          title: 'The seller',
          text: "The seller kept saying he 'needed it gone before morning'. He parked his tuk-tuk at the alley mouth and left the engine running."
        }
      ],
      flavor: [
        { id: 'fl-market-lanterns', x: 10, y: 14, title: 'Festival lanterns', text: "Loy Krathong week. Half the city is on the streets and every third person carries something wrapped in cloth. A thief could vanish here in seconds." },
        { id: 'fl-market-steam', x: 90, y: 44, title: 'The soup cart', text: "The vendor saw nothing. He saw everything, actually, but soup waits for no one and neither does his memory." }
      ]
    },
    {
      id: 'bar',
      name: 'Mekhong Riverside Bar',
      time: '23:30',
      image: 'loc-bar.png',
      blurb: "Viktor Hale's table, his whiskey, his alibi.",
      description: "Low tables, hanging bulbs, temple spires across the water. Viktor Hale holds court at his usual table and does not look like a man hiding anything.",
      map: { x: 78, y: 46 },
      searches: [
        {
          id: 'clue-viktor-alibi', x: 56, y: 86,
          title: 'The bar tab',
          text: "Viktor's tab runs 20:00 to 23:00 without a gap - three bottles, six guests, a waiter who never left his section. At 21:45 he was mid-toast, in front of a dozen people."
        },
        {
          id: 'clue-viktor-plan', x: 9, y: 56,
          title: 'What Viktor was overheard saying',
          text: "'Within a month I will own the Deva legally, at half price. The owner's debts do the stealing for you.' Motive, loudly stated - and a plan that required the amulet to stay exactly where it was."
        }
      ],
      flavor: [
        { id: 'fl-bar-temple', x: 76, y: 28, title: 'The view', text: "His table faces the temple, not the gallery. A man waiting for bad news does not choose the pretty chair." },
        { id: 'fl-bar-bulbs', x: 34, y: 16, title: 'Hanging bulbs', text: "The waiters know him by drink and by decade. Whatever Viktor Hale is, here, he is a regular - and regulars get remembered." }
      ],
      person: {
        suspectId: 'viktor',
        intro: "Viktor gestures at the empty chair across from him, amused. He has clearly been expecting a detective.",
        questions: [
          {
            q: "Did you take the amulet?",
            a: "'Detective, I am a collector. Theft is what happens to people who cannot afford patience. I had already bought the owner's debts - the Deva was coming to me gift-wrapped by a bank. Why would I steal my own birthday present?'"
          },
          {
            q: "Who do you think took it?",
            a: "'Ask who touched it last. These things are always inside jobs, and the inside of that exhibition was built by one very quiet woman with wax under her fingernails.'"
          }
        ]
      }
    },
    {
      id: 'tuktuk',
      name: 'Tuk-tuk Stand, Charoen Krung',
      time: '23:45',
      image: 'loc-tuktuk.png',
      blurb: 'Tuk saw everyone that night. Make him talk.',
      description: "A rank of tuk-tuks under a flickering streetlight, rain starting again. Tuk polishes his handlebars with great dedication and does not meet your eye.",
      map: { x: 45, y: 66 },
      searches: [
        {
          id: 'clue-tuk-log', x: 42, y: 38,
          title: 'The fare log',
          text: "Tuk's phone fare log: one unlogged cash ride at 21:50, gallery service door to Chao Phraya Pier. He marked it 'private'. Six minutes - matching the pier timeline exactly."
        }
      ],
      flavor: [
        { id: 'fl-tuk-temple', x: 68, y: 28, title: 'The Grand Palace', text: "Lit gold against the rain. The driver's seat of a tuk-tuk faces this view all night. Tuk prefers the handlebars." },
        { id: 'fl-tuk-light', x: 26, y: 10, title: 'The streetlight', text: "It flickers every few seconds. Enough light to read a fare log. Not enough to read a face - which is why people hire this corner." }
      ],
      person: {
        suspectId: 'tuk',
        intro: "You mention the antiques dealer at the night market. Tuk stops polishing. The story comes out of him like a kicked door.",
        questions: [
          {
            q: "The 21:50 fare. Who was it?",
            a: "'Khun Malee. The restorer. Hood up, holding a flat case against her chest like a baby. She said step on it, the ferry waits for no one. I waited at the pier like she asked - she never came back across.'",
            clueId: 'clue-tuk-fare'
          },
          {
            q: "And the thing you tried to sell at the market?",
            a: "'She gave me a parcel for the river - said it was a failed copy, bad luck to keep, throw it in. I opened it. It looked like gold, detective, and I am only human. The dealer said glass. So yes: she made a copy of the Deva, and the real one crossed the river with her.'",
            clueId: 'clue-tuk-confession'
          }
        ]
      }
    }
  ],

  // Case-board relations: clues that prove each other, drawn as strings on the board.
  links: [
    ['clue-wax', 'clue-wax-match'],
    ['clue-code', 'clue-cctv'],
    ['clue-mount-remark', 'clue-wax-match'],
    ['clue-ferry', 'clue-pier-timeline'],
    ['clue-pier-timeline', 'clue-tuk-log'],
    ['clue-tuk-log', 'clue-tuk-fare'],
    ['clue-tuk-fare', 'clue-ferry'],
    ['clue-replica', 'clue-market-offer'],
    ['clue-market-offer', 'clue-tuk-confession'],
    ['clue-debt', 'clue-strongbox'],
    ['clue-replica', 'clue-tuk-confession']
  ],

  // Accusation phase
  culprit: 'malee',
  // The convicting evidence: the player must present BOTH from their notebook.
  evidenceAnswer: ['clue-wax-match', 'clue-tuk-confession'],
  evidenceHint: 'The strongest proof is physical - and someone, eventually, told you the truth.',
  deduction: [
    {
      question: 'What physically ties the thief to the display case?',
      options: [
        'The jade-green mounting wax inside the case',
        "The curator's office key",
        'The doubled insurance clause'
      ],
      correct: 0,
      explain: "The wax is a restorer's material, in Malee's own unusual blend - and it was never on the exhibition inventory."
    },
    {
      question: 'Where did the Emerald Deva go after the gallery?',
      options: [
        'Into the night market to be sold',
        'Across the river on the 22:05 ferry',
        "Into Viktor Hale's hotel safe"
      ],
      correct: 1,
      explain: "Tuk drove Malee to the pier at 21:50. She boarded the 22:05 ferry with a flat case - the market piece was only the replica she told him to dump."
    }
  ],
  winText: "Dawn. Police meet the first ferry back across the river, and Malee Srisuwan does not run. In the strongbox by the water they find the Emerald Deva, wrapped in a Riverlight Gallery tote. The replica - the one she re-seated twice and could not make hold in the humidity - was meant to buy her a week. It bought her eleven hours. The Deva goes home to Chiang Mai. You go home for breakfast. Case closed.",
  loseText: "The accusation collapses under its own weight. The evidence points somewhere else - and somewhere across the river, the real thief watches the news and smiles. Reopen the notebook, retrace the night, and try again."
};
