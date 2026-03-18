// ============================================================
// PULSE — Seed Data
// Initial data loaded on first run if localStorage is empty
// ============================================================

const SEED_DATA = {
  users: [
    {
      id: "uid_001",
      username: "alex_volkov",
      email: "alex@pulse.app",
      password: "5f4dcc3b5aa765d61d8327deb882cf99", // password123
      displayName: "Alex Volkov",
      bio: "Full-stack dev & open source contributor. Building things that matter. ✦",
      website: "alexvolkov.dev",
      location: "San Francisco, CA",
      avatar: null,
      avatarColor: "#6366f1",
      followers: ["uid_002", "uid_003", "uid_004"],
      following: ["uid_002", "uid_003"],
      bookmarks: ["pid_003", "pid_005"],
      theme: "dark",
      verified: true,
      createdAt: "2024-01-10T08:00:00Z"
    },
    {
      id: "uid_002",
      username: "maya_chen",
      email: "maya@pulse.app",
      password: "5f4dcc3b5aa765d61d8327deb882cf99",
      displayName: "Maya Chen",
      bio: "Photographer & visual artist. Light is my medium. 📸 Tokyo → NYC",
      website: "mayachen.studio",
      location: "New York, NY",
      avatar: null,
      avatarColor: "#ec4899",
      followers: ["uid_001", "uid_003", "uid_005"],
      following: ["uid_001", "uid_004", "uid_005"],
      bookmarks: ["pid_001", "pid_006"],
      theme: "dark",
      verified: true,
      createdAt: "2024-01-12T09:30:00Z"
    },
    {
      id: "uid_003",
      username: "ryan_okafor",
      email: "ryan@pulse.app",
      password: "5f4dcc3b5aa765d61d8327deb882cf99",
      displayName: "Ryan Okafor",
      bio: "Movement coach & health advocate. Helping people find their edge 💪",
      website: "",
      location: "Lagos, Nigeria",
      avatar: null,
      avatarColor: "#f59e0b",
      followers: ["uid_001", "uid_002", "uid_004", "uid_005"],
      following: ["uid_001", "uid_002"],
      bookmarks: [],
      theme: "dark",
      verified: false,
      createdAt: "2024-01-18T11:00:00Z"
    },
    {
      id: "uid_004",
      username: "sofia_reyes",
      email: "sofia@pulse.app",
      password: "5f4dcc3b5aa765d61d8327deb882cf99",
      displayName: "Sofia Reyes",
      bio: "Wanderer. 68 countries and counting. Writing about the world one city at a time 🌍",
      website: "sofiawanders.com",
      location: "Currently: Lisbon, PT",
      avatar: null,
      avatarColor: "#10b981",
      followers: ["uid_002", "uid_003"],
      following: ["uid_001", "uid_003", "uid_005"],
      bookmarks: ["pid_002"],
      theme: "dark",
      verified: false,
      createdAt: "2024-02-01T14:00:00Z"
    },
    {
      id: "uid_005",
      username: "kai_tanaka",
      email: "kai@pulse.app",
      password: "5f4dcc3b5aa765d61d8327deb882cf99",
      displayName: "Kai Tanaka",
      bio: "Producer + sound designer. Music is architecture for the mind 🎧 Tokyo",
      website: "kaitanaka.music",
      location: "Tokyo, Japan",
      avatar: null,
      avatarColor: "#8b5cf6",
      followers: ["uid_002", "uid_004"],
      following: ["uid_002", "uid_003"],
      bookmarks: ["pid_001", "pid_004"],
      theme: "dark",
      verified: true,
      createdAt: "2024-02-05T07:00:00Z"
    }
  ],

  posts: [
    {
      id: "pid_001",
      authorId: "uid_001",
      content: "Just shipped a new feature for our design system — zero-dependency, pure CSS container queries. The web platform has genuinely leveled up. No more hacks. 🚀\n\n#webdev #css #frontend",
      images: [],
      likes: ["uid_002", "uid_003", "uid_005"],
      comments: [
        {
          id: "cid_001",
          authorId: "uid_002",
          content: "Container queries changed everything. The responsive patterns we can build now are incredible.",
          likes: ["uid_001"],
          createdAt: "2024-03-10T10:30:00Z"
        },
        {
          id: "cid_002",
          authorId: "uid_005",
          content: "Been waiting for this for years. CSS getting better every year.",
          likes: [],
          createdAt: "2024-03-10T11:00:00Z"
        }
      ],
      hashtags: ["webdev", "css", "frontend"],
      shares: 12,
      createdAt: "2024-03-10T09:00:00Z"
    },
    {
      id: "pid_002",
      authorId: "uid_002",
      content: "Golden hour at the Brooklyn Bridge. Shot this on film — the grain adds something digital just can't replicate. Some moments deserve patience. 📷\n\n#photography #film #nyc #goldenhour",
      images: [],
      likes: ["uid_001", "uid_003", "uid_004", "uid_005"],
      comments: [
        {
          id: "cid_003",
          authorId: "uid_004",
          content: "This is breathtaking Maya. Film has a soul.",
          likes: ["uid_002"],
          createdAt: "2024-03-11T16:00:00Z"
        }
      ],
      hashtags: ["photography", "film", "nyc", "goldenhour"],
      shares: 28,
      createdAt: "2024-03-11T15:00:00Z"
    },
    {
      id: "pid_003",
      authorId: "uid_003",
      content: "Week 12 of training complete. The discipline you build in the gym translates to every area of life. It's not about aesthetics — it's about becoming someone who shows up consistently.\n\nMorning workout ritual:\n• 5am wake up\n• Cold shower\n• Movement practice\n• Intentional nutrition\n\nConsistency > intensity. Every. Single. Time.\n\n#fitness #mindset #discipline",
      images: [],
      likes: ["uid_001", "uid_004", "uid_005"],
      comments: [
        {
          id: "cid_004",
          authorId: "uid_001",
          content: "The 5am wake up is the unlock. Everything else follows.",
          likes: ["uid_003"],
          createdAt: "2024-03-12T07:30:00Z"
        }
      ],
      hashtags: ["fitness", "mindset", "discipline"],
      shares: 45,
      createdAt: "2024-03-12T06:00:00Z"
    },
    {
      id: "pid_004",
      authorId: "uid_004",
      content: "Sitting in a tiny café in Alfama, Lisbon. Fado music drifting through the tiles. There's something about this city — it holds centuries of longing in its walls.\n\nThe Portuguese have a word: saudade. An untranslatable ache for something beautiful that is gone or perhaps never was. I feel it here.\n\n#travel #lisbon #portugal #saudade",
      images: [],
      likes: ["uid_002", "uid_005"],
      comments: [],
      hashtags: ["travel", "lisbon", "portugal", "saudade"],
      shares: 19,
      createdAt: "2024-03-13T14:00:00Z"
    },
    {
      id: "pid_005",
      authorId: "uid_005",
      content: "New EP out midnight. Four tracks, all recorded in one session at 3am. There's an energy in sleep-deprived creation that logic can't replicate.\n\nLink in bio 🖤\n\n#music #producer #ep #release",
      images: [],
      likes: ["uid_001", "uid_002", "uid_003", "uid_004"],
      comments: [
        {
          id: "cid_005",
          authorId: "uid_002",
          content: "The 3am sessions always hit different. Can't wait to listen.",
          likes: ["uid_005"],
          createdAt: "2024-03-14T00:30:00Z"
        },
        {
          id: "cid_006",
          authorId: "uid_003",
          content: "Finally 🔥🔥🔥",
          likes: [],
          createdAt: "2024-03-14T01:00:00Z"
        }
      ],
      hashtags: ["music", "producer", "ep", "release"],
      shares: 67,
      createdAt: "2024-03-14T00:00:00Z"
    },
    {
      id: "pid_006",
      authorId: "uid_001",
      content: "Hot take: the best code is the code you delete. Spent today removing 2,000 lines and the app got faster and easier to maintain. Abstraction debt is real.\n\n#programming #softwareengineering #cleancode",
      images: [],
      likes: ["uid_002", "uid_004"],
      comments: [
        {
          id: "cid_007",
          authorId: "uid_005",
          content: "Same principle applies to music production. Remove until it's perfect.",
          likes: ["uid_001"],
          createdAt: "2024-03-15T13:00:00Z"
        }
      ],
      hashtags: ["programming", "softwareengineering", "cleancode"],
      shares: 33,
      createdAt: "2024-03-15T12:00:00Z"
    },
    {
      id: "pid_007",
      authorId: "uid_002",
      content: "Started shooting with a Leica M6 this month. Manual focus only. No auto anything. It forces you to slow down and actually see the scene before capturing it. This is the way. 🤍\n\n#leica #film #photography #analog",
      images: [],
      likes: ["uid_001", "uid_003", "uid_005"],
      comments: [],
      hashtags: ["leica", "film", "photography", "analog"],
      shares: 22,
      createdAt: "2024-03-16T10:00:00Z"
    },
    {
      id: "pid_008",
      authorId: "uid_003",
      content: "Reminder: rest is training. Sleep is when adaptation happens. The workout is just the stimulus. Recovery is where you actually grow.\n\nProtect your sleep. It's the highest ROI health investment you can make.\n\n#health #recovery #sleep #performance",
      images: [],
      likes: ["uid_001", "uid_002", "uid_004"],
      comments: [],
      hashtags: ["health", "recovery", "sleep", "performance"],
      shares: 88,
      createdAt: "2024-03-17T08:00:00Z"
    }
  ],

  conversations: [
    {
      id: "conv_001",
      participants: ["uid_001", "uid_002"],
      messages: [
        {
          id: "msg_001",
          senderId: "uid_001",
          content: "Hey Maya! Your Brooklyn Bridge shot is incredible. Film really does have something special.",
          type: "text",
          readBy: ["uid_001", "uid_002"],
          createdAt: "2024-03-11T17:00:00Z"
        },
        {
          id: "msg_002",
          senderId: "uid_002",
          content: "Thank you! I used Kodak Portra 400, perfect for golden hour tones. Are you into photography at all?",
          type: "text",
          readBy: ["uid_001", "uid_002"],
          createdAt: "2024-03-11T17:05:00Z"
        },
        {
          id: "msg_003",
          senderId: "uid_001",
          content: "Mostly as a hobby. I've been meaning to try film. Any camera recommendations for a beginner?",
          type: "text",
          readBy: ["uid_001", "uid_002"],
          createdAt: "2024-03-11T17:08:00Z"
        },
        {
          id: "msg_004",
          senderId: "uid_002",
          content: "Canon AE-1! Affordable, reliable, incredible lenses. It's the perfect first film camera. You'll love the process 📷",
          type: "text",
          readBy: ["uid_001", "uid_002"],
          createdAt: "2024-03-11T17:12:00Z"
        }
      ],
      updatedAt: "2024-03-11T17:12:00Z"
    },
    {
      id: "conv_002",
      participants: ["uid_001", "uid_005"],
      messages: [
        {
          id: "msg_005",
          senderId: "uid_005",
          content: "Yo! Loved your container queries post. I've been using them for layout in my music site.",
          type: "text",
          readBy: ["uid_001", "uid_005"],
          createdAt: "2024-03-13T20:00:00Z"
        },
        {
          id: "msg_006",
          senderId: "uid_001",
          content: "That's sick! They're game-changing for component-level design. What's your setup?",
          type: "text",
          readBy: ["uid_001", "uid_005"],
          createdAt: "2024-03-13T20:10:00Z"
        },
        {
          id: "msg_007",
          senderId: "uid_005",
          content: "Pure vanilla HTML/CSS. No frameworks. The simplicity matches the music — clean signal.",
          type: "text",
          readBy: ["uid_005"],
          createdAt: "2024-03-13T20:15:00Z"
        }
      ],
      updatedAt: "2024-03-13T20:15:00Z"
    },
    {
      id: "conv_003",
      participants: ["uid_002", "uid_004"],
      messages: [
        {
          id: "msg_008",
          senderId: "uid_004",
          content: "Maya! I saw your post about the Leica M6. I used to shoot film when I traveled. There's something meditative about it.",
          type: "text",
          readBy: ["uid_002", "uid_004"],
          createdAt: "2024-03-16T12:00:00Z"
        },
        {
          id: "msg_009",
          senderId: "uid_002",
          content: "Exactly! And the limitation of 36 frames forces you to be intentional. Every shot counts.",
          type: "text",
          readBy: ["uid_002", "uid_004"],
          createdAt: "2024-03-16T12:15:00Z"
        },
        {
          id: "msg_010",
          senderId: "uid_004",
          content: "I should bring a film camera to Lisbon. The light here is phenomenal. Any recommendations for film stock?",
          type: "text",
          readBy: ["uid_004"],
          createdAt: "2024-03-16T12:20:00Z"
        }
      ],
      updatedAt: "2024-03-16T12:20:00Z"
    }
  ],

  notifications: [
    {
      id: "notif_001",
      userId: "uid_001",
      fromUserId: "uid_002",
      type: "like",
      postId: "pid_001",
      read: false,
      createdAt: "2024-03-10T10:00:00Z"
    },
    {
      id: "notif_002",
      userId: "uid_001",
      fromUserId: "uid_003",
      type: "like",
      postId: "pid_001",
      read: false,
      createdAt: "2024-03-10T10:05:00Z"
    },
    {
      id: "notif_003",
      userId: "uid_001",
      fromUserId: "uid_002",
      type: "comment",
      postId: "pid_001",
      commentId: "cid_001",
      read: true,
      createdAt: "2024-03-10T10:30:00Z"
    },
    {
      id: "notif_004",
      userId: "uid_001",
      fromUserId: "uid_004",
      type: "follow",
      postId: null,
      read: false,
      createdAt: "2024-03-11T09:00:00Z"
    },
    {
      id: "notif_005",
      userId: "uid_002",
      fromUserId: "uid_001",
      type: "like",
      postId: "pid_002",
      read: false,
      createdAt: "2024-03-11T15:30:00Z"
    },
    {
      id: "notif_006",
      userId: "uid_002",
      fromUserId: "uid_004",
      type: "comment",
      postId: "pid_002",
      commentId: "cid_003",
      read: false,
      createdAt: "2024-03-11T16:00:00Z"
    }
  ]
};
