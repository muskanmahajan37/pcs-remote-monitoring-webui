// Copyright (c) Microsoft. All rights reserved.

import 'rxjs';
import { Observable } from 'rxjs';
import moment from 'moment';
import { schema, normalize } from 'normalizr';
import update from 'immutability-helper';
import { createSelector } from 'reselect';
import { ConfigService, IoTHubManagerService } from 'services';
import { getActiveDeviceGroupId, getDeviceGroupEntities } from './appReducer';
import { getItems as getDeviceIds } from './devicesReducer';
import {
  createReducerScenario,
  createEpicScenario,
  errorPendingInitialState,
  pendingReducer,
  errorReducer,
  setPending,
  getPending,
  getError
 } from 'store/utilities';

// ========================= Epics - START
const handleError = fromAction => error =>
  Observable.of(redux.actions.registerError(fromAction.type, { error, fromAction }));

export const epics = createEpicScenario({
  /** Loads the profiles */
  fetchProfiles: {
    type: 'PROFILES_FETCH',
    epic: fromAction =>
      ConfigService.getProfiles()
        .flatMap(profiles =>
          Observable.from(profiles)
            .startWith(redux.actions.updateProfiles(profiles, { fromAction }))
        )
        .catch(handleError(fromAction))
  }
});
// ========================= Epics - END

// ========================= Schemas - START
const profileSchema = new schema.Entity('profiles');
const profileListSchema = new schema.Array(profileSchema);
// ========================= Schemas - END

// ========================= Reducers - START
const initialState = { ...errorPendingInitialState, entities: {}, items: [] };

const updateProfilesReducer = (state, { payload, fromAction }) => {
  const { entities: { profiles }, result } = normalize(payload, profileListSchema);
  return update(state, {
    entities: { $set: profiles },
    items: { $set: result },
    lastUpdated: { $set: moment() },
    ...setPending(fromAction.type, false)
  });
};

const updateCountReducer = (state, { payload: { id, count } }) => update(state, {
  entities: { [id]: { count: { $set: count } } }
});

const updateLastTriggerReducer = (state, { payload: { id, lastTrigger } }) => update(state, {
  entities: { [id]: { lastTrigger: { $set: lastTrigger } } }
});

/* Action types that cause a pending flag */
const fetchableTypes = [
  epics.actionTypes.fetchProfiles
];

export const redux = createReducerScenario({
  updateProfiles: { type: 'PROFILES_UPDATE', reducer: updateProfilesReducer },
  updateProfileCount: { type: 'PROFILES_COUNT_UPDATE', reducer: updateCountReducer },
  updateProfileLastTrigger: { type: 'PROFILES_LAST_TRIGGER_UPDATE', reducer: updateLastTriggerReducer },
  registerError: { type: 'PROFILES_REDUCER_ERROR', reducer: errorReducer },
  isFetching: { multiType: fetchableTypes, reducer: pendingReducer },
});

export const reducer = { profiles: redux.getReducer(initialState) };
// ========================= Reducers - END

// ========================= Selectors - START

export const getProfilesReducer = (state) => state.profiles;
export const getEntities = state => getProfilesReducer(state).entities;
const getItems = state => getProfilesReducer(state).items;
export const getProfilesLastUpdated = state => getProfilesReducer(state).lastUpdated;
export const getProfilesError = state =>
    getError(getProfilesReducer(state), epics.actionTypes.fetchProfiles);
export const getProfilesPendingStatus = state =>
    getPending(getProfilesReducer(state), epics.actionTypes.fetchProfiles);
export const getProfiles = createSelector(
  getEntities, getItems, getActiveDeviceGroupId,
  (entities, items, deviceGroupId) =>
      items.reduce((acc, id) => {
          const profile = entities[id];
      return (profile.groupId === deviceGroupId || !deviceGroupId)
        ? [ ...acc, profile ]
        : acc
    }, [])
);
// ========================= Selectors - END
