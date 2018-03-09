// Copyright (c) Microsoft. All rights reserved.

import React from 'react';
import PropTypes from 'prop-types';

import { joinClasses } from 'utilities';

import './styles/flyoutSection.css';

export const FlyoutSection = (props) => (
  <div className={joinClasses('flyout-section', props.className)}>{props.children}</div>
);

FlyoutSection.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};
