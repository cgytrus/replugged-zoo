import { webpack, common } from "replugged";
const { React, flux } = common;
import profileStore from "../profileStore.js";
import Messages from "../i18n.js";

const LoadingAnimationModule = webpack.getModule(webpack.filters.byProps('WANDERING_CUBES'));
const LoadingAnimation = Object.values(LoadingAnimationModule).find(e => typeof e === 'function')

function TabBarItem({ userId, profiles }) {
    React.useEffect(() => void profileStore.fetchProfiles(userId), [userId]);

    // profile not loaded
    if(profiles === undefined)
        return React.createElement(LoadingAnimation, { type: 'pulsingEllipsis', className: 'zoo-tabitem-loading' });
    // no profile
    else if(!profiles)
        return null;

    return React.createElement(React.Fragment, {}, Messages.ZOO_TAB);
}

export default flux.connectStores(
    [profileStore],
    ({ userId }) => ({
        profiles: profileStore.getProfiles(userId)
    })
)(React.memo(TabBarItem));
