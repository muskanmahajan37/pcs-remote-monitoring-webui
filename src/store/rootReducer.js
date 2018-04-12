// Copyright (c) Microsoft. All rights reserved.

import { combineReducers } from 'redux';

// Reducers
import { reducer as appReducer } from './reducers/appReducer';
import { reducer as simulationReducer } from './reducers/deviceSimulationReducer';
import { reducer as devicesReducer } from './reducers/devicesReducer';
import { reducer as rulesReducer } from './reducers/rulesReducer';
import { reducer as profilesReducer } from './reducers/profilesReducer';

const rootReducer = combineReducers({
  ...appReducer,
  ...devicesReducer,
  ...rulesReducer,
  ...profilesReducer,
  ...simulationReducer

});

export default rootReducer;
