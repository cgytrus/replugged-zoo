import { webpack, common, components } from 'replugged';
const { React, flux, parser } = common;
const Flux = flux;
const { Loader, Divider, Text, FormText, Notice } = components;
import profileStore from '../profileStore.js';
import Messages from '../i18n.js';

import './Profile.css';

const classes = {};
function waitForByProps(...args) {
    return webpack.waitForModule(webpack.filters.byProps(...args));
}

// all will probably resolve at the same time, but they're seperate queries to it's best to do this
Promise.all([
    waitForByProps('tabBar', 'tabBarItem', 'root'),
    waitForByProps('userInfoSectionHeader'),
    waitForByProps('scrollerBase', 'thin')
])
.then(([userProfileTabBar, userProfileInfo, userProfileScroller]) => {
    // can't wait for this one bc it will only give the 1st one that loads
    const userProfileHeader = webpack.getByProps(['eyebrow'], { all: true })[2];

    classes.userProfileTabBar = userProfileTabBar.tabBar;
    classes.userProfileTabBarItem = userProfileTabBar.tabBarItem;

    classes.infoScroller = `${userProfileInfo.infoScroller} ${userProfileScroller.thin} ${userProfileScroller.fade}`;
    classes.userInfoSectionHeader = `${userProfileInfo.userInfoSectionHeader} ${userProfileHeader.eyebrow}`;
    classes.userInfoText = `${userProfileInfo.userInfoText} ${webpack.getByProps('markup').markup}`;

    // if all above succeded, allow rendering of the profile
    classes.loaded = true;
})
.catch(e => {
    console.warn('Profile failed to get classes:', e);
    classes.loaded = -1;
});

function MinimalHeaderBlock(props) {
    try {
        const { color, name, score, cosmeticIcon } = props.profile;

        let displayName = name;
        let cosmetic = {};
        if(cosmeticIcon && parser) {
            const rules = _.pick(parser.defaultRules, [ 'text', 'emoji', 'customEmoji' ]);
            const emojiParser = parser.reactParserFor(rules);
            if(emojiParser) {
                displayName = '  ' + displayName;
                cosmetic = emojiParser(cosmeticIcon);
            }
        }

        let privateText = '';
        if(props.profile.private) {
            privateText = (<Text.Normal>(private)</Text.Normal>);
        }

        return (<div className='zoo-card zoo-section-header'>
            <Text.H1 style={{ color: `#${color}`, marginBottom: '12px' }}>{cosmetic}{displayName} {privateText}</Text.H1>
            <Text.Normal>✧ <b>{score}</b> total score</Text.Normal>
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

function HeaderBlock(props) {
    try {
        const { color, name, score, completion, uniqueAnimals, totalAnimals, cosmeticIcon } = props.profile;

        let displayName = name;
        let cosmetic = {};
        if(cosmeticIcon && parser) {
            const rules = _.pick(parser.defaultRules, [ 'text', 'emoji', 'customEmoji' ]);
            const emojiParser = parser.reactParserFor(rules);
            if(emojiParser) {
                displayName = '  ' + displayName;
                cosmetic = emojiParser(cosmeticIcon);
            }
        }

        let privateText = '';
        if(props.profile.private) {
            privateText = (<Text.Normal>(private)</Text.Normal>);
        }

        return (<div className='zoo-card zoo-section-header'>
            <Text.H1 style={{ color: `#${color}`, marginBottom: '12px' }}>{cosmetic}{displayName} {privateText}</Text.H1>
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

function AnimalsBlock(props) {
    try {
        const { animals, totalAnimals } = props.profile;

        if(animals.length == 0) {
            return ('');
        }

        let getEmoji = (text) => text;
        if(parser) {
            const rules = _.pick(parser.defaultRules, [ 'text', 'emoji', 'customEmoji' ]);
            const emojiParser = parser.reactParserFor(rules);
            if(emojiParser) {
                getEmoji = (text) => emojiParser(text);
            }
        }

        const pinnedIcon = getEmoji('📌');

        let familiesObj = {};
        animals.forEach(animal => {
            let family = familiesObj[animal.family];
            if(family === undefined) {
                family = {
                    common: undefined,
                    rare: undefined,
                    score: 0,
                    pinned: false
                };
            }
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
            familiesObj[animal.family] = family;
        });
        let families = Object.values(familiesObj);
        families.sort((a, b) => {
            if (a.pinned == b.pinned) {
                return b.score - a.score;
            }
            if (a.pinned)
                return -1;
            return 1;
        });

        const Animal = props => {
            if(props.animal === undefined) {
                props.style.opacity = 0.33;
                return (<Text.Normal style={props.style} title={props.title}>
                    {getEmoji('❓')} Undiscovered
                </Text.Normal>);
            }
            if(props.animal.amount == 0) {
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

function ItemsBlock(props) {
    try {
        const { items, totalItems } = props.profile;

        if(items.length == 0) {
            return ('');
        }

        let getEmoji = (text) => text;
        if(parser) {
            const rules = _.pick(parser.defaultRules, [ 'text', 'emoji', 'customEmoji' ]);
            const emojiParser = parser.reactParserFor(rules);
            if(emojiParser) {
                getEmoji = (text) => emojiParser(text);
            }
        }

        const Item = props => {
            if(props.item.unlisted) {
                return (null);
            }
            if(props.item.notCounted) {
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

function RelicsBlock(props) {
    try {
        const { relics, equippedRelic } = props.profile;

        if(relics.length == 0) {
            return ('');
        }

        let getEmoji = (text) => text;
        if(parser) {
            const rules = _.pick(parser.defaultRules, [ 'text', 'emoji', 'customEmoji' ]);
            const emojiParser = parser.reactParserFor(rules);
            if(emojiParser) {
                getEmoji = (text) => emojiParser(text);
            }
        }

        const Relic = props => {
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

function CosmeticsBlock(props) {
    try {
        const { cosmetics, totalCosmetics, totalTrophies, equippedCosmetic } = props.profile;

        if(cosmetics.length == 0) {
            return ('');
        }

        let getEmoji = (text) => text;
        if(parser) {
            const rules = _.pick(parser.defaultRules, [ 'text', 'emoji', 'customEmoji' ]);
            const emojiParser = parser.reactParserFor(rules);
            if(emojiParser) {
                getEmoji = (text) => emojiParser(text);
            }
        }

        const Cosmetic = props => {
            const equipped = props.cosmetic.name == equippedCosmetic;
            let name = equipped ? (<u>{props.cosmetic.name}</u>) : props.cosmetic.name;
            return (<Text.Normal style={props.style}>
                {getEmoji(props.cosmetic.emoji)} <b className={props.cosmetic.trophy >= 2 ? 'zoo-highlight' : ''}>{name}</b>{equipped ? ' (equipped)' : ''}
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

function LeadersBlock(props) {
    try {
        const { leaders, equippedLeader } = props.profile;

        if(leaders.length == 0) {
            return ('');
        }

        let getEmoji = (text) => text;
        if(parser) {
            const rules = _.pick(parser.defaultRules, [ 'text', 'emoji', 'customEmoji' ]);
            const emojiParser = parser.reactParserFor(rules);
            if(emojiParser) {
                getEmoji = (text) => emojiParser(text);
            }
        }

        const Leader = props => {
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

function QuestsBlock(props) {
    try {
        const { quests, quest } = props.profile;

        if(quests.length == 0) {
            return ('');
        }

        let getEmoji = (text) => text;
        if(parser) {
            const rules = _.pick(parser.defaultRules, [ 'text', 'emoji', 'customEmoji' ]);
            const emojiParser = parser.reactParserFor(rules);
            if(emojiParser) {
                getEmoji = (text) => emojiParser(text);
            }
        }

        const Quest = props => {
            const current = quest && props.quest.type == quest.type;
            let name = props.quest.type[0].toUpperCase() + props.quest.type.slice(1);
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

function GoalsBlock(props) {
    try {
        const { goals, goalTiers } = props.profile;

        let getEmoji = (text) => text;
        if(parser) {
            const rules = _.pick(parser.defaultRules, [ 'text', 'emoji', 'customEmoji' ]);
            const emojiParser = parser.reactParserFor(rules);
            if(emojiParser) {
                getEmoji = (text) => emojiParser(text);
            }
        }

        const Goal = props => {
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

function MiscBlock(props) {
    try {
        const { color, notifications, extraData, settings } = props.profile;

        let getEmoji = (text) => text;
        if(parser) {
            const rules = _.pick(parser.defaultRules, [ 'text', 'emoji', 'customEmoji' ]);
            const emojiParser = parser.reactParserFor(rules);
            if(emojiParser) {
                getEmoji = (text) => emojiParser(text);
            }
        }

        const ExtraData = props => {
            const emoji = props.data.length >= 1 ? getEmoji(props.data[0]) : '';
            let name = props.data.length >= 2 ? props.data[1] : '';
            let amount = '';
            if(props.data.length >= 3) {
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
                <Text.Normal style={{ gridColumn: 1, marginBottom: '8px' }}>
                    {getEmoji('🎨')} <b>Color:</b> <span style={{ color: `#${color}` }}>#{color}</span> {settings.disableCustomColor ? '(off)' : ''}
                </Text.Normal>
                <Text.Normal style={{ gridColumn: 1, marginBottom: '8px' }}>
                    {getEmoji('🔔')} <b>Notifications:</b> {notifications} {settings.disableNotifications ? '(off)' : ''}
                </Text.Normal>
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

function Profile({ userId, profiles }) {
    React.useEffect(() => void profileStore.fetchProfiles(userId), [userId]);

    if(typeof profiles === 'undefined' || !classes.loaded) {
        return (<Loader className='zoo-section-loading' />);
    }
    else if(!profiles || classes.loaded === -1) {
        return (<div className='zoo-section-error' >
            <span className={classes.userInfoText}>An error occured. {profiles}, {classes.loaded}</span>
        </div>);
    }

    let first = true;
    return (
        <div className={classes.infoScroller} dir='ltr' style={{ 'overflow': 'hidden scroll', 'padding-right': '12px' }}>
            {profiles.map(profile => {
                let divider = (<Divider />);
                if(first)
                    divider = '';
                first = false;
                if(profile.viewable !== undefined && !profile.viewable) {
                    return (<div>
                        {divider}
                        <div className='zoo-cards'>
                            <MinimalHeaderBlock profile={profile} />
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
    ({ userId }) => ({
        profiles: profileStore.getProfiles(userId)
    })
)(React.memo(Profile));
