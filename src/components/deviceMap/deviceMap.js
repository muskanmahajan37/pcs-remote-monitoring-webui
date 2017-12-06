// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as actions from '../../actions';
import LbsMap from './lbsMap';
import RegionDetails from '../../components/deviceMap/regionDetails.js';
import { Row, Col } from 'react-bootstrap';
import lang from '../../common/lang';
import DashboardPanel from '../dashboardPanel/dashboardPanel';

import './deviceMap.css';

class DeviceMap extends Component {
  constructor(props) {
    super(props);
    this.state = { geoJson: null };
  }

  componentWillReceiveProps(nextProps) {
    this.applyPropsToState(nextProps);
  }

  componentWillMount() {
    this.applyPropsToState(this.props);
  }

  applyPropsToState(props) {
    const {devices, telemetryByDeviceGroup, alarmList} = props;
    if (!devices || !telemetryByDeviceGroup || !alarmList) return;  //the data is not loaded yet, return
    const geoJson = {type: "FeatureCollection", features: []};
      //If control reaches here, that means map is loaded and also the data is also loaded.
    geoJson.features = devices.items.map(device => {
      let id, latitude, longitude, severity;
      id = device.Id;
      telemetryByDeviceGroup.Items.some(telemetryGroup => {
        /**
        Bing Map renders the devices only if the devices have longitude and latitude.
        If not we are not showing the devices on Map (all devices don't have the longitude and latitude).
        */
        if (device.Id === telemetryGroup.DeviceId) {
          if (
            telemetryGroup.Data &&
            telemetryGroup.Data.latitude &&
            telemetryGroup.Data.longitude
          ) {
            latitude = telemetryGroup.Data.latitude;
            longitude = telemetryGroup.Data.longitude;
          } else if (device.Properties.Reported) {
            latitude = device.Properties.Reported.Latitude;
            longitude = device.Properties.Reported.Longitude;
          }
          return true; //stop looping
        }
        return false;
      });
      alarmList.some(alarm => {
        if (device.Id === alarm.DeviceId) {
          severity = alarm.Rule.Severity;
        }
        return true; //stop looping
      });

      return {
        "type": "Feature",
         "properties": {
           "description": id,
           severity: severity
         },
         "geometry": {
             "type": "Point",
             "coordinates": [longitude, latitude ]
         }
      };
    });

    this.setState({ geoJson : geoJson });
  }

  render() {
    return (
      <DashboardPanel title={lang.DEVICELOCATION}
        className="map-container">
        <Row>
          <RegionDetails {...this.props} />
          {
            this.state.geoJson !== null &&
            <Col md={9} className="bing-map">
              <LbsMap geoJson={this.state.geoJson} />
            </Col>
          }
        </Row>
      </DashboardPanel>
    );
  }
}

const mapStateToProps = state => {
  return {
    error: state.mapReducer.error || state.deviceReducer.error,
    showHeaderSpinner: state.indicatorReducer.kpi,
    showContentSpinner: state.indicatorReducer.kpiInitial,
    telemetryByDeviceGroup: state.deviceReducer.telemetryByDeviceGroup
  };
};

const mapDispatchToProps = dispatch => {
  return {
    actions: bindActionCreators(actions, dispatch)
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DeviceMap);
