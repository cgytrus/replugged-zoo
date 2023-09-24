import { webpack, common } from 'replugged';
const { React, flux } = common;
import profileStore from '../profileStore';

import { ZooProfileError, UnviewableZooProfile, ZooProfile } from '../ZooProfile';

const LoadingAnimationModule: Object = webpack.getModule(webpack.filters.byProps('WANDERING_CUBES')) || {};
const LoadingAnimation = webpack.getFunctionBySource<React.FunctionComponent<{ type: string, className: string }>>(LoadingAnimationModule, /case (.+\.)WANDERING_CUBES:/);

function TabBarItem({ userId, profiles }: { userId: string, profiles: undefined | null | (ZooProfileError | UnviewableZooProfile | ZooProfile)[] }) {
    React.useEffect(() => void profileStore.fetchProfiles(userId), [userId]);

    // profile not loaded
    if(profiles === undefined || profiles === null)
        return LoadingAnimation ? React.createElement(LoadingAnimation, { type: 'pulsingEllipsis', className: 'zoo-tabitem-loading' }) : null;
    // no profile
    else if(profiles.length == 0)
        return null;

    return React.createElement(React.Fragment, {}, 'Zoo');
}

export default flux.connectStores(
    [profileStore],
    ({ userId } : { userId: string, profiles: undefined | null | (ZooProfileError | UnviewableZooProfile | ZooProfile)[] }) => ({
        profiles: profileStore.getProfiles(userId)
    })
)(React.memo(TabBarItem));
