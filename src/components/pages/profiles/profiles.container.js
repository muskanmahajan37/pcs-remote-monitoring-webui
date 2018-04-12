// Copyright (c) Microsoft. All rights reserved.

import { connect } from 'react-redux';
import { translate } from 'react-i18next';
import { Profiles } from './profiles';
import {
  epics as profilesEpics,
  getProfiles,
  getEntities,
  getProfilesError,
  getProfilesLastUpdated,
  getProfilesPendingStatus
} from 'store/reducers/profilesReducer';
import { redux as appRedux, getDeviceGroups } from 'store/reducers/appReducer';

// Pass the devices status
const mapStateToProps = state => ({
  profiles: getProfiles(state),
  entities: getEntities(state),
  error: getProfilesError(state),
  isPending: getProfilesPendingStatus(state),
  deviceGroups: getDeviceGroups(state),
  lastUpdated: getProfilesLastUpdated(state)
});

// Wrap the dispatch method
const mapDispatchToProps = dispatch => ({
    fetchProfiles: () => dispatch(profilesEpics.actions.fetchProfiles()),
    changeDeviceGroup: (id) => dispatch(appRedux.actions.updateActiveDeviceGroup(id))
});

export const ProfilesContainer = translate()(connect(mapStateToProps, mapDispatchToProps)(Profiles));
