import { common } from 'replugged';
const { flux, fluxDispatcher } = common;

import { ZooProfileDefinition, ZooProfileError, UnviewableZooProfile, ZooProfile } from './ZooProfile';

const profiles = new Map<string, null | (ZooProfileError | UnviewableZooProfile | ZooProfile)[]>();

class ZooStore extends flux.Store {
    // ensure we have the user's profile
    async fetchProfiles(id: string) {
        // if we already have the profile or are already fetching it, do nothing
        if(profiles.has(id))
            return;

        // otherwise, start an asynchronous request for the users profile
        profiles.set(id, null);
        let profileList: false | ZooProfileDefinition[] = await fetch(`https://gdcolon.com/zoo/api/profiles/${id}`)
            .then(res => {
                if(!res.ok) {
                    if(res.status !== 404 && res.status !== 400)
                        console.warn(`profiles fetch for ${id} failed:`, res.text());
                    return false;
                }
                return res.json();
            })
            .catch(err => {
                console.warn('parsing profiles response failed:', err);
                return false;
            });

        if(!profileList || !Array.isArray(profileList)) {
            profiles.set(id, []);

            fluxDispatcher.dispatch({
                type: 'ZOO_PROFILE_FAILED',
                id: id
            });

            return;
        }

        const userProfiles = await Promise.all(profileList
            .sort((a, b) => (b.current as unknown as number) - (a.current as unknown as number))
            .map(async received => {
                if(!received.viewable) {
                    return new Promise((resolve, _) => {
                        resolve({
                            viewable: false,
                            id: received.id,
                            userID: id,
                            name: received.name,
                            color: received.color?.toString(16),
                            private: received.private,
                            score: received.score,
                            cosmeticIcon: received.icon?.emoji
                        });
                    });
                }
                return fetch(`https://gdcolon.com/zoo/api/profile/${received.id}`)
                    .then(res => {
                        if(!res.ok) {
                            if(res.status !== 404)
                                console.warn(`profile fetch for ${id} failed:`, res.text());
                            return false;
                        }
                        return res.json();
                    })
                    .catch(err => {
                        console.warn('parsing profile response failed:', err);
                        return false;
                    });
            }));

        profiles.set(id, userProfiles);

        fluxDispatcher.dispatch({
            type: 'ZOO_PROFILE_LOADED',
            id: id,
            loadedProfiles: profiles
        });
    }

    getProfiles(id: string) {
        return profiles.get(id);
    }

    // thing for Discord's devtools (ctrl+alt+O)
    __getLocalVars() {
        return { profiles };
    }
}

export default new ZooStore(fluxDispatcher, {
    // this doesn't need to do anything because i'm not using Flux as intended but idc (this just needs to be callable)
    ['ZOO_PROFILE_LOADED']: () => void 0,
    ['ZOO_PROFILE_FAILED']: () => void 0
});
