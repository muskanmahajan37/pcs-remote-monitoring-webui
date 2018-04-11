// Copyright (c) Microsoft. All rights reserved.

import React from "react";

import { Svg } from 'components/shared/svg/svg';
import { svgs } from 'utilities';

import '../cellRenderer.css';

export const ProfileStatusRenderer = ({ value, context: { t } }) => (
  <div className={`pcs-renderer-cell ${value ? 'highlight' : ''}`}>
    <Svg path={ value ? svgs.profileEnabled : svgs.profileDisabled } className="pcs-renderer-icon" />
    <div className="pcs-renderer-text uppercase">
      { value ? t('profiles.grid.enabled') : t('profiles.grid.disabled') }
    </div>
  </div>
);
