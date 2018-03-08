// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';

import './deviceDetails.css';
import { Section } from './section';
import { MethodList } from './methodList';
import { PropertyList } from './propertyList';

export class DeviceDetailsTemp extends Component {
  render() {
    const { t, device } = this.props;
    return (
      !!device &&
      <div className="device-details-container">
        <Section title="Rules">
          <div>TODO: Add Rules Grid. Remove section.</div>
        </Section>
        <Section title={t('devices.details.telemetry.title')} description={t('devices.details.telemetry.description')}>
          <div>TODO: Add chart when able.</div>
        </Section>
        <Section title={t('devices.details.tags.title')} description={t('devices.details.tags.description')}>
          <PropertyList t={t} pairs={device.tags} />
        </Section>
        <Section title={t('devices.details.methods.title')} description={t('devices.details.methods.description')}>
          <MethodList t={t} list={!!device.methods && device.methods.split(',')} />
        </Section>
        <Section title={t('devices.details.properties.title')} description={t('devices.details.properties.description')}>
          <PropertyList t={t} pairs={device.properties} />
        </Section>
      </div>
    );
  }
}
