import { Injector, Logger, webpack, common } from 'replugged';
const { React } = common;

import Profile from './components/Profile';
import TabBarItem from './components/TabBarItem';
import { AnyFunction } from 'replugged/dist/types';

const inject = new Injector();
const logger = Logger.plugin('Zoo');

// hack
// injector always re-creates the handler func so i cache it manually
// to not cause react to re-render the component
let hookedUserProfileBody: undefined | AnyFunction = undefined;
let hookedUserProfileTabBar: undefined | AnyFunction = undefined;

// a lot of this is copied from https://github.com/Penguin-Spy/replugged-ppl-moe
// thanks Penguin_Spy xd

type UserProfileTabBarType = Record<'type', AnyFunction>;
type UserProfileBodyType = Record<'type', AnyFunction>;
type UserProfileModalType = {
    props?: { children?: { props?: { children?: { props?: { children?: [
        {
            props?: { children?: { props?: { children?: [
                    unknown?,
                    {
                        props?: { children?: [
                                unknown?,
                                { props?: { children?: [unknown?, UserProfileTabBarType?, UserProfileBodyType?] } }?
                        ] }
                    }?
            ] } } }
        }?
    ] } } } } }
};

export async function start(): Promise<void> {
    // can't use await because it doesn't find the module immediately after starting but
    // only once a profile is opened
    const UserProfileModalFilter = webpack.filters.bySource(/;case (.+\..+\.)USER_INFO_CONNECTIONS:case (.+\..+\.)USER_INFO:default:return\(0,/);
    webpack.waitForModule<{ exports: Record<'default', AnyFunction> }>(UserProfileModalFilter, { raw: true })
        .then(({ exports: UserProfileModal }) => {
            inject.after(UserProfileModal, 'default', (_, res: UserProfileModalType) => {
                const [, UserProfileTabBar, UserProfileBody] = res?.props?.children?.props?.children?.props?.children?.[0]?.props?.children?.props?.children?.[1]?.props?.children?.[1]?.props?.children ?? [];

                if(!UserProfileTabBar || !UserProfileBody) {
                    logger.warn('UserProfileTabBar or UserProfileBody not found! Modal:', UserProfileModal, 'TabBar, Body: ', UserProfileTabBar, UserProfileBody);
                    return undefined;
                }

                if(typeof hookedUserProfileBody !== 'function') {
                    inject.instead(UserProfileBody, 'type', ([ props, ...args ]: [ props: { selectedSection: string, user: { id: string } }, unknown ], fn) => {
                        if(props.selectedSection === 'ZOO') {
                            return React.createElement(Profile, { userId: props.user.id, profiles: undefined });
                        }
                        return fn(props, ...args);
                    });
                    hookedUserProfileBody = UserProfileBody.type;
                }
                else {
                    UserProfileBody.type = hookedUserProfileBody;
                }

                if(typeof UserProfileTabBar.type !== 'function') {
                    return undefined;
                }

                if(typeof hookedUserProfileTabBar !== 'function') {
                    inject.after(UserProfileTabBar, 'type', (
                            [ props ]: [ props: { user: { id: string } } ],
                            res: { props?: { children?: { props?: { children?: React.ReactElement[] }, type?: { Item?: React.FunctionComponent<{ className: string, id: string, children: React.ReactElement}> } } } }
                        ) => {
                            const tabs = res?.props?.children?.props?.children;
                            const RealTabBarItem = res?.props?.children?.type?.Item;

                            if(tabs && RealTabBarItem) {
                                tabs.push(React.createElement(RealTabBarItem, {
                                    className: tabs[0]?.props?.className,
                                    id: 'ZOO',
                                    children: React.createElement(TabBarItem, { userId: props.user.id, profiles: undefined })
                                }));
                            }

                            return undefined;
                        });
                    hookedUserProfileTabBar = UserProfileTabBar.type;
                }
                else {
                    UserProfileTabBar.type = hookedUserProfileTabBar;
                }

                return undefined;
            });
        });
}

export function stop(): void {
    inject.uninjectAll();
    hookedUserProfileBody = undefined;
    hookedUserProfileTabBar = undefined;
}
