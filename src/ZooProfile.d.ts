export type ZooProfileDefinition = {
    id: string,
    name: string,
    color: number,
    private: boolean,
    viewable: null | boolean,
    current: boolean,
    score: number,
    icon: {
        emoji: string,
        parsed: string
    }
};

export type ZooProfileError = {
    name: string,
    msg: string,
    login: undefined | boolean,
    invalid: undefined | boolean,
    error: string
};

export type UnviewableZooProfile = {
    viewable: false,
    id: string,
    userID: string,
    name: string,
    color: null | string,
    private: boolean,
    score: number,
    cosmeticIcon: null | string
};
export type ZooProfile = {
    id: string,
    userID: string,
    profileID: string,
    selectedProfile: string,
    profiles: string[],
    user: {
        avatar: string
    },
    name: string,
    nickname: string,
    color: null | string,
    owner: boolean,
    private: boolean,
    score: number,
    completion: number,
    uniqueAnimals: {
        common: number,
        rare: number,
        total: number
    },
    totalAnimals: {
        common: number,
        rare: number
    },
    totalItems: number,
    totalCosmetics: number,
    totalTrophies: number,
    equippedRelic: null | string,
    equippedCosmetic: null | string,
    equippedLeader: null | string,
    cosmeticIcon: null | string,
    notifications: number,
    autoRescues: number,
    animals: {
        name: string,
        amount: number,
        emoji: string,
        emojiName: string,
        family: string,
        rare: boolean,
        pinned: boolean
    }[],
    items: {
        name: string,
        amount: number,
        emoji: string,
        highlight: boolean,
        description: string,
        timesUsed: number,
        notCounted: undefined | boolean,
        unlisted: undefined | boolean
    }[],
    relics: {
        name: string,
        emoji: string,
        description: string
    }[],
    cosmetics: {
        name: string,
        emoji: string,
        trophy: undefined | number
    }[],
    leaders: {
        name: string,
        emoji: string
    }[],
    quests: {
        name: string,
        type: string,
        emoji: string,
        days: number,
        completed: number
    }[],
    quest: null | {
        type: string,
        animal: string,
        family: string
    },
    // TODO: idk the type for these 2 yet
    curse: null | unknown,
    stats: unknown[],
    goals: {
        name: string,
        emoji: string,
        tier: string,
        tierNumber: number,
        target: number,
        desc: string,
        count: number,
        complete: boolean
    }[],
    goalTiers: number,
    goalsComplete: number,
    extraData: ([ string, string ] | [ string, string, number ])[],
    settings: {
        altTimestamp: boolean,
        fastConfirmations: boolean,
        disableNotifications: boolean,
        disableAutoResuces: boolean,
        disableQuestNotifications: boolean,
        disableCustomColor: boolean
    }
};
