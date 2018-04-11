// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import { ProfilesGrid } from './profilesGrid';
import { Btn, RefreshBar, PageContent, ContextMenu } from 'components/shared';
import { ProfileDetails } from './flyouts';
import { svgs } from 'utilities';

import './profiles.css';

const closedFlyoutState = {
  flyoutOpen: false,
  selectedProfileId: undefined
};

export class Profiles extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ...closedFlyoutState,
      contextBtns: null
    };

    if (!this.props.lastUpdated) {
      this.props.fetchProfiles();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.isPending && nextProps.isPending !== this.props.isPending) {
      // If the grid data refreshes, hide the flyout and deselect soft selections
      this.setState(closedFlyoutState);
    }
  }

  changeDeviceGroup = () => {
    const { changeDeviceGroup, deviceGroups }  = this.props;
    changeDeviceGroup(deviceGroups[1].id);
  }

  closeFlyout = () => this.setState(closedFlyoutState);

  onSoftSelectChange = ({ id }) => this.setState({
    flyoutOpen: true,
    selectedProfileId: id
  });

  onContextMenuChange = contextBtns => this.setState({ contextBtns });

  getSoftSelectId = ({ id }) => id;

  render() {
    const { t, profiles, error, isPending, lastUpdated, entities, fetchProfiles } = this.props;

    const gridProps = {
      rowData: isPending ? undefined : profiles || [],
      onSoftSelectChange: this.onSoftSelectChange,
      onContextMenuChange: this.onContextMenuChange,
      softSelectId: this.state.selectedProfileId,
      getSoftSelectId: this.getSoftSelectId,
      t: this.props.t
    };
    return [
      <ContextMenu key="context-menu">
        { this.state.contextBtns }
        <Btn svg={svgs.plus}>New profile</Btn>
      </ContextMenu>,
      <PageContent className="profiles-container" key="page-content">
        <RefreshBar refresh={fetchProfiles} time={lastUpdated} isPending={isPending} t={t} />
        {
          !!error &&
          <span className="status">
            { t('errorFormat', { message: t(error.message, { message: error.errorMessage }) }) }
          </span>
        }
        { !error && <ProfilesGrid {...gridProps} /> }
        <Btn onClick={this.changeDeviceGroup}>Refresh Device Groups</Btn>
        { this.state.flyoutOpen && <ProfileDetails onClose={this.closeFlyout} profile={entities[this.state.selectedProfileId]} /> }
      </PageContent>
    ];
  }
}
