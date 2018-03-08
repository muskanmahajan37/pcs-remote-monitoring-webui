// Copyright (c) Microsoft. All rights reserved.

import React from 'react';
import PropTypes from 'prop-types';

import { FormSection, SectionHeader, SectionDesc } from 'components/shared';

export const Section = (props) => (
  <FormSection>
    <SectionHeader>{props.title}</SectionHeader>
    <SectionDesc>{props.description}</SectionDesc>
    {props.children}
  </FormSection>
);

Section.propTypes = {
  children: PropTypes.node,
  description: PropTypes.string,
  title: PropTypes.string
};
