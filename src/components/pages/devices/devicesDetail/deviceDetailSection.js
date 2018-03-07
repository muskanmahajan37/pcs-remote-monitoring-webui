// Copyright (c) Microsoft. All rights reserved.

import React from 'react';
import PropTypes from 'prop-types';

import './devicesDetail.css';
import { SectionHeader, SectionDesc, FormSection } from 'components/shared';

export const DevicesDetailSection = (props) => (
  <div className='devices-detail-section'>
    <SectionHeader>{props.title}</SectionHeader>
    <SectionDesc>{props.description}</SectionDesc>
    <FormSection>{props.children}</FormSection>
  </div>
);

SectionHeader.propTypes = {
  children: PropTypes.node,
  description: PropTypes.string,
  title: PropTypes.string
};
