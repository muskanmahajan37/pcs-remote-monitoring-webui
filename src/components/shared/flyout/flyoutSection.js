// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {
  Btn,
  SectionHeader,
  SectionDesc
} from 'components/shared';
import { svgs, joinClasses } from 'utilities';

import './styles/flyoutSection.css';

export class FlyoutSection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showContent: true
    };

    this.toggleContent = this.toggleContent.bind(this);
  }

  toggleContent() {
    this.setState({ showContent: !this.state.showContent });
  }

  render() {
    const { className, title, description, children } = this.props;
    const displayContent = this.state.showContent ? {} : { display: 'none' };
    return (
      <div className={joinClasses('flyout-section', className)}>
        <SectionHeader>
          <div className="section-title" onClick={this.toggleContent}>{title}</div>
          {
            this.state.showContent
              ? <Btn onClick={this.toggleContent} svg={svgs.chevron} className="section-toggle-btn chevron-close" />
              : <Btn onClick={this.toggleContent} svg={svgs.chevron} className="section-toggle-btn chevron-open" />
          }
        </SectionHeader>

        <div className="section-content" style={displayContent}>
          {
            description &&
            <SectionDesc>{description}</SectionDesc>
          }
          {children}
        </div>
      </div>
    );
  }
}

FlyoutSection.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string
};
