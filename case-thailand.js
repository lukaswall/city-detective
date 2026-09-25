// CASE: Thailand - Bangkok - "The Emerald Deva"
// Data-only file: the engine reads this structure, so new cases need no code changes.
window.CASE_THAILAND = {
  id: 'thailand',
  country: 'Thailand',
  city: 'Bangkok',
  title: 'The Emerald Deva',
  cover: 'cover.png',
  intro: "Bangkok. The Riverlight Gallery's one-night exhibition 'Gems of Siam' ended in scandal: the Emerald Deva, a priceless golden amulet on loan from a private collection in Chiang Mai, vanished from a sealed glass case between 21:40 and 21:55. Four people had motive and opportunity. You have one night, an open city, and a notebook. Find the amulet. Find the thief.",
  howTo: "Visit locations to search for clues and question people. Everything you find goes into your notebook. When you have seen enough, make an accusation - but you only get one clean shot, so check your evidence first.",

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
      image: 'loc-gallery.png',
      blurb: 'The crime scene. The empty case is still under its spotlight.',
      description: "The hall has been cleared of guests. The display case stands open, glass unbroken, silk banners stirring in the air conditioning. A uniformed officer nods you through.",
      searches: [
        {
          id: 'clue-code',
          title: 'The keypad',
          text: "The case was opened with its own keypad code - no forced entry. Only two people ever had it: curator Niran Chaiyaporn, and restorer Malee Srisuwan, who punched it in on installation day under supervision."
        },
        {
          id: 'clue-wax',
          title: 'A green smear',
          text: "A faint smear of green mounting wax on the case's inner rim. Restorers use it to seat gems in their mounts. It is not on the exhibition's materials inventory - it should never have been in that case."
        },
        {
          id: 'clue-cctv',
          title: 'The camera gap',
          text: "The corridor camera replayed a 15-minute loop between 21:40 and 21:55. Looping the feed needs a key that hangs in the curator's office - the same room where the installation crew left their bags for two days."
        },
        {
          id: 'clue-photo',
          title: 'A guest\'s photograph',
          text: "A guest's phone photo, timestamped 21:52, shows Niran in the front lobby mid-argument with the caterer - on the far side of the building from the corridor, three minutes before the camera loop ended."
        }
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
            a: "'The mount. Malee re-seated the Deva twice. She said the wax was not holding in the humidity. At the time I thought she was a perfectionist.'"
          }
        ]
      }
    },
    {
      id: 'pier',
      name: 'Chao Phraya Pier',
      image: 'loc-pier.png',
      blurb: 'Ferries cross the river all night. Someone crossed in a hurry.',
      description: "Longtail boats knock against the pontoon. The ticket seller remembers the night well: rain, festival crowds, and one passenger who did not want to be remembered.",
      searches: [
        {
          id: 'clue-ferry',
          title: 'The 22:05 crossing',
          text: "The ticket seller remembers a woman boarding the 22:05 cross-river ferry - hood up against the rain, a Riverlight Gallery tote over her shoulder, carrying a small flat case 'like a chocolate box'. Staff totes were handed out to the whole installation crew."
        },
        {
          id: 'clue-pier-timeline',
          title: 'The timeline',
          text: "From the gallery's service door to this pier is eleven minutes on foot, six by tuk-tuk. Whoever looped the camera at 21:55 could have made the 22:05 ferry - but only just, and only with a driver waiting."
        }
      ]
    },
    {
      id: 'studio',
      name: 'Restoration Studio',
      image: 'loc-studio.png',
      blurb: "Malee's workshop off Charoen Krung. The lamp is still warm.",
      description: "A shophouse workshop that smells of solvent and wax. The magnifying lamp over the workbench is still warm. Malee is not here - and has not been, the neighbor says, since yesterday afternoon.",
      searches: [
        {
          id: 'clue-wax-match',
          title: 'The workbench',
          text: "Sticks of green mounting wax in an unusual jade tint - a conservator's blend made for humid climates. The same tint as the smear inside the display case."
        },
        {
          id: 'clue-replica',
          title: 'The drawer',
          text: "A workbench drawer holds sketches and clay studies of the Emerald Deva, measurements to the half-millimeter - everything needed to build a convincing replica. The replica itself is gone from its cradle."
        },
        {
          id: 'clue-strongbox',
          title: 'The bin',
          text: "In the bin: a receipt from a riverside deposit company, dated yesterday morning, for a small locked strongbox - rented for one week, paid in cash."
        },
        {
          id: 'clue-debt',
          title: 'The ledger',
          text: "Her household ledger, open on the desk. Three months of loan repayments circled in red, and one line underlined twice: 'Deva insurance valuation - 40 million baht.'"
        }
      ]
    },
    {
      id: 'market',
      name: 'Chatuchak Night Market',
      image: 'loc-market.png',
      blurb: 'Someone tried to sell a temple piece here at 23:00.',
      description: "Lanterns, steam, a hundred stalls. The antiques dealer recognizes the photograph of the amulet before you finish the question - and laughs.",
      searches: [
        {
          id: 'clue-market-offer',
          title: 'The offer',
          text: "At 23:00 a nervous young man offered the dealer 'a temple piece, emerald, real gold' for an absurdly low price. The dealer refused - no papers. But he handles real amulets daily, and his description is precise: the piece was the wrong weight, the emerald glass. A replica."
        },
        {
          id: 'clue-market-seller',
          title: 'The seller',
          text: "The seller kept saying he 'needed it gone before morning'. He parked his tuk-tuk at the alley mouth and left the engine running."
        }
      ]
    },
    {
      id: 'bar',
      name: 'Mekhong Riverside Bar',
      image: 'loc-bar.png',
      blurb: "Viktor Hale's table, his whiskey, his alibi.",
      description: "Low tables, hanging bulbs, temple spires across the water. Viktor Hale holds court at his usual table and does not look like a man hiding anything.",
      searches: [
        {
          id: 'clue-viktor-alibi',
          title: 'The bar tab',
          text: "Viktor's tab runs 20:00 to 23:00 without a gap - three bottles, six guests, a waiter who never left his section. At 21:45 he was mid-toast, in front of a dozen people."
        },
        {
          id: 'clue-viktor-plan',
          title: 'What Viktor was overheard saying',
          text: "'Within a month I will own the Deva legally, at half price. The owner's debts do the stealing for you.' Motive, loudly stated - and a plan that required the amulet to stay exactly where it was."
        }
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
      image: 'loc-tuktuk.png',
      blurb: 'Tuk saw everyone that night. Make him talk.',
      description: "A rank of tuk-tuks under a flickering streetlight, rain starting again. Tuk polishes his handlebars with great dedication and does not meet your eye.",
      searches: [
        {
          id: 'clue-tuk-log',
          title: 'The fare log',
          text: "Tuk's phone fare log: one unlogged cash ride at 21:50, gallery service door to Chao Phraya Pier. He marked it 'private'. Six minutes - matching the pier timeline exactly."
        }
      ],
      person: {
        suspectId: 'tuk',
        intro: "You mention the antiques dealer at the night market. Tuk stops polishing. The story comes out of him like a kicked door.",
        questions: [
          {
            q: "The 21:50 fare. Who was it?",
            a: "'Khun Malee. The restorer. Hood up, holding a flat case against her chest like a baby. She said step on it, the ferry waits for no one. I waited at the pier like she asked - she never came back across.'"
          },
          {
            q: "And the thing you tried to sell at the market?",
            a: "'She gave me a parcel for the river - said it was a failed copy, bad luck to keep, throw it in. I opened it. It looked like gold, detective, and I am only human. The dealer said glass. So yes: she made a copy of the Deva, and the real one crossed the river with her.'",
            clue: true
          }
        ]
      }
    }
  ],

  // Accusation phase
  culprit: 'malee',
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
