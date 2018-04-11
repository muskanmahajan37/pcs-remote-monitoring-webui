// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import {
  Flyout,
  FlyoutHeader,
  FlyoutTitle,
  FlyoutCloseBtn,
  FlyoutContent
} from 'components/shared';

export class ProfileDetails extends Component {
  render() {
    const { onClose, profile } = this.props;
    return (
      <Flyout>
        <FlyoutHeader>
          <FlyoutTitle>Profile Details</FlyoutTitle>
          <FlyoutCloseBtn onClick={onClose} />
        </FlyoutHeader>
        <FlyoutContent>
          <pre>{ JSON.stringify(profile, null, 2) }</pre>
        </FlyoutContent>
      </Flyout>
    );
  }
}
