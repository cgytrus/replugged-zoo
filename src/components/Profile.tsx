import { webpack, common, components } from 'replugged';
const { React, lodash: _, flux: Flux, parser } = common;
const { Loader, Divider, Text, Notice } = components;
import profileStore from '../profileStore.js';

import { ZooProfileError, UnviewableZooProfile, ZooProfile } from '../ZooProfile';

// https://stackoverflow.com/a/51399781
type ArrayElement<ArrayType extends readonly unknown[]> =
    ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

import './Profile.css';

const classes = {
    userProfileTabBar: '',
    userProfileTabBarItem: '',
    infoScroller: '',
    userInfoSectionHeader: '',
    userInfoText: '',
    loaded: 0,
};

// all will probably resolve at the same time, but they're seperate queries to it's best to do this
Promise.all([
    webpack.waitForProps('tabBar', 'tabBarItem', 'root'),
    webpack.waitForProps('userInfoSectionHeader'),
    webpack.waitForProps('scrollerBase', 'thin')
])
.then((mods) => {
    // can't wait for this one bc it will only give the 1st one that loads
    const userProfileHeader = webpack.getByProps<{ eyebrow: string }>(['eyebrow'], { all: true })[2];

    const userProfileTabBar = (mods[0] as { tabBar: string, tabBarItem: string });
    const userProfileInfo = (mods[1] as { infoScroller: string, userInfoSectionHeader: string, userInfoText: string });
    const userProfileScroller = (mods[2] as { thin: string, fade: string });

    classes.userProfileTabBar = userProfileTabBar.tabBar;
    classes.userProfileTabBarItem = userProfileTabBar.tabBarItem;

    classes.infoScroller = `${userProfileInfo.infoScroller} ${userProfileScroller.thin} ${userProfileScroller.fade}`;
    classes.userInfoSectionHeader = `${userProfileInfo.userInfoSectionHeader} ${userProfileHeader.eyebrow}`;
    classes.userInfoText = `${userProfileInfo.userInfoText} ${webpack.getByProps<{ markup: string }>('markup')!.markup}`;

    // if all above succeded, allow rendering of the profile
    classes.loaded = 1;
})
.catch(e => {
    console.warn('Profile failed to get classes:', e);
    classes.loaded = -1;
});

let getEmoji = (text: string) : string | React.ReactElement => text;

function HeaderBlock({ profile }: { profile: UnviewableZooProfile | ZooProfile }) {
    try {
        const { color, name, score, cosmeticIcon } = profile;

        let displayName = name;
        let cosmetic: string | React.ReactElement = '';
        if(cosmeticIcon) {
            displayName = '  ' + displayName;
            cosmetic = getEmoji(cosmeticIcon);
        }

        let titleStyle: { marginBottom: string, color: undefined | string } = {
            marginBottom: '12px',
            color: undefined
        };
        if(color) {
            titleStyle.color = `#${color}`;
        }

        let privateText: string | React.ReactElement = '';
        if(profile.private) {
            privateText = (<Text.Normal>(private)</Text.Normal>);
        }

        if('viewable' in profile) {
            return (<div className='zoo-card zoo-section-header'>
                <Text.H1 style={titleStyle}>{cosmetic}{displayName} {privateText}</Text.H1>
                <Text.Normal>
                    ✧ <b>{score}</b> total score
                </Text.Normal>
            </div>);
        }

        const { completion, uniqueAnimals, totalAnimals } = profile;

        return (<div className='zoo-card zoo-section-header'>
            <Text.H1 style={titleStyle}>{cosmetic}{displayName} {privateText}</Text.H1>
            <Text.Normal>
                <b>{totalAnimals.common}</b> commons + <b>{totalAnimals.rare}</b> rares = ✧ <b>{score}</b> total score
                <br />
                Unique commons: <b>{uniqueAnimals.common}</b>/<b>{uniqueAnimals.total}</b>  •  
                Unique rares: <b>{uniqueAnimals.rare}</b>/<b>{uniqueAnimals.total}</b>  •  
                Completion: <b>{completion}%</b>
            </Text.Normal>
        </div>);
    }
    catch(ex) {
        console.error('Error rendering section:', ex);
        return (<div className='zoo-card zoo-section-header'>
            <Notice messageType={Notice.Types.ERROR}>
                There was an error rendering this card. Check console for details.
            </Notice>
        </div>);
    }
}

function AnimalsBlock({ profile }: { profile: ZooProfile }) {
    try {
        const { animals, totalAnimals } = profile;

        const pinnedIcon = getEmoji('📌');

        let familiesMap = new Map();
        animals.forEach(animal => {
            let family = familiesMap.has(animal.family) ? familiesMap.get(animal.family) :
                {
                    common: undefined,
                    rare: undefined,
                    score: 0,
                    pinned: false
                };
            if (animal.rare) {
                family.rare = animal;
            }
            else {
                family.common = animal;
            }
            family.score += animal.rare ? animal.amount * 5 : animal.amount;
            if(animal.pinned) {
                family.pinned = true;
            }
            familiesMap.set(animal.family, family);
        });
        let families = Array.from(familiesMap.values());
        families.sort((a, b) => {
            if (a.pinned == b.pinned) {
                return b.score - a.score;
            }
            if (a.pinned)
                return -1;
            return 1;
        });

        const Animal = (props: { animal: ArrayElement<ZooProfile['animals']>, title: string, style: React.CSSProperties | undefined }) => {
            if(props.animal === undefined) {
                if(!props.style) {
                    props.style = {};
                }
                props.style.opacity = 0.33;
                return (<Text.Normal style={props.style} title={props.title}>
                    {getEmoji('❓')} Undiscovered
                </Text.Normal>);
            }
            if(props.animal.amount == 0) {
                if(!props.style) {
                    props.style = {};
                }
                props.style.opacity = 0.33;
            }
            return (<Text.Normal style={props.style} title={props.title}>
                {getEmoji(props.animal.emoji)} {props.animal.amount}⨯ <b className={props.animal.rare ? 'zoo-highlight' : ''}>{props.animal.name}</b> {props.animal.pinned ? pinnedIcon : ''}
            </Text.Normal>);
        };

        return (<div className='zoo-card zoo-section-animals'>
            <Text.H3 style={{ marginBottom: '8px' }}>Animals ({(totalAnimals.common + totalAnimals.rare).toLocaleString()})</Text.H3>
            <div className='zoo-animals-list'>{families.flatMap(family => {
                let title = `${family.common.amount}⨯ ${family.common.name}`;
                if(family.rare) {
                    title += ` + ${family.rare.amount}⨯ ${family.rare.name}`;
                }
                title += ` = ✧ ${family.score} score`;
                return [
                    (<Animal animal={family.common} title={title} style={{ gridColumn: 1, marginBottom: '8px' }} />),
                    (<Animal animal={family.rare} title={title} style={{ gridColumn: 2, marginBottom: '8px' }} />)
                ];
            })}</div>
        </div>);
    }
    catch(ex) {
        console.error('Error rendering section:', ex);
        return (<div className='zoo-card zoo-section-animals'>
            <Notice messageType={Notice.Types.ERROR}>
                There was an error rendering this card. Check console for details.
            </Notice>
        </div>);
    }
}

function ItemsBlock({ profile }: { profile: ZooProfile }) {
    try {
        const { items, totalItems } = profile;

        const Item = (props: { item: ArrayElement<ZooProfile['items']>, style: React.CSSProperties | undefined }) => {
            if(props.item.unlisted) {
                return (null);
            }
            if(props.item.notCounted) {
                if(!props.style) {
                    props.style = {};
                }
                props.style.opacity = 0.33;
            }
            return (<Text.Normal style={props.style} title={props.item.description}>
                {getEmoji(props.item.emoji)} {props.item.amount}⨯ <b className={props.item.highlight ? 'zoo-highlight' : ''}>{props.item.name}</b>
            </Text.Normal>);
        };

        return (<div className='zoo-card zoo-section-items'>
            <Text.H3 style={{ marginBottom: '8px' }}>Items ({totalItems.toLocaleString()})</Text.H3>
            <div className='zoo-items-list'>{items.flatMap(item => (<Item item={item} style={{ marginBottom: '8px' }} />))}</div>
        </div>);
    }
    catch(ex) {
        console.error('Error rendering section:', ex);
        return (<div className='zoo-card zoo-section-items'>
            <Notice messageType={Notice.Types.ERROR}>
                There was an error rendering this card. Check console for details.
            </Notice>
        </div>);
    }
}

function RelicsBlock({ profile }: { profile: ZooProfile }) {
    try {
        const { relics, equippedRelic } = profile;

        const Relic = (props: { relic: ArrayElement<ZooProfile['relics']>, style: React.CSSProperties | undefined }) => {
            const equipped = props.relic.name == equippedRelic;
            let name = equipped ? (<u>{props.relic.name}</u>) : props.relic.name;
            return (<Text.Normal style={props.style} title={props.relic.description}>
                {getEmoji(props.relic.emoji)} <b>{name}</b>{equipped ? ' (equipped)' : ''}
            </Text.Normal>);
        };

        const sortedRelics = relics.sort((a, b) =>
            a.name == equippedRelic ? -1 :
            b.name == equippedRelic ? 1 :
            a.name.localeCompare(b.name)
        );

        return (<div className='zoo-card zoo-section-relics'>
            <Text.H3 style={{ marginBottom: '8px' }}>Relics ({relics.length.toLocaleString()})</Text.H3>
            <div className='zoo-relics-list'>{sortedRelics.flatMap(relic => (<Relic relic={relic} style={{ gridColumn: 1, marginBottom: '8px' }} />))}</div>
        </div>);
    }
    catch(ex) {
        console.error('Error rendering section:', ex);
        return (<div className='zoo-card zoo-section-relics'>
            <Notice messageType={Notice.Types.ERROR}>
                There was an error rendering this card. Check console for details.
            </Notice>
        </div>);
    }
}

function CosmeticsBlock({ profile }: { profile: ZooProfile }) {
    try {
        const { cosmetics, totalCosmetics, totalTrophies, equippedCosmetic } = profile;

        const Cosmetic = (props: { cosmetic: ArrayElement<ZooProfile['cosmetics']>, style: React.CSSProperties | undefined }) => {
            const equipped = props.cosmetic.name == equippedCosmetic;
            let name = equipped ? (<u>{props.cosmetic.name}</u>) : props.cosmetic.name;
            return (<Text.Normal style={props.style}>
                {getEmoji(props.cosmetic.emoji)} <b className={props.cosmetic.trophy && props.cosmetic.trophy >= 2 ? 'zoo-highlight' : ''}>{name}</b>{equipped ? ' (equipped)' : ''}
            </Text.Normal>);
        };

        const sortedCosmetics = cosmetics.sort((a, b) =>
            a.name == equippedCosmetic ? -1 :
            b.name == equippedCosmetic ? 1 :
            a.trophy && !b.trophy ? -1 :
            !a.trophy && b.trophy ? 1 :
            a.trophy && b.trophy && a.trophy != b.trophy ? b.trophy - a.trophy :
            a.name.localeCompare(b.name)
        );
        const useTrophies = sortedCosmetics.filter(cosmetic => cosmetic.trophy);
        const useCosmetics = sortedCosmetics.filter(cosmetic => !cosmetic.trophy);

        return (<div className='zoo-card zoo-section-cosmetics'>
            <Text.H3 style={{ marginBottom: '4px' }}>Cosmetics ({totalCosmetics.toLocaleString()})</Text.H3>
            {
                /* idfk how to format this shut up */
                totalTrophies > 0 ?
                (<div>
                    <Text.H4 style={{ marginBottom: '8px' }}>Trophies ({totalTrophies.toLocaleString()})</Text.H4>
                    <div className='zoo-trophies-list'>{useTrophies.flatMap(cosmetic => (<Cosmetic cosmetic={cosmetic} style={{ gridColumn: 1, marginBottom: '8px' }} />))}</div>
                    <Divider style={{ marginBottom: '8px' }} />
                </div>) : (<div></div>)
            }
            <div className='zoo-cosmetics-list'>{useCosmetics.flatMap(cosmetic => (<Cosmetic cosmetic={cosmetic} style={{ gridColumn: 1, marginBottom: '8px' }} />))}</div>
        </div>);
    }
    catch(ex) {
        console.error('Error rendering section:', ex);
        return (<div className='zoo-card zoo-section-cosmetics'>
            <Notice messageType={Notice.Types.ERROR}>
                There was an error rendering this card. Check console for details.
            </Notice>
        </div>);
    }
}

function LeadersBlock({ profile }: { profile: ZooProfile }) {
    try {
        const { leaders, equippedLeader } = profile;

        const Leader = (props: { leader: ArrayElement<ZooProfile['leaders']>, style: React.CSSProperties | undefined }) => {
            const equipped = props.leader.name == equippedLeader;
            let name = equipped ? (<u>{props.leader.name}</u>) : props.leader.name;
            return (<Text.Normal style={props.style}>
                {getEmoji(props.leader.emoji)} <b>{name}</b> {equipped ? '(equipped)' : ''}
            </Text.Normal>);
        };

        const sortedLeaders = leaders.sort((a, b) =>
            a.name == equippedLeader ? -1 :
            b.name == equippedLeader ? 1 :
            a.name.localeCompare(b.name)
        );

        return (<div className='zoo-card zoo-section-leaders'>
            <Text.H3 style={{ marginBottom: '8px' }}>Leaders ({leaders.length.toLocaleString()})</Text.H3>
            <div className='zoo-leaders-list'>{sortedLeaders.flatMap(leader => (<Leader leader={leader} style={{ gridColumn: 1, marginBottom: '8px' }} />))}</div>
        </div>);
    }
    catch(ex) {
        console.error('Error rendering section:', ex);
        return (<div className='zoo-card zoo-section-leaders'>
            <Notice messageType={Notice.Types.ERROR}>
                There was an error rendering this card. Check console for details.
            </Notice>
        </div>);
    }
}

function QuestsBlock({ profile }: { profile: ZooProfile }) {
    try {
        const { quests, quest } = profile;

        const Quest = (props: { quest: ArrayElement<ZooProfile['quests']>, style: React.CSSProperties | undefined }) => {
            const current = quest && props.quest.type == quest.type;
            let name: string | React.ReactElement = props.quest.type[0].toUpperCase() + props.quest.type.slice(1);
            name = current ? (<u>{name}</u>) : name;
            return (<Text.Normal style={props.style}>
                {getEmoji(props.quest.emoji)} {props.quest.completed}⨯ <b>{name}</b> {current ? `- ${quest.animal}` : ''}
            </Text.Normal>);
        };

        return (<div className='zoo-card zoo-section-quests'>
            <Text.H3 style={{ marginBottom: '8px' }}>Quests ({quests.map(a => a.completed).reduce((a, b) => a + b, 0).toLocaleString()})</Text.H3>
            <div className='zoo-quests-list'>{quests.flatMap(quest => (<Quest quest={quest} style={{ gridColumn: 1, marginBottom: '8px' }} />))}</div>
        </div>);
    }
    catch(ex) {
        console.error('Error rendering section:', ex);
        return (<div className='zoo-card zoo-section-quests'>
            <Notice messageType={Notice.Types.ERROR}>
                There was an error rendering this card. Check console for details.
            </Notice>
        </div>);
    }
}

function GoalsBlock({ profile }: { profile: ZooProfile }) {
    try {
        const { goals, goalTiers } = profile;

        const Goal = (props: { goal: ArrayElement<ZooProfile['goals']>, style: React.CSSProperties | undefined }) => {
            let countStr = props.goal.count.toLocaleString();
            if(!props.goal.complete) {
                countStr += `/${props.goal.target.toLocaleString()}`;
            }
            return (<Text.Normal style={props.style} title={props.goal.desc}>
                {props.goal.complete ? getEmoji('🏆') : ''}{getEmoji(props.goal.emoji)} <b>{props.goal.name} {props.goal.tier}</b> ({countStr})
            </Text.Normal>);
        };

        return (<div className='zoo-card zoo-section-goals'>
            <Text.H3 style={{ marginBottom: '8px' }}>Goals ({goalTiers.toLocaleString()})</Text.H3>
            <div className='zoo-goals-list'>{goals.flatMap(goal => (<Goal goal={goal} style={{ gridColumn: 1, marginBottom: '8px' }} />))}</div>
        </div>);
    }
    catch(ex) {
        console.error('Error rendering section:', ex);
        return (<div className='zoo-card zoo-section-goals'>
            <Notice messageType={Notice.Types.ERROR}>
                There was an error rendering this card. Check console for details.
            </Notice>
        </div>);
    }
}

function MiscBlock({ profile }: { profile: ZooProfile }) {
    try {
        const { color, notifications, extraData, settings } = profile;

        const ExtraData = (props: { data: ArrayElement<ZooProfile['extraData']>, style: React.CSSProperties | undefined }) => {
            const emoji = props.data.length >= 1 ? getEmoji(props.data[0]) : '';
            let name = props.data.length >= 2 ? props.data[1] : '';
            let amount = '';
            if(typeof props.data[2] !== 'undefined') {
                name += ':';
                amount = props.data[2].toLocaleString();
            }
            return (<Text.Normal style={props.style}>
                {emoji} <b>{name}</b> {amount}
            </Text.Normal>);
        };

        return (<div className='zoo-card zoo-section-misc'>
            <Text.H3 style={{ marginBottom: '8px' }}>Misc</Text.H3>
            <div className='zoo-misc-list'>
                {color ? (<Text.Normal style={{ gridColumn: 1, marginBottom: '8px' }}>
                    {getEmoji('🎨')} <b>Color:</b> <span style={{ color: `#${color}` }}>#{color}</span> {settings.disableCustomColor ? '(off)' : ''}
                </Text.Normal>) : ''}
                {notifications > 0 ? (<Text.Normal style={{ gridColumn: 1, marginBottom: '8px' }}>
                    {getEmoji('🔔')} <b>Notifications:</b> {notifications} {settings.disableNotifications ? '(off)' : ''}
                </Text.Normal>) : ''}
                {extraData.flatMap(data => (<ExtraData data={data} style={{ gridColumn: 1, marginBottom: '8px' }} />))}
            </div>
        </div>);
    }
    catch(ex) {
        console.error('Error rendering section:', ex);
        return (<div className='zoo-card zoo-section-misc'>
            <Notice messageType={Notice.Types.ERROR}>
                There was an error rendering this card. Check console for details.
            </Notice>
        </div>);
    }
}

function Profile({ userId, profiles }: { userId: string, profiles: undefined | null | (ZooProfileError | UnviewableZooProfile | ZooProfile)[] }) {
    React.useEffect(() => void profileStore.fetchProfiles(userId), [userId]);

    if(typeof profiles === 'undefined' || classes.loaded === 0) {
        return (<Loader className='zoo-section-loading' />);
    }
    else if(!profiles || classes.loaded === -1) {
        console.error('Error rendering profiles', classes.loaded, profiles);
        return (<Notice messageType={Notice.Types.ERROR}>
            There was an error rendering this user's profiles. Check console for details.
        </Notice>);
    }

    if(parser) {
        const rules = _.pick(parser.defaultRules, [ 'text', 'emoji', 'customEmoji' ]);
        const emojiParser = parser.reactParserFor(rules);
        if(emojiParser) {
            getEmoji = (text) => emojiParser(text);
        }
    }

    let first = true;
    return (
        <div className={classes.infoScroller} dir='ltr' style={{ overflow: 'hidden scroll', paddingRight: '12px' }}>
            {profiles.map(profile => {
                if(typeof profile === 'undefined') {
                    return (<Loader className='zoo-section-loading' />);
                }
                else if('error' in profile) {
                    console.error('Error rendering profile', profile);
                    return (<Notice messageType={Notice.Types.ERROR}>
                        There was an error rendering this profile. Check console for details.
                    </Notice>);
                }

                const divider = first ? '' : (<Divider />);
                first = false;

                if('viewable' in profile) {
                    return (<div>
                        {divider}
                        <div className='zoo-cards'>
                            <HeaderBlock profile={profile} />
                        </div>
                    </div>);
                }

                return (<div>
                    {divider}
                    <div className='zoo-cards'>
                        <HeaderBlock profile={profile} />
                        <AnimalsBlock profile={profile} />
                        <ItemsBlock profile={profile} />
                        <CosmeticsBlock profile={profile} />
                        <RelicsBlock profile={profile} />
                        <LeadersBlock profile={profile} />
                        <QuestsBlock profile={profile} />
                        <GoalsBlock profile={profile} />
                        <MiscBlock profile={profile} />
                    </div>
                </div>);
            })}
        </div>
    );
}

export default Flux.connectStores(
    [profileStore],
    ({ userId } : { userId: string, profiles: undefined | null | (ZooProfileError | UnviewableZooProfile | ZooProfile)[] }) => ({
        profiles: profileStore.getProfiles(userId)
    })
)(React.memo(Profile));
