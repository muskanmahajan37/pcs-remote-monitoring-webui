// Copyright (c) Microsoft. All rights reserved.

import React from 'react';
import PropTypes from 'prop-types';

import { joinClasses } from 'utilities';

import './styles/basicGrid.css';

export const BasicGrid = (props) => (
  <div className={joinClasses('basic-grid-container', props.className)}>{props.children}</div>
);

BasicGrid.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};
