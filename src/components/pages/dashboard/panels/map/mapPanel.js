// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import update from 'immutability-helper';

import { Indicator } from 'components/shared';
import {
  Panel,
  PanelHeader,
  PanelHeaderLabel,
  PanelContent,
  PanelOverlay,
  PanelError
} from 'components/pages/dashboard/panel';

import './mapPanel.css';

const atlas = window.atlas;
const nominalDeviceLayer = 'devices-nominal-layer';
const warningDevicesLayer = 'devices-critical-layer';
const criticalDevicesLayer = 'devices-critical-layer';

const deviceToMapPin = ({ id, properties, type }) =>
  new atlas.data.Feature(
    new atlas.data.Point([properties.longitude, properties.latitude]),
    {
      name: id,
      address: properties.location || '',
      type
    }
  );

export class MapPanel extends Component {

  componentDidMount() {
    if (this.props.azureMapsKey) {
      const seattlePosition = new atlas.data.Position(-122.3320708, 47.6062);
      this.map = new atlas.Map('map', {
        'subscription-key': this.props.azureMapsKey,
        center: seattlePosition,
        zoom: 11
      });

      this.map.addPins([], {
        name: nominalDeviceLayer,
        cluster: true,
        icon: 'pin-blue'
      });

      this.map.addPins([], {
        name: warningDevicesLayer,
        cluster: true,
        icon: 'pin-darkblue'
      });

      this.map.addPins([], {
        name: criticalDevicesLayer,
        cluster: true,
        icon: 'pin-red'
      });

      // this.map.addEventListener("click", deviceLayer, ({ features: [ pin ] }) => {
      //   console.log("Clicked on ", pin);
      // });

      this.calculatePins(this.props, true);
    }
  }

  componentWillReceiveProps(nextProps) {
    this.calculatePins(nextProps);
  }

  calculatePins(props, initialCall = false) {
    const deviceIds = Object.keys(props.devices);
    const prevDeviceIds = Object.keys(this.props.devices);
    const alarmDeviceIds = Object.keys(props.devicesInAlarm);
    const prevAlarmDeviceIds = Object.keys(this.props.devicesInAlarm);
    const noNewDevices = deviceIds.join() === prevDeviceIds.join();
    if (
      !initialCall
      && noNewDevices
      && alarmDeviceIds.join() === prevAlarmDeviceIds.join()
    ) return;

    const geoLocatedDevices = deviceIds
      .map(key => props.devices[key])
      .filter(({ properties }) => properties.latitude && properties.longitude);

    const splitDevices  = geoLocatedDevices
      .reduce(
        (acc, device) => {
          if (device.id in props.devicesInAlarm) {
            return update(acc, {
              [props.devicesInAlarm[device.id].severity]: { $push: [deviceToMapPin(device)] }
            });
          } else {
            return update(acc, {
              normal: { $push: [deviceToMapPin(device)] }
            });
          }
        },
        { normal: [], warning: [], critical: [] }
      );

    const devicePins = geoLocatedDevices.map(deviceToMapPin);

    if (this.map && devicePins.length) {
      this.map.addPins(splitDevices.normal, { name: nominalDeviceLayer, overwrite: true });
      this.map.addPins(splitDevices.warning, { name: warningDevicesLayer, overwrite: true });
      this.map.addPins(splitDevices.critical, { name: criticalDevicesLayer, overwrite: true });

      if (!noNewDevices) {
        const lons = [];
        const lats = [];
        devicePins.forEach(({ geometry: { coordinates: [ longitude, latitude ] } }) => {
          lons.push(longitude);
          lats.push(latitude);
        });

        const swLon = Math.min.apply(null, lons);
        const swLat = Math.min.apply(null, lats);
        const neLon = Math.max.apply(null, lons);
        const neLat = Math.max.apply(null, lats);

        // Zoom the map to the bounding box of the devices
        this.map.setCameraBounds({
          bounds: [swLon, swLat, neLon, neLat],
          padding: 50
        });
      }
    }
  }

  zoomIn = () => {
    if (this.map) {
      const currZoom = this.map.getCamera().zoom;
      this.map.setCamera({ zoom: currZoom + 1 });
    }
  }

  zoomOut = () => {
    if (this.map) {
      const currZoom = this.map.getCamera().zoom;
      this.map.setCamera({ zoom: currZoom - 1 });
    }
  }

  render() {
    const { t, isPending, devices, error } = this.props;
    const showOverlay = isPending && !Object.keys(devices).length;
    return (
      <Panel className="map-panel-container">
        <PanelHeader>
          <PanelHeaderLabel>{t('dashboard.panels.map.header')}</PanelHeaderLabel>
          { !showOverlay && isPending && <Indicator size="small" /> }
        </PanelHeader>
        <PanelContent className="map-panel-container">
          <div id="map"></div>
          <button className="zoom-btn zoom-in" onClick={this.zoomIn}>+</button>
          <button className="zoom-btn zoom-out" onClick={this.zoomOut}>-</button>
        </PanelContent>
        { showOverlay && <PanelOverlay><Indicator /></PanelOverlay> }
        { !this.props.azureMapsKey && <PanelError>{t('dashboard.panels.map.notConfiguredError')}</PanelError> }
        { error && <PanelError>{t(error.message)}</PanelError> }
      </Panel>
    );
  }
}
