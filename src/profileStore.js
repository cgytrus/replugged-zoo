import { common } from 'replugged';
const { flux, fluxDispatcher } = common;

// list of loaded profiles
const profiles = {};
// profiles[id] == undefined means we don't know if that id has a profile
//              == false     means we know that id doesn't have a profile (or is banned)
//              == Object    the object is the user's profile (could be mostly empty)
// this allows us to use !profile to check if they have a valid profile,
// as well as differentiate between unfetched & nonexistent profiles (to know if we need to fetch it)

// list of profiles currently being fetched (or previously fetched, but that's irrelevant)
const requestedProfiles = {};
// requestingProfiles[id] == boolean
// this is necessary to prevent duplicate GET requests, as useEffect is only called after every component is rendered
// if a user has 2 messages that get rendered, both will call useEffect and be rendered, and THEN the "effect" of fetchProfile is called twice

class ZooStore extends flux.Store {
    // ensure we have the user's profile
    async fetchProfiles(id) {
        // if we already have the profile or are already fetching it, do nothing
        if(id in profiles || id in requestedProfiles)
            return;

        // otherwise, start an asynchronous request for the users profile
        requestedProfiles[id] = true;
        let profileList = await fetch(`https://gdcolon.com/zoo/api/profiles/${id}`)
            .then(res => {
                if(!res.ok) {
                    if(res.status !== 404)
                        console.warn(`profile fetch for ${id} failed:`, res.text());
                    return false;
                }
                return res.json();
            })
            .catch(err => {
                console.warn('parsing response failed:', err);
                return false;
            });

        const userProfiles = await Promise.all(profileList.sort((a, b) => b.current - a.current).map(async received => {
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
                    console.warn('parsing response failed:', err);
                    return false;
                });
        }));

        profiles[id] = userProfiles.map(profile => profile.invalid ? false : profile);

        fluxDispatcher.dispatch({
            type: 'ZOO_PROFILE_LOADED',
            id: id,
            loadedProfiles: profiles
        });
    }

    getProfiles(id) {
        return profiles[id];
    }

    // thing for Discord's devtools (ctrl+alt+O)
    __getLocalVars() {
        return { profiles, requestedProfiles };
    }
}

export default new ZooStore(fluxDispatcher, {
    ['ZOO_PROFILE_LOADED']: () => void 0 // this doesn't need to do anything because i'm not using Flux as intended but idc (this just needs to be callable)
});
