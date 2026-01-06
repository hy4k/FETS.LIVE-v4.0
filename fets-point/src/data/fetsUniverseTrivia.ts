export interface FetsTriviaQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number; // Index of the correct option
    context: string; // Explanatory context about the website/domain
}

export const FETS_UNIVERSE_TRIVIA: FetsTriviaQuestion[] = [
    {
        id: '1',
        question: "What is the primary function of FETS.CASH?",
        options: ["Cryptocurrency Trading", "Operational Expense Management", "Payroll Processing", "Student Fee Collection"],
        correctAnswer: 1,
        context: "FETS.CASH is designed to streamline day-to-day operational expenses and petty cash management across branches."
    },
    {
        id: '2',
        question: "Which domain hosts the main student portal?",
        options: ["fets.space", "fets.live", "fets.in", "fets.org"],
        correctAnswer: 2,
        context: "FETS.IN serves as the central hub for student interactions, course materials, and academic records."
    },
    {
        id: '3',
        question: "What does FETS.SPACE primarily showcase?",
        options: ["Office Locations", "Virtual Classrooms", "The Digital Universe", "Storage Solutions"],
        correctAnswer: 2,
        context: "FETS.SPACE is the conceptual and visual representation of our digital ecosystem and future frontiers."
    },
    {
        id: '4',
        question: "Which platform is used for real-time live operations?",
        options: ["fets.stream", "fets.live", "fets.now", "fets.realtime"],
        correctAnswer: 1,
        context: "FETS.LIVE is the heartbeat of real-time operations, tracking staff, candidates, and immediate tasks."
    }
];
