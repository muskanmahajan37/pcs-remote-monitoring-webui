// Copyright (c) Microsoft. All rights reserved.

import React from 'react';
import PropTypes from 'prop-types';

import { FormSection, SectionHeader, SectionDesc } from 'components/shared';

export const Section = (props) => (
  <FormSection>
    <SectionHeader>{props.title}</SectionHeader>
    <SectionDesc>{props.description}</SectionDesc>
    <div className="section-content">
      {props.children}
    </div>
  </FormSection>
);

Section.propTypes = {
  children: PropTypes.node,
  description: PropTypes.string,
  title: PropTypes.string
};
