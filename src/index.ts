import { Injector, Logger, webpack, common } from 'replugged';
const { React } = common;

// @ts-expect-error
import Profile from "./components/Profile.jsx";
// @ts-expect-error
import TabBarItem from "./components/TabBarItem.js";

const inject = new Injector();
const logger = Logger.plugin('Zoo');

// hack
// injector always re-creates the handler func so i cache it manually
// to not cause react to re-render the component
let hookedUserProfileBody: any = undefined;
let hookedUserProfileTabBar: any = undefined;

// a lot of this is copied from https://github.com/Penguin-Spy/replugged-ppl-moe
// thanks Penguin_Spy xd

export async function start(): Promise<void> {
    // @ts-expect-error
    webpack.waitForModule(webpack.filters.bySource(/;case (.+\..+\.)USER_INFO_CONNECTIONS:case (.+\..+\.)USER_INFO:default:return\(0,/), { raw: true }).then(({ exports: UserProfileModal }) => {
        inject.after(UserProfileModal, 'default', (_, res) => {
            const profileBody = res?.props?.children?.props?.children?.props?.children?.[0]?.props?.children?.props?.children?.[1]?.props?.children?.[1]?.props?.children;
            const [, UserProfileTabBar, UserProfileBody] = profileBody ?? [];

            if(!UserProfileTabBar || !UserProfileBody) {
                logger.warn('UserProfileTabBar or UserProfileBody not found! Modal:', UserProfileModal, 'TabBar, Body: ', UserProfileTabBar, UserProfileBody);
                return undefined;
            }

            if(typeof hookedUserProfileBody !== 'function') {
                inject.instead(UserProfileBody, 'type', ([ props, ...args ]: any[], fn) => {
                    if(props.selectedSection === 'ZOO') {
                        return React.createElement(Profile, { userId: props.user.id });
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
                inject.after(UserProfileTabBar, 'type', ([ props ]: any[], res) => {
                    const tabs = res?.props?.children?.props?.children;
                    const RealTabBarItem = res?.props?.children?.type?.Item;

                    if(tabs && RealTabBarItem) {
                        tabs.push(React.createElement(RealTabBarItem, {
                            className: tabs[0]?.props?.className,
                            id: 'ZOO',
                            children: React.createElement(TabBarItem, { userId: props.user.id })
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
