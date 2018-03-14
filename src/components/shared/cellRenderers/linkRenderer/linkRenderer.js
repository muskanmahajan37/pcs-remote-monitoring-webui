// Copyright (c) Microsoft. All rights reserved.

import React from "react";
import { NavLink } from 'react-router-dom';

import { Svg } from 'components/shared/svg/svg';
import { svgs } from 'utilities';

import '../cellRenderer.css';

export const LinkRenderer = ({ uri, context: { t }, svgPath }) => {
  return (
    <div className="pcs-renderer-cell">
      <NavLink to={uri} className="pcs-renderer-link">
        <Svg path={svgPath || svgs.ellipsis} />
      </NavLink>
    </div>
  );
};

export default LinkRenderer;
