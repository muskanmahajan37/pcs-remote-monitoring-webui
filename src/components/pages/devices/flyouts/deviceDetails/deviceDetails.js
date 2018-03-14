// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';

import { TelemetryService } from 'services';
import { DeviceIcon } from './deviceIcon';
import { RulesGrid, rulesColumnDefs } from 'components/pages/rules/rulesGrid';
import { translateColumnDefs } from 'utilities';
import {
  Flyout,
  FlyoutHeader,
  FlyoutTitle,
  FlyoutCloseBtn,
  FlyoutContent,
  FlyoutSection,
  SectionHeader,
  SectionDesc,
  BasicGrid as Grid,
  BasicRow as Row,
  BasicHeaderCell as HeaderCell,
  BasicCell as Cell
} from 'components/shared';

import './deviceDetails.css';

export class DeviceDetails extends Component {
  constructor(props) {
    super(props);
    this.state = { alarms: undefined, isAlarmsPending: false, alarmsError: undefined };
    this.columnDefs = [
      rulesColumnDefs.ruleName,
      rulesColumnDefs.severity,
      rulesColumnDefs.explore
    ];
  }

  componentDidMount() {
    if (!this.props.rulesLastUpdated) this.props.fetchRules();
    this.fetchAlarms((this.props.device || {}).id)
  }

  componentWillReceiveProps(nextProps) {
    this.fetchAlarms((nextProps.device || {}).id)
  }

  applyRuleNames = (alarms, rules) =>
    alarms.map(alarm => ({
      ...alarm,
      name: (rules[alarm.ruleId] || {}).name
    }));

  fetchAlarms = (deviceId) => {
    this.setState({ isAlarmsPending: true });
    TelemetryService.getAlarms({
      limit: 5,
      order: "desc",
      devices: deviceId
    })
      .subscribe(
      alarms => this.setState({ alarms, isAlarmsPending: false, alarmsError: undefined }),
      alarmsError => this.setState({ alarmsError, isAlarmsPending: false })
      );
  }

  render() {
    const { t, onClose, device } = this.props;
    const isPending = this.state.isAlarmsPending && this.props.isRulesPending;
    const rulesGridProps = {
      rowData: isPending ? undefined : this.applyRuleNames(this.state.alarms || [], this.props.rules || []),
      t: this.props.t,
      columnDefs: translateColumnDefs(this.props.t, this.columnDefs)
    };
    return (
      <Flyout>
        <FlyoutHeader>
          <FlyoutTitle>{t('devices.details.title')}</FlyoutTitle>
          <FlyoutCloseBtn onClick={onClose} />
        </FlyoutHeader>
        <FlyoutContent>
          {
            !device &&
            <div className="device-details-container">{t("devices.details.noDevice")}</div>
          }
          {
            !!device &&
            <div className="device-details-container">

              <Grid className="device-details-header">
                <Row>
                  <Cell className="col-3"><DeviceIcon type={device.type} /></Cell>
                  <Cell className="col-7">
                    <div className="device-name">{device.id}</div>
                    <div className="device-simulated">{device.isSimulated ? t('devices.details.simulated') : t('devices.details.notSimulated')}</div>
                    <div className="device-connected">{device.connected ? t('devices.details.connected') : t('devices.details.notConnected')}</div>
                  </Cell>
                </Row>
              </Grid>

              {(!this.state.isAlarmsPending && this.state.alarms && (this.state.alarms.length > 0)) && <RulesGrid {...rulesGridProps} />}

              <FlyoutSection>
                <SectionHeader>{t('devices.details.telemetry.title')}</SectionHeader>
                TODO: Add chart when able..
              </FlyoutSection>

              <FlyoutSection>
                <SectionHeader>{t('devices.details.tags.title')}</SectionHeader>
                <SectionDesc>{t('devices.details.tags.description')}</SectionDesc>
                <Grid className="section-content">
                  <Row>
                    <HeaderCell className="col-3">{t('devices.details.tags.keyHeader')}</HeaderCell>
                    <HeaderCell className="col-7">{t('devices.details.tags.valueHeader')}</HeaderCell>
                  </Row>
                  {
                    (Object.entries(device.tags) || []).map((item, idx) =>
                      <Row key={idx}>
                        <Cell className="col-3">{item[0]}</Cell>
                        <Cell className="col-7">{item[1].toString()}</Cell>
                      </Row>
                    )
                  }
                </Grid>
              </FlyoutSection>

              <FlyoutSection>
                <SectionHeader>{t('devices.details.methods.title')}</SectionHeader>
                <SectionDesc>{t('devices.details.methods.description')}</SectionDesc>
                <Grid className="section-content">
                  {
                    ((device.methods || '').split(',') || []).map((item, idx) =>
                      <Row key={idx}>
                        <Cell>{item}</Cell>
                      </Row>
                    )
                  }
                </Grid>
              </FlyoutSection>

              <FlyoutSection>
                <SectionHeader>{t('devices.details.properties.title')}</SectionHeader>
                <SectionDesc>{t('devices.details.properties.description')}</SectionDesc>
                <Grid className="section-content">
                  <Row>
                    <HeaderCell className="col-3">{t('devices.details.properties.keyHeader')}</HeaderCell>
                    <HeaderCell className="col-7">{t('devices.details.properties.valueHeader')}</HeaderCell>
                  </Row>
                  {
                    (Object.entries(device.properties) || []).map((item, idx) =>
                      <Row key={idx}>
                        <Cell className="col-3">{item[0]}</Cell>
                        <Cell className="col-7">{item[1].toString()}</Cell>
                      </Row>
                    )
                  }
                </Grid>
              </FlyoutSection>

              <FlyoutSection>
                <SectionHeader>{t('devices.details.diagnostics.title')}</SectionHeader>
                <SectionDesc>{t('devices.details.diagnostics.description')}</SectionDesc>
                TODO: Add diagnostics.
              </FlyoutSection>
            </div>
          }
        </FlyoutContent>
      </Flyout>
    );
  }
}
