// Copyright (c) Microsoft. All rights reserved.

import React from 'react';
import { ProfilesContainer } from './profiles.container';
import { mount } from 'enzyme';
import MockApp from 'components/mocks/mockApp';

describe('Profiles Component', () => {
  it('Renders without crashing', () => {
    const wrapper = mount(
      <MockApp>
        <ProfilesContainer />
      </MockApp>
    );
  });
});
